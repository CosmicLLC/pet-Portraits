import { NextRequest, NextResponse } from "next/server";
import { generatePortrait, STYLE_KEYS, type StyleKey } from "@/lib/gemini";
import { applyWatermark } from "@/lib/watermark";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { logEvent } from "@/lib/events";

export const maxDuration = 60;

// Known bot / scripting client User-Agent signatures. Won't stop a motivated
// attacker (they can spoof the header) but filters out the 90% of drive-by
// scrapers and accidental curl/python scripts hammering the endpoint.
const BOT_UA = /(^\s*$|\bcurl\b|\bwget\b|\bpython-requests\b|\bpython-urllib\b|\bGo-http-client\b|\bJava\/|\bScrapy\b|\bnode-fetch\b|\baxios\b|\bbot\b|\bcrawler\b|\bspider\b)/i;

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // some browsers omit Origin on same-origin POST
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
    // Layer 1 — reject obvious bots by User-Agent
    const ua = req.headers.get("user-agent") || "";
    if (BOT_UA.test(ua)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Layer 2 — origin must match our site (prevents cross-site abuse)
    if (!sameOrigin(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ip = clientIp(req.headers);

    // Layer 3 — per-IP rate limit: 5 calls / minute
    const limit = await rateLimit(`generate:${ip}`, 5, 60);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests — please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    // Layer 4 — global daily cap across ALL callers. Caps worst-case Gemini
    // spend from distributed IP rotation attacks. Tighten via DAILY_GENERATE_CAP.
    const dailyCap = Number(process.env.DAILY_GENERATE_CAP || "300");
    const today = new Date().toISOString().slice(0, 10);
    const daily = await rateLimit(`generate:global:${today}`, dailyCap, 24 * 60 * 60);
    if (!daily.ok) {
      console.error(`Daily generation cap (${dailyCap}) reached — blocking request from ${ip}`);
      return NextResponse.json(
        { error: "Service is busy — please try again tomorrow." },
        { status: 503, headers: { "Retry-After": String(daily.retryAfterSeconds) } }
      );
    }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const style = formData.get("style") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!style || !STYLE_KEYS.includes(style as StyleKey)) {
      return NextResponse.json({ error: "Invalid style" }, { status: 400 });
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPG, PNG, or WebP." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const fullResBuffer = await generatePortrait(buffer, style as StyleKey);

    // Store full-res in Vercel Blob with NO public access
    // Only accessible via server-side signed URL after payment
    const imageId = uuidv4();
    await put(`portraits/${imageId}.png`, fullResBuffer, {
      access: "private",
      addRandomSuffix: true,
      contentType: "image/png",
    });

    // Store the blob URL server-side — the client never sees it
    // We map imageId -> blob.url via the blob pathname
    // The imageId alone cannot be used to construct the download URL

    // Apply watermark for preview
    const watermarkedBuffer = await applyWatermark(fullResBuffer);
    const watermarkedBase64 = `data:image/png;base64,${watermarkedBuffer.toString("base64")}`;

    return NextResponse.json({ watermarkedImage: watermarkedBase64, imageId });
  } catch (error) {
    console.error("Generate error:", error);
    await logEvent("error", "generate", "Generation failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.slice(0, 1500) : undefined,
    });
    return NextResponse.json(
      { error: "Generation failed — please try again or use a clearer photo." },
      { status: 500 }
    );
  }
}
