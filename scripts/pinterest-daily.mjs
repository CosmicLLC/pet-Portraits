// Daily Pinterest pin worker. Pops the next N briefs from the queue,
// renders each to a 1000×1500 PNG, uploads to Pinterest via API v5
// (sandbox endpoint), then moves successful uploads to the published log.
//
// Designed to be run on a schedule — daily via Claude Code's /loop command,
// Windows Task Scheduler, Vercel Cron, or any cron. Idempotent: if the
// upload of one pin fails, the brief stays in the queue and re-tries the
// next run. Failed pins are also logged separately so they don't endlessly
// retry if the failure is permanent (e.g., a deleted destination URL).
//
// Usage:
//   node scripts/pinterest-daily.mjs              # uploads 3 from queue (default)
//   node scripts/pinterest-daily.mjs --batch=5    # uploads 5
//   node scripts/pinterest-daily.mjs --dry-run    # render but don't upload
//
// Loop daily (in Claude Code, while session is open):
//   /loop 1d node scripts/pinterest-daily.mjs --batch=2
//
// Production daily (Vercel Cron — see vercel.json):
//   Wire /api/cron/pinterest-publish to invoke the same logic.
//
// Queue file:    docs/marketing/pinterest/queue.json
// Published log: docs/marketing/pinterest/published.json
// Failed log:    docs/marketing/pinterest/failed.json
// Board cache:   docs/marketing/pinterest/generated/_board-ids.json

import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PINS_DIR = path.join(ROOT, "docs", "marketing", "pinterest");
const SAMPLES_DIR = path.join(ROOT, "public", "examples");
const QUEUE = path.join(PINS_DIR, "queue.json");
const PUBLISHED = path.join(PINS_DIR, "published.json");
const FAILED = path.join(PINS_DIR, "failed.json");
const BOARDS_CACHE = path.join(PINS_DIR, "generated", "_board-ids.json");

const W = 1000;
const H = 1500;
const CREAM = "#FAF7F2";
const GREEN = "#2D4A3E";
const GOLD = "#C9A671";

const STYLE_FILE = {
  watercolor: "watercolor.png",
  oil: "oil.png",
  renaissance: "renaissance.png",
  lineart: "lineart.png",
};

// ─── Args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const batchArg = args.find((a) => a.startsWith("--batch="));
const BATCH = batchArg ? Math.max(1, parseInt(batchArg.split("=")[1], 10)) : 3;

