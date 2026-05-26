// One-time migration: import queue.json + published.json into the new
// PinterestPin Prisma table. Idempotent — checks briefNumber before
// creating, so re-running won't duplicate rows.
//
// Run with: node scripts/seed-pinterest-pins.mjs

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PINS_DIR = path.join(ROOT, "docs", "marketing", "pinterest");

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

async function loadJson(p, fallback = []) {
  try {
    return JSON.parse(await fs.readFile(p, "utf-8"));
  } catch {
    return fallback;
  }
}

async function main() {
  await loadEnv();
  const prisma = new PrismaClient();

  const queue = await loadJson(path.join(PINS_DIR, "queue.json"));
  const published = await loadJson(path.join(PINS_DIR, "published.json"));

  console.log(`📥 Loading ${queue.length} queued + ${published.length} published pins`);

  // Pull existing brief numbers so we don't duplicate on re-run
  const existing = await prisma.pinterestPin.findMany({ select: { briefNumber: true } });
  const existingNums = new Set(existing.map((e) => e.briefNumber));
  console.log(`  ${existingNums.size} pins already in DB`);

  let created = 0;
  let skipped = 0;

  // Published pins first — these are immutable history
  for (const p of published) {
    if (existingNums.has(p.n)) {
      skipped++;
      continue;
    }
    await prisma.pinterestPin.create({
      data: {
        briefNumber: p.n,
        board: p.board,
        seoTitle: p.seoTitle,
        description: p.description,
        altText: p.altText,
        link: p.url.startsWith("http") ? p.url : `https://pawmasterpiece.com${p.url}`,
        style: p.style,
        eyebrow: p.eyebrow,
        titleA: p.titleA,
        titleB: p.titleB,
        tagline: p.tagline,
        status: "published",
        pinId: p.pinId || null,
        boardId: p.boardId || null,
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
      },
    });
    created++;
  }

  // Then queued pins — waiting to be picked up by cron
  for (const p of queue) {
    if (existingNums.has(p.n)) {
      skipped++;
      continue;
    }
    await prisma.pinterestPin.create({
      data: {
        briefNumber: p.n,
        board: p.board,
        seoTitle: p.seoTitle,
        description: p.description,
        altText: p.altText,
        link: p.url.startsWith("http") ? p.url : `https://pawmasterpiece.com${p.url}`,
        style: p.style,
        eyebrow: p.eyebrow,
        titleA: p.titleA,
        titleB: p.titleB,
        tagline: p.tagline,
        status: "queued",
      },
    });
    created++;
  }

  console.log(`\n✓ Created ${created} new rows, skipped ${skipped} already-existing.`);

  const counts = await prisma.pinterestPin.groupBy({ by: ["status"], _count: true });
  console.log("\n📊 PinterestPin state:");
  for (const c of counts) {
    console.log(`  ${c.status}: ${c._count}`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
