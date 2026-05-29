import { NextRequest, NextResponse } from "next/server";
import {
  generateWallpaperPortrait,
  WALLPAPER_PALETTE,
  isValidWallpaperHex,
} from "@/lib/gemini";
import { composePhoneWallpaper } from "@/lib/wallpaper-compose";
import { applyWatermark } from "@/lib/watermark";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { logEvent } from "@/lib/events";
import sharp from "sharp";

// Defense-in-depth: every Sharp op wrapped with a 20s hard ceiling.
// If anything ever regresses (a Sharp version bug, a huge image, a
// pathological input), we get a clean catch-block error instead of a
// 300s function timeout that bypasses our logging.
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} exceeded ${ms}ms`)), ms)
    ),
  ]);
}

export const runtime = "nodejs";
// 300s ceiling (Pro plan max — same as admin/campaigns). Measured
// pipeline: ~117s on dev; prod cold starts + iad1↔Gemini latency
// pushed past 180s, hitting FUNCTION_INVOCATION_TIMEOUT. Gemini
// image-generation latency is the dominant + variable factor.
// If we still see timeouts, refactor to async fire-and-poll.
export const maxDuration = 300;

const MAX_BYTES = 15 * 1024 * 1024;

// Same bot-detection + same-origin guard as /api/generate. The wallpaper
// pipeline is slightly cheaper than full portraits (single Gemini call,
// no reference image, simpler prompt) but still costs real money per gen
// so we keep the rate limits aggressive.
const BOT_UA = /(^\s*$|\bcurl\b|\bwget\b|\bpython-requests\b|\bpython-urllib\b|\bGo-http-client\b|\bJava\/|\bScrapy\b|\bnode-fetch\b|\baxios\b|\bbot\b|\bcrawler\b|\bspider\b)/i;

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("host") || "";
  const allowed = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXTAUTH_URL,
    `https://${host}`,
    `http://${host}`,
  ]
    .filter(Boolean)
    .map((u) => (u as string).replace(/\/$/, ""));
  return allowed.some((a) => origin.replace(/\/$/, "") === a);
}