// ─── Load .env.local ───────────────────────────────────────────────────────
async function loadEnv() {
  try {
    const text = await fs.readFile(path.join(ROOT, ".env.local"), "utf-8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      const [, key, value] = m;
      if (!process.env[key]) {
        process.env[key] = value.replace(/^["']|["']$/g, "").trim();
      }
    }
  } catch {}
}

// ─── Pinterest API client ──────────────────────────────────────────────────
const API = process.env.PINTEREST_API_BASE || "https://api-sandbox.pinterest.com/v5";

async function pinterest(pathname, opts = {}) {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token) throw new Error("PINTEREST_ACCESS_TOKEN not set in .env.local");
  const url = pathname.startsWith("http") ? pathname : `${API}${pathname}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  let attempt = 0;
  while (true) {
    const res = await fetch(url, { ...opts, headers });
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("Retry-After") || "60");
      const wait = Math.max(retryAfter, 60);
      console.log(`  ⏳ rate-limited, sleeping ${wait}s…`);
      await new Promise((r) => setTimeout(r, wait * 1000));
      attempt++;
      if (attempt > 5) throw new Error("Rate-limited 5x — aborting");
      continue;
    }
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) {
      const detail = json?.message || json?.error_description || text || res.statusText;
      throw new Error(`Pinterest ${pathname} ${res.status}: ${detail}`);
    }
    return json;
  }
}

// ─── Board management (reuses cache from upload-pinterest-pins.mjs) ────────
async function loadBoardCache() {
  try {
    const text = await fs.readFile(BOARDS_CACHE, "utf-8");
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function saveBoardCache(cache) {
  await fs.mkdir(path.dirname(BOARDS_CACHE), { recursive: true });
  await fs.writeFile(BOARDS_CACHE, JSON.stringify(cache, null, 2));
}

function suffixCandidates(name) {
  return [
    name,
    `${name} — Studio`,
    `${name} | Paw Masterpiece`,
    `${name} 2026`,
    `${name} Gallery`,
  ];
}

async function tryCreateBoard(name) {
  try {
    const created = await pinterest("/boards", {
      method: "POST",
      body: JSON.stringify({
        name,
        description: `Custom pet portrait art from Paw Masterpiece. ${name}.`,
        privacy: "PUBLIC",
      }),
    });
    return { ok: true, board: created };
  } catch (err) {
    if (/already have a board/i.test(err.message)) return { ok: false, conflict: true };
    return { ok: false, conflict: false, error: err.message };
  }
}

async function ensureBoard(name, cache) {
  if (cache[name]) return cache[name];
  for (const candidate of suffixCandidates(name)) {
    const result = await tryCreateBoard(candidate);
    if (result.ok) {
      const entry = { id: result.board.id, finalName: candidate };
      cache[name] = entry;
      await saveBoardCache(cache);
      console.log(`  + Created board "${candidate}" → ${result.board.id}`);
      return entry;
    }
    if (!result.conflict) {
      throw new Error(`Board creation failed for "${candidate}": ${result.error}`);
    }
  }
  throw new Error(`Could not create any variant of "${name}"`);
}

// ─── PNG rendering ─────────────────────────────────────────────────────────
function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildOverlaySvg(spec) {
  const eyebrow = escapeXml(spec.eyebrow || "");
  const titleA = escapeXml(spec.titleA || "");
  const titleB = escapeXml(spec.titleB || "");
  const tagline = escapeXml(spec.tagline || "");
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
    <text x="60" y="1100" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="700" fill="${GOLD}" letter-spacing="4">${eyebrow}</text>
    <text x="60" y="1190" font-family="Georgia, 'Times New Roman', serif" font-size="68" font-weight="700" fill="${CREAM}" letter-spacing="-1">${titleA}</text>
    <text x="60" y="1270" font-family="Georgia, 'Times New Roman', serif" font-size="68" font-weight="700" fill="${CREAM}" letter-spacing="-1">${titleB}</text>
    <text x="60" y="1340" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="${CREAM}" opacity="0.88">${tagline}</text>
    <text x="60" y="1430" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="${CREAM}" opacity="0.85" letter-spacing="2">pawmasterpiece.com</text>
  </svg>`;
}

async function renderPin(spec) {
  const filename = STYLE_FILE[spec.style] || STYLE_FILE.watercolor;
  const samplePath = path.join(SAMPLES_DIR, filename);
  const sampleBuf = await fs.readFile(samplePath);
  const baseImage = await sharp(sampleBuf)
    .resize(W, H, { fit: "cover", position: "centre" })
    .toBuffer();
  const overlaySvg = Buffer.from(buildOverlaySvg(spec));
  return sharp(baseImage)
    .composite([{ input: overlaySvg }])
    .png({ quality: 92 })
    .toBuffer();
}

// ─── Pin upload ────────────────────────────────────────────────────────────
async function uploadPin({ buffer, boardId, title, description, link, altText }) {
  const b64 = buffer.toString("base64");
  return pinterest("/pins", {
    method: "POST",
    body: JSON.stringify({
      board_id: boardId,
      title: String(title).slice(0, 100),
      description: String(description).slice(0, 500),
      alt_text: String(altText).slice(0, 500),
      link,
      media_source: {
        source_type: "image_base64",
        content_type: "image/png",
        data: b64,
      },
    }),
  });
}

// ─── Queue management ──────────────────────────────────────────────────────
async function loadJson(p, fallback = []) {
  try {
    return JSON.parse(await fs.readFile(p, "utf-8"));
  } catch {
    return fallback;
  }
}

async function saveJson(p, data) {
  await fs.writeFile(p, JSON.stringify(data, null, 2));
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  await loadEnv();
  if (!process.env.PINTEREST_ACCESS_TOKEN) {
    console.error("❌ PINTEREST_ACCESS_TOKEN missing. Add it to .env.local.");
    process.exit(1);
  }

  const queue = await loadJson(QUEUE, []);
  if (!Array.isArray(queue) || queue.length === 0) {
    console.log(`📭 Queue is empty (${QUEUE}). Nothing to upload today.`);
    console.log("  Add briefs to the queue and run again.");
    return;
  }

  const published = await loadJson(PUBLISHED, []);
  const failed = await loadJson(FAILED, []);
  const todays = queue.slice(0, BATCH);
  console.log(`📋 Queue: ${queue.length} pending. Processing ${todays.length} today.`);

  // Verify connection (cheap and confirms token is still valid)
  if (!DRY_RUN) {
    try {
      const me = await pinterest("/user_account");
      console.log(`🔌 Connected as @${me.username}`);
    } catch (err) {
      console.error(`❌ Pinterest auth failed: ${err.message}`);
      console.error("  Token may have expired. Regenerate at developers.pinterest.com.");
      process.exit(1);
    }
  }

  const cache = await loadBoardCache();
  const remaining = [...queue];
  const stillFailing = [...failed];

  for (const brief of todays) {
    const label = `pin ${brief.n} (${brief.board.slice(0, 24)})`;
    process.stdout.write(`  ${label.padEnd(40)} … `);

    try {
      // 1) Resolve board ID
      const board = DRY_RUN
        ? { id: "DRY-RUN" }
        : await ensureBoard(brief.board, cache);
      // 2) Render PNG
      const png = await renderPin(brief);
      // 3) Upload
      if (DRY_RUN) {
        console.log(`✓ [dry-run] would upload to board "${brief.board}"`);
        continue;
      }
      const pin = await uploadPin({
        buffer: png,
        boardId: board.id,
        title: brief.seoTitle,
        description: brief.description,
        link: `https://pawmasterpiece.com${brief.url}`,
        altText: brief.altText,
      });
      console.log(`✓ ${pin.id}`);
      published.push({
        ...brief,
        publishedAt: new Date().toISOString(),
        pinId: pin.id,
        boardId: board.id,
      });
      // Remove from remaining queue
      const idx = remaining.findIndex((b) => b.n === brief.n);
      if (idx !== -1) remaining.splice(idx, 1);
    } catch (err) {
      console.log(`❌ ${err.message.slice(0, 100)}`);
      stillFailing.push({
        ...brief,
        failedAt: new Date().toISOString(),
        error: err.message.slice(0, 500),
      });
      // Remove from remaining queue so we don't endlessly retry
      const idx = remaining.findIndex((b) => b.n === brief.n);
      if (idx !== -1) remaining.splice(idx, 1);
    }
    // Polite pacing
    if (!DRY_RUN) await new Promise((r) => setTimeout(r, 1000));
  }

  // Persist state (skip in dry-run mode)
  if (!DRY_RUN) {
    await saveJson(QUEUE, remaining);
    await saveJson(PUBLISHED, published);
    if (stillFailing.length > failed.length) await saveJson(FAILED, stillFailing);
    console.log(`\n📊 Queue now has ${remaining.length} pending · ${published.length} total published.`);
    if (stillFailing.length > failed.length) {
      console.log(`⚠️  ${stillFailing.length - failed.length} new failures logged to ${FAILED}`);
    }
  }
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err.message);
  process.exit(1);
});
