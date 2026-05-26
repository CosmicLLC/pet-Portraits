import sharp from "sharp";
import path from "path";
import fs from "fs";
import { prisma } from "@/lib/prisma";

// Shared Pinterest publishing logic — used by both the Vercel Cron daily
// uploader (/api/cron/pinterest-publish) and the CLI script
// (scripts/upload-pinterest-pins.mjs). Same render-and-upload pipeline,
// just two different entrypoints.

const W = 1000;
const H = 1500;
const CREAM = "#FAF7F2";
const GREEN = "#2D4A3E";
const GOLD = "#C9A671";

const STYLE_FILE: Record<string, string> = {
  watercolor: "watercolor.png",
  oil: "oil.png",
  renaissance: "renaissance.png",
  lineart: "lineart.png",
};

// Board name → Pinterest board ID. These were created via the API and
// hardcoded here so the cron function doesn't need to enumerate boards
// (Pinterest sandbox's GET /boards is broken — see
// scripts/upload-pinterest-pins.mjs for the workaround story).
//
// To add a new board, create it manually via the Pinterest UI, look up
// its ID via GET /v5/boards/{id}, and add to this map.
const BOARD_IDS: Record<string, string> = {
  "Renaissance Pet Portraits": "1124070456935235075",
  "Royal Dog Portraits": "1124070456935235076",
  "Custom Cat Art Gift Ideas": "1124070456935235077",
  "Pet Memorial Art": "1124070456935235078",
  "Dog Mom Gift Ideas": "1124070456935235079",
  "Watercolor Pet Paintings": "1124070456935235080",
  "Pet Wedding Portraits": "1124070456935235081",
  "Funny Dog Posters": "1124070456935235082",
};

const API_BASE = process.env.PINTEREST_API_BASE || "https://api-sandbox.pinterest.com/v5";

async function pinterestRequest(pathname: string, opts: RequestInit = {}) {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token) throw new Error("PINTEREST_ACCESS_TOKEN not set");
  const url = `${API_BASE}${pathname}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  if (res.status === 429) {
    const retry = Number(res.headers.get("Retry-After") || "60");
    throw new Error(`RATE_LIMIT:${retry}`);
  }
  const text = await res.text();
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    const j = json as { message?: string; error_description?: string } | null;
    throw new Error(`Pinterest ${pathname} ${res.status}: ${j?.message || j?.error_description || text}`);
  }
  return json as Record<string, unknown>;
}

function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildOverlaySvg(spec: {
  eyebrow: string;
  titleA: string;
  titleB: string;
  tagline: string;
}): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${GREEN}" stop-opacity="0.0"/>
        <stop offset="35%" stop-color="${GREEN}" stop-opacity="0.0"/>
        <stop offset="65%" stop-color="${GREEN}" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="${GREEN}" stop-opacity="0.92"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>
    <text x="60" y="1100" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="700" fill="${GOLD}" letter-spacing="4">${escapeXml(spec.eyebrow)}</text>
    <text x="60" y="1190" font-family="Georgia, 'Times New Roman', serif" font-size="68" font-weight="700" fill="${CREAM}" letter-spacing="-1">${escapeXml(spec.titleA)}</text>
    <text x="60" y="1270" font-family="Georgia, 'Times New Roman', serif" font-size="68" font-weight="700" fill="${CREAM}" letter-spacing="-1">${escapeXml(spec.titleB)}</text>
    <text x="60" y="1340" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="${CREAM}" opacity="0.88">${escapeXml(spec.tagline)}</text>
    <text x="60" y="1430" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="${CREAM}" opacity="0.85" letter-spacing="2">pawmasterpiece.com</text>
  </svg>`;
}

async function renderPinPng(spec: {
  style: string;
  eyebrow: string;
  titleA: string;
  titleB: string;
  tagline: string;
}): Promise<Buffer> {
  const filename = STYLE_FILE[spec.style] || STYLE_FILE.watercolor;
  const samplePath = path.join(process.cwd(), "public", "examples", filename);
  const sampleBuf = fs.readFileSync(samplePath);
  const baseImage = await sharp(sampleBuf)
    .resize(W, H, { fit: "cover", position: "centre" })
    .toBuffer();
  const overlaySvg = Buffer.from(buildOverlaySvg(spec));
  return sharp(baseImage)
    .composite([{ input: overlaySvg }])
    .png({ quality: 92 })
    .toBuffer();
}

interface PublishResult {
  attempted: number;
  published: number;
  failed: number;
  pinIds: string[];
  errors: { briefNumber: number; error: string }[];
}

/**
 * Publish the next N queued Pinterest pins. Renders each as a 1000×1500 PNG,
 * uploads via Pinterest API v5, marks status=published or failed in the DB.
 *
 * Idempotent — pins already published are skipped. If a pin fails, status
 * becomes "failed" and it won't be retried automatically.
 */
export async function publishNextPins(batchSize = 2): Promise<PublishResult> {
  const queued = await prisma.pinterestPin.findMany({
    where: { status: "queued" },
    orderBy: { briefNumber: "asc" },
    take: batchSize,
  });

  const result: PublishResult = {
    attempted: queued.length,
    published: 0,
    failed: 0,
    pinIds: [],
    errors: [],
  };

  for (const pin of queued) {
    const boardId = BOARD_IDS[pin.board];
    if (!boardId) {
      await prisma.pinterestPin.update({
        where: { id: pin.id },
        data: { status: "failed", failedAt: new Date(), error: `No board ID mapped for "${pin.board}"` },
      });
      result.failed++;
      result.errors.push({ briefNumber: pin.briefNumber, error: `unmapped board: ${pin.board}` });
      continue;
    }

    try {
      const png = await renderPinPng({
        style: pin.style,
        eyebrow: pin.eyebrow,
        titleA: pin.titleA,
        titleB: pin.titleB,
        tagline: pin.tagline,
      });
      const response = await pinterestRequest("/pins", {
        method: "POST",
        body: JSON.stringify({
          board_id: boardId,
          title: pin.seoTitle.slice(0, 100),
          description: pin.description.slice(0, 500),
          alt_text: pin.altText.slice(0, 500),
          link: pin.link,
          media_source: {
            source_type: "image_base64",
            content_type: "image/png",
            data: png.toString("base64"),
          },
        }),
      });
      const pinId = (response as { id?: string }).id || null;
      await prisma.pinterestPin.update({
        where: { id: pin.id },
        data: {
          status: "published",
          pinId,
          boardId,
          publishedAt: new Date(),
          error: null,
        },
      });
      result.published++;
      if (pinId) result.pinIds.push(pinId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Don't mark rate-limit errors as failed — they'll retry next run
      if (message.startsWith("RATE_LIMIT:")) {
        result.errors.push({ briefNumber: pin.briefNumber, error: "rate limited, will retry next run" });
        break; // stop the batch — Pinterest is throttling us
      }
      await prisma.pinterestPin.update({
        where: { id: pin.id },
        data: { status: "failed", failedAt: new Date(), error: message.slice(0, 500) },
      });
      result.failed++;
      result.errors.push({ briefNumber: pin.briefNumber, error: message.slice(0, 200) });
    }
  }

  return result;
}
