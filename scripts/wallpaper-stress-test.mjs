// 10-iteration wallpaper stress test against prod.
// Pass criterion: 10/10 successful HTTP 200, all under 15s, no variance > 3x.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PHOTO_PATH = path.join(ROOT, "public", "examples", "watercolor.png");

const COLORS = [
  { hex: "#9DAF8E", name: "Sage" },
  { hex: "#D4A5A5", name: "Dusty Rose" },
  { hex: "#F5E6D3", name: "Cream" },
  { hex: "#2C3E50", name: "Navy" },
  { hex: "#C77B58", name: "Terracotta" },
  { hex: "#F2E2A8", name: "Butter" },
  { hex: "#7B97AF", name: "Slate" },
  { hex: "#F0CCD0", name: "Blush" },
  { hex: "#3A5A40", name: "Forest" },
  { hex: "#3A3A3A", name: "Charcoal" },
];

async function callPreview(hex) {
  const photoBuf = fs.readFileSync(PHOTO_PATH);
  const blob = new Blob([photoBuf], { type: "image/png" });
  const form = new FormData();
  form.append("photo", blob, "watercolor.png");
  form.append("bgHex", hex);

  const t0 = Date.now();
  try {
    const res = await fetch("https://pawmasterpiece.com/api/wallpaper-preview", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123.0 Safari/537.36",
        Origin: "https://pawmasterpiece.com",
      },
      body: form,
      signal: AbortSignal.timeout(90_000),
    });
    const elapsed = Date.now() - t0;
    const rawBody = await res.text();
    let data = null;
    let parseError = null;
    try {
      data = JSON.parse(rawBody);
    } catch (e) {
      parseError = e.message;
    }
    return {
      ok: res.ok && data?.ok === true,
      status: res.status,
      elapsed,
      previewBytes: data?.preview?.length ?? 0,
      error: data?.error || parseError,
      bodyPreview: !data?.ok ? rawBody.slice(0, 200) : undefined,
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      elapsed: Date.now() - t0,
      error: e.message?.slice(0, 100),
    };
  }
}

async function main() {
  console.log("Running 10 sequential wallpaper tests...\n");
  const results = [];
  for (let i = 0; i < 10; i++) {
    const color = COLORS[i];
    process.stdout.write(`  ${(i + 1).toString().padStart(2)} / 10  ${color.name.padEnd(12)} `);
    const r = await callPreview(color.hex);
    results.push({ ...r, color: color.name });
    if (r.ok) {
      const sizeKB = (r.previewBytes / 1024).toFixed(0);
      console.log(`✅ ${(r.elapsed / 1000).toFixed(1)}s  preview=${sizeKB}KB`);
    } else {
      console.log(`❌ ${(r.elapsed / 1000).toFixed(1)}s  ${r.status}  ${r.error || ""}`);
      if (r.bodyPreview) console.log(`     body: ${r.bodyPreview}`);
    }
  }

  const successes = results.filter((r) => r.ok);
  const failures = results.filter((r) => !r.ok);
  const times = successes.map((r) => r.elapsed);
  if (times.length === 0) {
    console.log("\nNo successes — cannot compute statistics.");
    process.exit(1);
  }
  const sorted = [...times].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1];
  const sum = times.reduce((s, t) => s + t, 0);
  const avg = sum / times.length;
  const avgSizeKB =
    successes.reduce((s, r) => s + r.previewBytes, 0) / successes.length / 1024;

  console.log("\n═══ Results ═══");
  console.log(`  Success: ${successes.length} / 10`);
  console.log(`  Failures: ${failures.length}`);
  console.log(`  Latency: min=${(min/1000).toFixed(1)}s  median=${(median/1000).toFixed(1)}s  avg=${(avg/1000).toFixed(1)}s  p95=${(p95/1000).toFixed(1)}s  max=${(max/1000).toFixed(1)}s`);
  console.log(`  Avg preview size: ${avgSizeKB.toFixed(0)}KB`);
  console.log("");

  const allUnder15s = successes.every((r) => r.elapsed < 15_000);
  const allUnder10s = successes.every((r) => r.elapsed < 10_000);
  const variance = max / min;

  if (successes.length === 10 && allUnder15s && variance < 3) {
    console.log("✅ BULLETPROOF — 10/10 success, all <15s, variance <3x");
  } else {
    console.log("⚠️  Not bulletproof yet:");
    if (successes.length < 10) console.log(`   — Only ${successes.length}/10 succeeded`);
    if (!allUnder15s) console.log("   — Some calls took >15s");
    if (variance >= 3) console.log(`   — Variance is ${variance.toFixed(1)}x (target <3x)`);
  }
  if (allUnder10s && successes.length === 10) {
    console.log("✨ All under 10 seconds — exceeds expectation");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
