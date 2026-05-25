// Batch-upload all 30 pre-generated Pinterest pins via Pinterest API v5.
//
// Usage:
//   1. Generate the pin PNGs first:
//      node scripts/generate-pinterest-pins.mjs
//   2. Set PINTEREST_ACCESS_TOKEN in .env.local (see README header below)
//   3. Run:
//      node scripts/upload-pinterest-pins.mjs
//
//   Flags:
//     --dry-run         Don't actually upload, just print what would happen
//     --only=1,2,3      Only upload these pin numbers
//     --no-create-boards  Don't auto-create missing boards (fail if any missing)
//
// HOW TO GET A PINTEREST ACCESS TOKEN
// ────────────────────────────────────
// 1. Go to https://developers.pinterest.com/
// 2. Sign in with your Pinterest business account
// 3. Click "My apps" → "Create app"
// 4. Fill in: app name = "Paw Masterpiece", description = "Custom pet
//    portrait studio promotion", scopes needed: boards:read, boards:write,
//    pins:read, pins:write
// 5. After creating, scroll to "Generate access token" (under app settings)
// 6. Pick scopes (check all 4 above) → "Continue" → "Authorize"
// 7. Copy the token shown (starts with "pina_..." for sandbox, longer for prod)
// 8. Paste into .env.local as:
//      PINTEREST_ACCESS_TOKEN=pina_xxxxxxxxxxx
//
// RATE LIMITS
// ────────────
// New apps are usually in "Trial Access" which is limited to your own
// boards. Trial apps still have hourly limits (~10-20 pins/hour). This
// script handles 429s by sleeping until the Retry-After header allows
// the next request — you can leave it running unattended.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PINS_DIR = path.join(ROOT, "docs", "marketing", "pinterest", "generated");
const CSV_PATH = path.join(PINS_DIR, "_upload-batch.csv");

// ─── Load .env.local manually so we don't add a dotenv dependency ─────────
async function loadEnvLocal() {
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
  } catch {
    /* .env.local missing — fall back to existing process.env */
  }
}

// ─── CLI args ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const NO_CREATE_BOARDS = args.includes("--no-create-boards");
const onlyArg = args.find((a) => a.startsWith("--only="));
const ONLY = onlyArg
  ? new Set(onlyArg.split("=")[1].split(",").map((n) => parseInt(n, 10)))
  : null;

// ─── Pinterest API client ─────────────────────────────────────────────────
// Pinterest splits prod and sandbox into separate hostnames. Sandbox tokens
// (the default for new apps, which we use) ONLY work against api-sandbox.
// Override via PINTEREST_API_BASE if you've been approved for production.
const API = process.env.PINTEREST_API_BASE || "https://api-sandbox.pinterest.com/v5";

async function pinterest(pathname, opts = {}) {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "PINTEREST_ACCESS_TOKEN missing. See header of this file for how to get one."
    );
  }
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
      if (attempt > 5) throw new Error("Rate-limited 5x in a row, giving up");
      continue;
    }
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* not JSON */
    }
    if (!res.ok) {
      const detail = json?.message || json?.error_description || text || res.statusText;
      throw new Error(`Pinterest ${pathname} ${res.status}: ${detail}`);
    }
    return json;
  }
}

// ─── CSV parser (handles quoted fields) ────────────────────────────────────
function parseCsv(text) {
  const rows = [];
  let i = 0;
  let row = [];
  let cell = "";
  let inQuotes = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 2;
      } else if (c === '"') {
        inQuotes = false;
        i++;
      } else {
        cell += c;
        i++;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
        i++;
      } else if (c === ",") {
        row.push(cell);
        cell = "";
        i++;
      } else if (c === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
        i++;
      } else if (c === "\r") {
        i++;
      } else {
        cell += c;
        i++;
      }
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// ─── Board management ─────────────────────────────────────────────────────
async function listAllBoards() {
  const boards = [];
  let bookmark = null;
  do {
    const qs = bookmark ? `?bookmark=${encodeURIComponent(bookmark)}&page_size=100` : "?page_size=100";
    const res = await pinterest(`/boards${qs}`);
    boards.push(...(res.items || []));
    bookmark = res.bookmark;
  } while (bookmark);
  return boards;
}

async function createBoard(name) {
  return pinterest("/boards", {
    method: "POST",
    body: JSON.stringify({
      name,
      description: `Custom AI pet portraits by Paw Masterpiece. ${name}.`,
      privacy: "PUBLIC",
    }),
  });
}

