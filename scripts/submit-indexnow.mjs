// One-shot IndexNow submission of the full site sitemap. Useful right
// after a major deploy to nudge Bing / Yandex / ChatGPT-search to crawl
// the fresh URLs immediately instead of waiting 1-4 weeks.
//
// Run with:  node scripts/submit-indexnow.mjs

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

async function loadEnv() {
  try {
    const text = await fs.readFile(path.join(ROOT, ".env.local"), "utf-8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      const [, key, value] = m;
      if (!process.env[key]) process.env[key] = value.replace(/^["']|["']$/g, "").trim();
    }
  } catch {}
}

const KEY = "670b8f884651a5e8961659a261a0821b";

async function main() {
  await loadEnv();
  const BASE_URL =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    "https://pawmasterpiece.com";

  // Fetch the live sitemap so we submit exactly what Google sees.
  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  if (!sitemapRes.ok) {
    console.error(`❌ Failed to fetch sitemap: ${sitemapRes.status}`);
    process.exit(1);
  }
  const sitemapXml = await sitemapRes.text();
  const urls = Array.from(sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g))
    .map((m) => m[1])
    .filter((u) => u.startsWith(BASE_URL));

  if (urls.length === 0) {
    console.error("❌ No URLs found in sitemap");
    process.exit(1);
  }

  console.log(`📤 Submitting ${urls.length} URLs to IndexNow…`);

  const body = {
    host: new URL(BASE_URL).hostname,
    key: KEY,
    keyLocation: `${BASE_URL}/${KEY}.txt`,
    urlList: urls.slice(0, 500), // sanity cap
  };

  const res = await fetch("https://api.indexnow.org/IndexNow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => "");
  console.log(`Status: ${res.status} ${res.statusText}`);
  if (res.ok) {
    console.log(`✓ Successfully submitted ${urls.length} URLs to IndexNow`);
    console.log("  → Bing, Yandex, Naver, and ChatGPT-search will recrawl within hours.");
  } else {
    console.error(`❌ IndexNow rejected: ${text || res.statusText}`);
    console.error("  Common causes: missing key file at /{KEY}.txt, host mismatch, malformed URLs");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
