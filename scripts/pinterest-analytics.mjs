// Pinterest pin analytics puller.
//
// Reads every successfully-published pin from the local DB, calls
// Pinterest's /pins/{pin_id}/analytics, and prints a sorted table of
// which pins drove the most impressions / saves / outbound clicks so
// we can pick winners for the next batch of briefs.
//
// Falls back gracefully if the sandbox token can't access analytics —
// reports the failure shape so we know whether to apply for production
// API access or to read numbers manually from Pinterest UI instead.
//
// Run with:  node scripts/pinterest-analytics.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load .env.local SYNCHRONOUSLY before any module-level token/DB reads.
// `@prisma/client` reads DATABASE_URL at import time, so this must run
// before that import resolves.
function loadEnvSync() {
  try {
    const text = fs.readFileSync(path.join(ROOT, ".env.local"), "utf-8");
    for (const raw of text.split("\n")) {
      const line = raw.replace(/\r$/, "");
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      const [, key, value] = m;
      if (!process.env[key]) {
        process.env[key] = value.replace(/^["']|["']$/g, "").trim();
      }
    }
  } catch {}
}
loadEnvSync();

const { PrismaClient } = await import("@prisma/client");

const API =
  process.env.PINTEREST_API_BASE || "https://api-sandbox.pinterest.com/v5";
const TOKEN = process.env.PINTEREST_ACCESS_TOKEN;

// Pinterest analytics requires a start_date and end_date — use the
// pin's own published date and "today" so we capture lifetime stats.
function ymd(d) {
  return d.toISOString().slice(0, 10);
}

async function fetchPinAnalytics(pinId, since) {
  const start = ymd(since);
  const end = ymd(new Date());
  const url =
    `${API}/pins/${pinId}/analytics?` +
    `start_date=${start}&end_date=${end}&` +
    `metric_types=IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* keep raw text on parse fail */
  }
  return { ok: res.ok, status: res.status, body: json ?? text };
}

function num(v) {
  return typeof v === "number" ? v : 0;
}

async function main() {
  if (!TOKEN) {
    console.error("❌ PINTEREST_ACCESS_TOKEN missing in .env.local");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    // 1) Pins from the daily cron queue (live in DB).
    const dbPins = await prisma.pinterestPin.findMany({
      where: { status: "published", pinId: { not: null } },
      orderBy: { publishedAt: "asc" },
      select: {
        briefNumber: true,
        board: true,
        seoTitle: true,
        pinId: true,
        publishedAt: true,
        link: true,
      },
    });

    // 2) Starter pins from the manual bulk upload — not in the DB,
    // tracked in the upload log JSON instead.
    const logPath = path.join(
      ROOT,
      "docs",
      "marketing",
      "pinterest",
      "generated",
      "_upload-log.json"
    );
    let logPins = [];
    try {
      const logRaw = fs.readFileSync(logPath, "utf-8");
      const log = JSON.parse(logRaw);
      const ranAt = log.ranAt ? new Date(log.ranAt) : new Date();
      logPins = (log.results || [])
        .filter((r) => r.status === "OK" && r.pinId)
        .map((r) => ({
          briefNumber: r.n,
          board: "(starter batch)",
          seoTitle: r.title,
          pinId: r.pinId,
          publishedAt: ranAt,
          link: null,
        }));
    } catch {
      /* log file optional */
    }

    // De-dupe in case a pin somehow shows up in both sources.
    const seen = new Set();
    const pins = [...logPins, ...dbPins].filter((p) => {
      if (seen.has(p.pinId)) return false;
      seen.add(p.pinId);
      return true;
    });

    console.log(`📊 Pulling analytics for ${pins.length} published pins…\n`);

    const rows = [];
    let sandboxBlocked = 0;

    for (const pin of pins) {
      const since = pin.publishedAt || new Date(Date.now() - 30 * 86400_000);
      const r = await fetchPinAnalytics(pin.pinId, since);
      if (!r.ok) {
        if (r.status === 403 || r.status === 404) sandboxBlocked++;
        rows.push({
          briefNumber: pin.briefNumber,
          board: pin.board,
          title: pin.seoTitle.slice(0, 50),
          pinId: pin.pinId,
          status: `err ${r.status}`,
          impressions: 0,
          saves: 0,
          pinClicks: 0,
          outbound: 0,
          link: pin.link,
        });
        continue;
      }

      // Pinterest analytics shape:
      //   { all: { lifetime_metrics: { IMPRESSION, SAVE, PIN_CLICK, OUTBOUND_CLICK } }, ... }
      const m = r.body?.all?.lifetime_metrics ?? r.body?.lifetime_metrics ?? {};
      rows.push({
        briefNumber: pin.briefNumber,
        board: pin.board,
        title: pin.seoTitle.slice(0, 50),
        pinId: pin.pinId,
        status: "ok",
        impressions: num(m.IMPRESSION),
        saves: num(m.SAVE),
        pinClicks: num(m.PIN_CLICK),
        outbound: num(m.OUTBOUND_CLICK),
        link: pin.link,
      });
    }

    // If everything came back 403/404, the sandbox token doesn't have
    // analytics scope and we have to read the numbers from the Pinterest
    // UI manually. Tell the user instead of printing a table of zeros.
    if (sandboxBlocked === pins.length && pins.length > 0) {
      console.log("⚠️  Sandbox token doesn't have analytics access.");
      console.log("   Pinterest's analytics API requires production scope.\n");
      console.log("   Read these numbers manually from:");
      console.log("   https://analytics.pinterest.com/\n");
      console.log("   Look at: Analytics → Overview → Top pins (last 30 days)");
      console.log("   The 3 cron pins were uploaded in the last 24h so they");
      console.log("   won't have meaningful data yet — focus on the 30 starter");
      console.log("   pins from 2026-05-12 to 2026-05-15 for early signal.\n");
      return;
    }

    // Sort by outbound clicks descending — that's the only metric that
    // matters for revenue. Saves/impressions are vanity unless they
    // convert to actual site visits.
    rows.sort((a, b) => b.outbound - a.outbound || b.saves - a.saves);

    const totals = rows.reduce(
      (acc, r) => ({
        impressions: acc.impressions + r.impressions,
        saves: acc.saves + r.saves,
        pinClicks: acc.pinClicks + r.pinClicks,
        outbound: acc.outbound + r.outbound,
      }),
      { impressions: 0, saves: 0, pinClicks: 0, outbound: 0 }
    );

    console.log("Top 10 by outbound clicks:");
    console.log("─".repeat(110));
    console.log(
      "  #   Board".padEnd(36) +
        "Imps".padStart(8) +
        "Saves".padStart(8) +
        "PinClk".padStart(8) +
        "OUT".padStart(8) +
        "  Title"
    );
    console.log("─".repeat(110));
    for (const r of rows.slice(0, 10)) {
      const line =
        `  #${String(r.briefNumber).padEnd(3)} ${r.board.slice(0, 28).padEnd(28)}` +
        String(r.impressions).padStart(8) +
        String(r.saves).padStart(8) +
        String(r.pinClicks).padStart(8) +
        String(r.outbound).padStart(8) +
        `  ${r.title}`;
      console.log(line);
    }
    console.log("─".repeat(110));
    console.log(
      "  TOTAL".padEnd(36) +
        String(totals.impressions).padStart(8) +
        String(totals.saves).padStart(8) +
        String(totals.pinClicks).padStart(8) +
        String(totals.outbound).padStart(8)
    );

    // Per-board roll-up so we can see which boards are working.
    const byBoard = {};
    for (const r of rows) {
      if (!byBoard[r.board]) byBoard[r.board] = { pins: 0, imps: 0, saves: 0, out: 0 };
      byBoard[r.board].pins++;
      byBoard[r.board].imps += r.impressions;
      byBoard[r.board].saves += r.saves;
      byBoard[r.board].out += r.outbound;
    }
    console.log("\nPer-board summary:");
    console.log("─".repeat(72));
    const boardRows = Object.entries(byBoard)
      .map(([name, b]) => ({ name, ...b }))
      .sort((a, b) => b.out - a.out);
    for (const b of boardRows) {
      console.log(
        `  ${b.name.padEnd(30)} ${String(b.pins).padStart(3)} pins  ` +
          `${String(b.imps).padStart(6)} imps  ` +
          `${String(b.saves).padStart(5)} saves  ` +
          `${String(b.out).padStart(5)} outbound`
      );
    }
    console.log("");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