// Normalize for fuzzy matching — handle ampersand, capitalization, "the"
function boardKey(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

// ─── Pin upload ────────────────────────────────────────────────────────────
async function uploadPin({ filePath, boardId, title, description, link, altText }) {
  const buf = await fs.readFile(filePath);
  const b64 = buf.toString("base64");
  // Pinterest title limit: 100 chars. Description: 500 chars. Alt text: 500.
  const safeTitle = title.slice(0, 100);
  const safeDesc = description.slice(0, 500);
  const safeAlt = altText.slice(0, 500);
  return pinterest("/pins", {
    method: "POST",
    body: JSON.stringify({
      board_id: boardId,
      title: safeTitle,
      description: safeDesc,
      alt_text: safeAlt,
      link,
      media_source: {
        source_type: "image_base64",
        content_type: "image/png",
        data: b64,
      },
    }),
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  await loadEnvLocal();

  if (!process.env.PINTEREST_ACCESS_TOKEN) {
    console.error(
      "❌ PINTEREST_ACCESS_TOKEN not set in .env.local — see the header of this file."
    );
    process.exit(1);
  }

  // Verify CSV + PNGs exist
  let csvText;
  try {
    csvText = await fs.readFile(CSV_PATH, "utf-8");
  } catch {
    console.error(
      `❌ ${CSV_PATH} not found. Run \`node scripts/generate-pinterest-pins.mjs\` first.`
    );
    process.exit(1);
  }

  const rows = parseCsv(csvText);
  const header = rows[0];
  const pins = rows.slice(1).filter((r) => r.length >= header.length);
  const col = Object.fromEntries(header.map((h, i) => [h, i]));

  console.log(`📄 Loaded ${pins.length} pins from CSV`);

  // Verify the account is reachable
  console.log("\n🔌 Verifying Pinterest connection…");
  try {
    const me = await pinterest("/user_account");
    console.log(`  ✓ Connected as @${me.username} (${me.account_type || "business"})`);
  } catch (err) {
    console.error(`  ❌ Auth failed: ${err.message}`);
    console.error(
      "  Re-check PINTEREST_ACCESS_TOKEN — it expires every ~30d on sandbox apps."
    );
    process.exit(1);
  }

  // Find or create the 8 boards
  console.log("\n📂 Loading boards…");
  const existing = await listAllBoards();
  console.log(`  Found ${existing.length} existing boards`);
  const byKey = new Map(existing.map((b) => [boardKey(b.name), b]));

  const uniqueBoards = [...new Set(pins.map((p) => p[col.board]))];
  const boardMap = new Map(); // pin board name → Pinterest board ID
  for (const name of uniqueBoards) {
    const existing = byKey.get(boardKey(name));
    if (existing) {
      boardMap.set(name, existing.id);
      console.log(`  ✓ ${name} → existing board ${existing.id}`);
      continue;
    }
    if (NO_CREATE_BOARDS) {
      console.error(`  ❌ Board "${name}" missing and --no-create-boards set. Aborting.`);
      process.exit(1);
    }
    if (DRY_RUN) {
      console.log(`  [dry-run] would create board: ${name}`);
      boardMap.set(name, "DRY-RUN-BOARD-ID");
      continue;
    }
    console.log(`  + Creating board: ${name}`);
    const created = await createBoard(name);
    boardMap.set(name, created.id);
    console.log(`  ✓ Created ${created.id}`);
  }

  // Upload pins
  console.log(`\n📌 Uploading ${pins.length} pins…`);
  const results = [];
  for (const row of pins) {
    const n = parseInt(row[col.pin_number], 10);
    if (ONLY && !ONLY.has(n)) continue;

    const filename = row[col.filename];
    const filePath = path.join(PINS_DIR, filename);
    const title = row[col.title];
    const description = row[col.description];
    const link = row[col.destination_url];
    const altText = row[col.alt_text];
    const boardName = row[col.board];
    const boardId = boardMap.get(boardName);

    try {
      await fs.access(filePath);
    } catch {
      results.push({ n, status: "MISSING_PNG", filename });
      console.log(`  ⚠️  pin ${n}: PNG missing at ${filename}`);
      continue;
    }

    if (DRY_RUN) {
      console.log(`  [dry-run] pin ${n} → board "${boardName}" (${title.slice(0, 50)}…)`);
      results.push({ n, status: "DRY_RUN", title });
      continue;
    }

    process.stdout.write(`  pin ${String(n).padStart(2, "0")} → ${boardName.slice(0, 24).padEnd(24)} … `);
    try {
      const pin = await uploadPin({ filePath, boardId, title, description, link, altText });
      console.log(`✓ ${pin.id}`);
      results.push({ n, status: "OK", pinId: pin.id, title });
    } catch (err) {
      console.log(`❌ ${err.message.slice(0, 80)}`);
      results.push({ n, status: "ERROR", error: err.message, title });
    }
    // Polite pause to stay under per-second limits even when not 429'd
    await new Promise((r) => setTimeout(r, 800));
  }

  // Summary
  const ok = results.filter((r) => r.status === "OK").length;
  const err = results.filter((r) => r.status === "ERROR").length;
  const skipped = results.filter((r) => r.status === "MISSING_PNG").length;
  const dry = results.filter((r) => r.status === "DRY_RUN").length;
  console.log(`\n─── SUMMARY ───`);
  console.log(`  Uploaded:    ${ok}`);
  if (err) console.log(`  Errors:      ${err}`);
  if (skipped) console.log(`  Missing PNG: ${skipped}`);
  if (dry) console.log(`  Dry-run:     ${dry}`);
  if (err > 0) {
    console.log("\n  Failed pins:");
    for (const r of results.filter((r) => r.status === "ERROR")) {
      console.log(`    ${r.n}. ${r.title.slice(0, 60)}\n       ${r.error.slice(0, 200)}`);
    }
  }

  // Write a result log
  const logPath = path.join(PINS_DIR, "_upload-log.json");
  await fs.writeFile(
    logPath,
    JSON.stringify({ ranAt: new Date().toISOString(), dryRun: DRY_RUN, results }, null, 2)
  );
  console.log(`\nLog → ${logPath}`);
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err.message);
  process.exit(1);
});
