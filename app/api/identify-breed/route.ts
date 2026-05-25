import { NextRequest, NextResponse } from "next/server";
import { identifyBreed } from "@/lib/gemini";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { logEvent } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Gemini Flash text calls finish in 2-5s typically. 30s ceiling.
export const maxDuration = 30;

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB upload cap

// Free top-of-funnel breed identifier. Rate-limited to deter scraping
// but kept low-friction enough that backlink-worthy share URLs work.
// No email gate — the funnel is portrait-creator, not list-building.
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limit = await rateLimit(`identify-breed:${ip}`, 12, 60);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const file = formData.get("photo");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing photo upload" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image too large — please upload a photo under 10MB." },
      { status: 413 }
    );
  }
  const mimeType = file.type || "image/jpeg";
  if (!/^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(mimeType)) {
    return NextResponse.json(
      { error: "Unsupported file format — please upload JPG, PNG, WebP, or HEIC." },
      { status: 415 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await identifyBreed(buffer, mimeType);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("Breed identification failed:", err);
    await logEvent("error", "breed-identifier", "Identification failed", {
      ip,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "We couldn't identify this photo. Try a clearer shot of the pet's face." },
      { status: 500 }
    );
  }
}