export async function POST(req: NextRequest) {
  // Diagnostic trace — writes each step + elapsed-ms to EventLog so we
  // can see EXACTLY where the prod pipeline hangs without needing
  // Vercel function logs (which the CLI has been returning empty).
  // Each step's "info" entry is a tombstone: if the last EventLog row
  // for this traceId says "step X complete", the function died at
  // step X+1. fire-and-forget so logging itself doesn't block the
  // request flow.
  const traceId = Math.random().toString(36).slice(2, 10);
  const t0 = Date.now();
  const trace = (step: string, extra?: Record<string, unknown>) => {
    const elapsed = Date.now() - t0;
    logEvent("info", "wallpaper-preview", `[${traceId}] ${step}`, {
      traceId,
      step,
      elapsedMs: elapsed,
      ...extra,
    }).catch(() => {});
  };

  try {
    trace("0_start");
    const ua = req.headers.get("user-agent") || "";
    if (BOT_UA.test(ua)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!sameOrigin(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ip = clientIp(req.headers);
    const limit = await rateLimit(`wallpaper-preview:${ip}`, 12, 60);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests — please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }
    trace("1_rate_limit_passed");

    const formData = await req.formData();
    const file = formData.get("photo");
    const bgHex = String(formData.get("bgHex") || "").toLowerCase();

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing photo upload" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image too large — please upload a photo under 15MB." },
        { status: 413 }
      );
    }
    if (!isValidWallpaperHex(bgHex)) {
      return NextResponse.json(
        { error: "Invalid background color — pick from the palette." },
        { status: 400 }
      );
    }
    trace("2_formdata_parsed", { fileSize: file.size, bgHex });

    const color = WALLPAPER_PALETTE.find((c) => c.hex.toLowerCase() === bgHex)!;
    const photoBuffer = Buffer.from(await file.arrayBuffer());
    trace("3_buffer_extracted", { bufferBytes: photoBuffer.length });

    // 1) Generate the square minimalist portrait with the chosen bg color
    const squarePortrait = await generateWallpaperPortrait(
      photoBuffer,
      color.name,
      color.hex
    );
    trace("4_generation_complete", { outputBytes: squarePortrait.length });

    // 2) Extend to phone aspect (1290 × 2796) — this is the UNwatermarked
    //    full-resolution version that goes to the paying customer.
    const phoneAspect = await withTimeout(
      composePhoneWallpaper(squarePortrait),
      20_000,
      "composePhoneWallpaper(unwatermarked)"
    );
    trace("5_phone_aspect_composed", { phoneAspectBytes: phoneAspect.length });

    // 3) Persist the unwatermarked phone-aspect version to private blob
    //    (what the webhook fetches and ships on successful purchase).
    const imageId = uuidv4();
    const blob = await withTimeout(
      put(
        `wallpapers/${imageId}.jpg`,
        phoneAspect,
        { access: "private", addRandomSuffix: true, contentType: "image/jpeg" }
      ),
      15_000,
      "blob.put"
    );
    trace("6_blob_put", { imageId });

    // 4) Watermark the SMALL square (1024×1024), NOT the big phone-aspect
    //    image. The previous order watermarked the 1290×2796 canvas which
    //    forced Sharp/librsvg to rasterize ~14-200k SVG <rect> elements
    //    onto a 3.6 megapixel surface — 14-25s with huge variance and
    //    occasional total hangs. On the 1024×1024 canvas, the same
    //    operation runs in ~1-2s deterministically (proven by the
    //    single-pet portrait flow which has always worked).
    //
    //    The customer sees a watermark on the PET portion of the image
    //    (which is the only part with ownership value). The top/bottom
    //    padding extension below has no watermark, but it's just solid
    //    background color — replicating that color is trivial in any
    //    editor, so a watermark there wouldn't add anti-theft value.
    const watermarkedSquare = await withTimeout(
      applyWatermark(squarePortrait),
      20_000,
      "applyWatermark(square)"
    );
    trace("7_watermark_applied", { watermarkedBytes: watermarkedSquare.length });

    // 5) Compose the watermarked square to phone aspect for the preview
    const watermarkedPhoneAspect = await withTimeout(
      composePhoneWallpaper(watermarkedSquare),
      20_000,
      "composePhoneWallpaper(watermarked)"
    );
    trace("8_watermarked_extended", { bytes: watermarkedPhoneAspect.length });

    // 6) Downscale + JPEG-compress for the response. The studio UI
    //    displays the preview inside a 240×480 phone-shaped frame, so
    //    full-resolution 1290×2796 (~3MB JPEG) is wasted bandwidth.
    //    Half-resolution at JPEG quality 78 is visually identical at
    //    the display size and drops the payload ~7x — kills the
    //    "response takes 30s+ to transfer over residential network"
    //    class of customer-visible failure.
    const compressed = await withTimeout(
      sharp(watermarkedPhoneAspect)
        .resize(645, 1398, { fit: "cover" })
        .jpeg({ quality: 78, mozjpeg: true })
        .toBuffer(),
      10_000,
      "compress(preview)"
    );
    trace("9_compressed", { compressedBytes: compressed.length });

    const watermarkedDataUrl = `data:image/jpeg;base64,${compressed.toString("base64")}`;
    trace("10_response_ready");

    return NextResponse.json({
      ok: true,
      imageId,
      bgHex: color.hex,
      bgName: color.name,
      preview: watermarkedDataUrl,
      sourceUrl: blob.url,
    });
  } catch (err) {
    console.error("Wallpaper preview failed:", err);
    await logEvent("error", "wallpaper-preview", `[${traceId}] FAILED`, {
      traceId,
      elapsedMs: Date.now() - t0,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.slice(0, 800) : undefined,
    });
    return NextResponse.json(
      { error: "Wallpaper generation failed — try a clearer photo of your pet." },
      { status: 500 }
    );
  }
}
