import { NextRequest, NextResponse } from "next/server";
import {
  generateWallpaperPortrait,
  WALLPAPER_PALETTE,
  isValidWallpaperHex,
} from "@/lib/gemini";
import { composePhoneWallpaper } from "@/lib/wallpaper-compose";
import { removeBackground } from "@/lib/bg-removal";
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
  // Track the last-completed step so the catch block can log WHERE the
  // pipeline died (failedAfterStep) — makes future prod failures diagnosable
  // from EventLog alone without redeploying a tracer.
  let lastStep = "0_start";
  const trace = (step: string, extra?: Record<string, unknown>) => {
    lastStep = step;
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

    // 1) Generate the square illustration (dog on ~solid bg) via Gemini.
    //    Wrapped in withTimeout for defense-in-depth: generateWallpaperPortrait
    //    now re-rolls up to 3× on stochastic empty generations (each bounded
    //    by an internal 80s ceiling), so a pathological all-hang could reach
    //    ~240s. The 200s cap keeps total pipeline well under the 300s function
    //    ceiling and yields a clean logged error instead of a hard timeout.
    const squarePortrait = await withTimeout(
      generateWallpaperPortrait(photoBuffer, color.name, color.hex),
      200_000,
      "generateWallpaperPortrait"
    );
    trace("4_generation_complete", { outputBytes: squarePortrait.length });

    // 2) Isolate the subject (fal birefnet) → transparent-bg PNG of just
    //    the pet. This is what lets us composite onto a perfectly uniform
    //    solid-color canvas, eliminating the horizontal seam the old
    //    extend-with-sampled-color approach produced. birefnet preserves
    //    light fur that a chroma-key would have eaten (validated 2026-05-28).
    const cutout = await withTimeout(
      removeBackground(squarePortrait),
      45_000,
      "removeBackground(birefnet)"
    );
    trace("5_subject_isolated", { cutoutBytes: cutout.length });

    // 3) Composite the cutout onto a clean 1290×2796 canvas filled with
    //    the EXACT requested hex. Uniform background → no seam possible.
    //    This is the UNwatermarked full-res the paying customer receives.
    const phoneAspect = await withTimeout(
      composePhoneWallpaper(cutout, color.hex),
      20_000,
      "composePhoneWallpaper"
    );
    trace("6_composed", { phoneAspectBytes: phoneAspect.length });

    // 4) Persist the unwatermarked composite to private blob (the webhook
    //    fetches this on purchase and serves it via the signed download).
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
    trace("7_blob_put", { imageId });

    // 5) Build the watermarked preview. Downscale to 645×1398 FIRST, then
    //    watermark the small canvas — watermarking the full 1290×2796 was
    //    the 14-25s bottleneck (Sharp/librsvg rasterizing SVG over a 3.6MP
    //    surface). On the half-res canvas it's ~1-2s. The watermark now
    //    covers the WHOLE frame uniformly (no top/bottom discontinuity).
    const small = await withTimeout(
      sharp(phoneAspect).resize(645, 1398, { fit: "cover" }).png().toBuffer(),
      10_000,
      "downscale(preview)"
    );
    const watermarkedSmall = await withTimeout(
      applyWatermark(small),
      15_000,
      "applyWatermark(preview)"
    );
    trace("8_watermark_applied", { watermarkedBytes: watermarkedSmall.length });

    // 6) JPEG-compress the watermarked preview for a small response payload
    //    (~100KB vs ~3MB) — keeps response transfer fast on any network.
    const compressed = await withTimeout(
      sharp(watermarkedSmall).jpeg({ quality: 78, mozjpeg: true }).toBuffer(),
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
    const errMsg = err instanceof Error ? err.message : String(err);
    await logEvent("error", "wallpaper-preview", `[${traceId}] FAILED`, {
      traceId,
      elapsedMs: Date.now() - t0,
      failedAfterStep: lastStep,
      error: errMsg,
      stack: err instanceof Error ? err.stack?.slice(0, 800) : undefined,
    });
    return NextResponse.json(
      { error: "Wallpaper generation failed — try a clearer photo of your pet." },
      { status: 500 }
    );
  }
}
