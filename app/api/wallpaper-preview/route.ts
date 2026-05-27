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
  try {
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
    const color = WALLPAPER_PALETTE.find((c) => c.hex.toLowerCase() === bgHex)!;

    const photoBuffer = Buffer.from(await file.arrayBuffer());

    // 1) Generate the square minimalist portrait with the chosen bg color
    const squarePortrait = await generateWallpaperPortrait(
      photoBuffer,
      color.name,
      color.hex
    );

    // 2) Extend to phone aspect (1290 × 2796) with edge-sampled bg
    const phoneAspect = await composePhoneWallpaper(squarePortrait);

    // 3) Persist the unwatermarked phone-aspect version to private blob —
    // the webhook fetches this on successful purchase and serves it via the
    // signed download endpoint. We store the already-composed phone image
    // (not the source square) so post-purchase fulfillment is just a copy.
    const imageId = uuidv4();
    // Store as private — the unwatermarked HD wallpaper. Served only via
    // the signed /api/download/[orderId]?type=wallpaper endpoint after
    // purchase. Matches the pattern used for portrait blobs.
    const blob = await put(
      `wallpapers/${imageId}.jpg`,
      phoneAspect,
      { access: "private", addRandomSuffix: true, contentType: "image/jpeg" }
    );

    // 4) Watermark the phone-aspect copy for the preview the user sees.
    const watermarked = await applyWatermark(phoneAspect);
    const watermarkedDataUrl = `data:image/jpeg;base64,${watermarked.toString("base64")}`;

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
    await logEvent("error", "wallpaper-preview", "Generation failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Wallpaper generation failed — try a clearer photo of your pet." },
      { status: 500 }
    );
  }
}
