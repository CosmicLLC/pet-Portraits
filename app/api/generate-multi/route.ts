import { NextRequest, NextResponse } from "next/server";
import { STYLE_KEYS, type StyleKey } from "@/lib/gemini";
import {
  MIN_PETS,
  MAX_PETS,
  encodeMultiImageId,
  generateMultiPetPortrait,
  sanitizePetName,
} from "@/lib/gemini-multi";
import { applyWatermark } from "@/lib/watermark";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { logEvent } from "@/lib/events";
import { trackPreviewGeneratedServer, extractUserContext } from "@/lib/server-pixels";

// Multi-pet sends 2-4 input images + style ref + long prompt, so Gemini
// takes longer than single-pet. Mirror the wallpaper ceiling (180s) to
// leave headroom for 4-pet calls.
export const maxDuration = 180;

// Multi-pet generation endpoint. Fully PARALLEL to /api/generate so that
// the single-pet code path stays byte-identical to today. Accepts 2–4
// pet photos plus optional names, returns a watermarked composite
// portrait with a multi-pet-encoded imageId so checkout can apply the
// +$15-per-extra-pet surcharge without a DB lookup.

const BOT_UA =
  /(^\s*$|\bcurl\b|\bwget\b|\bpython-requests\b|\bpython-urllib\b|\bGo-http-client\b|\bJava\/|\bScrapy\b|\bnode-fetch\b|\baxios\b|\bbot\b|\bcrawler\b|\bspider\b)/i;

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

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // ── Anti-abuse layers (same shape as /api/generate) ────────────────
    const ua = req.headers.get("user-agent") || "";
    if (BOT_UA.test(ua)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!sameOrigin(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ip = clientIp(req.headers);

    // Per-IP rate limit. Multi-pet is more expensive (more input images,
    // larger Gemini context), so cap a bit tighter than single-pet's 20/min.
    const limit = await rateLimit(`generate-multi:${ip}`, 10, 60);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests — please wait a moment and try again." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        }
      );
    }

    // Shares the same global daily cap bucket as single-pet so a single
    // bot can't bypass the spend ceiling by alternating endpoints.
    const dailyCap = Number(process.env.DAILY_GENERATE_CAP || "1500");
    const today = new Date().toISOString().slice(0, 10);
    const daily = await rateLimit(
      `generate:global:${today}`,
      dailyCap,
      24 * 60 * 60
    );
    if (!daily.ok) {
      console.error(
        `Daily generation cap (${dailyCap}) reached — blocking multi-pet request from ${ip}`
      );
      return NextResponse.json(
        { error: "Service is busy — please try again tomorrow." },
        {
          status: 503,
          headers: { "Retry-After": String(daily.retryAfterSeconds) },
        }
      );
    }

    // ── Parse + validate inputs ────────────────────────────────────────
    const formData = await req.formData();
    const style = formData.get("style") as string | null;
    const petCountRaw = formData.get("petCount") as string | null;

    if (!style || !STYLE_KEYS.includes(style as StyleKey)) {
      return NextResponse.json({ error: "Invalid style" }, { status: 400 });
    }

    const petCount = Number(petCountRaw);
    if (!Number.isInteger(petCount) || petCount < MIN_PETS || petCount > MAX_PETS) {
      return NextResponse.json(
        { error: `petCount must be between ${MIN_PETS} and ${MAX_PETS}` },
        { status: 400 }
      );
    }

    // Collect petN photos + optional names. Each index 0..petCount-1 must
    // have an image; names are optional per-pet.
    const buffers: Buffer[] = [];
    const names: string[] = [];
    for (let i = 0; i < petCount; i++) {
      const file = formData.get(`image${i}`) as File | null;
      if (!file) {
        return NextResponse.json(
          { error: `Missing image for pet ${i + 1}` },
          { status: 400 }
        );
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Pet ${i + 1}: invalid file type. Please upload a JPG, PNG, or WebP.`,
          },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `Pet ${i + 1}: file too large. Maximum size is 10MB.` },
          { status: 400 }
        );
      }
      buffers.push(Buffer.from(await file.arrayBuffer()));

      const rawName = (formData.get(`name${i}`) as string | null) ?? "";
      names.push(sanitizePetName(rawName));
    }

    // ── Generate ──────────────────────────────────────────────────────
    const fullResBuffer = await generateMultiPetPortrait(
      buffers,
      style as StyleKey,
      names
    );

    // ── Store + watermark ─────────────────────────────────────────────
    // imageId encodes the pet count so /api/create-checkout can apply
    // the multi-pet surcharge without a database lookup.
    const imageId = encodeMultiImageId(petCount, uuidv4());

    await put(`portraits/${imageId}.png`, fullResBuffer, {
      access: "private",
      addRandomSuffix: true,
      contentType: "image/png",
    });

    const watermarkedBuffer = await applyWatermark(fullResBuffer);
    const watermarkedBase64 = `data:image/png;base64,${watermarkedBuffer.toString("base64")}`;

    // Same soft-conversion server pixel as single-pet, tagged for analytics.
    trackPreviewGeneratedServer({
      imageId,
      style: `${style}-multi${petCount}`,
      user: extractUserContext(req),
      sourceUrl: req.headers.get("referer") || undefined,
    }).catch(() => {});

    await logEvent("info", "generate-multi", "Multi-pet portrait generated", {
      petCount,
      style,
      hasNames: names.some((n) => n.length > 0),
      imageId,
    }).catch(() => {});

    return NextResponse.json({
      watermarkedImage: watermarkedBase64,
      imageId,
      petCount,
    });
  } catch (error) {
    console.error("Multi-pet generate error:", error);
    await logEvent("error", "generate-multi", "Multi-pet generation failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.slice(0, 1500) : undefined,
    }).catch(() => {});
    return NextResponse.json(
      {
        error:
          "Generation failed — please try again or use clearer photos for each pet.",
      },
      { status: 500 }
    );
  }
}
