// Deploy-time IndexNow auto-submission — wired as `postbuild` in
// package.json, so it runs inside the Vercel build right after
// `next build` succeeds. The manual one-shot (scripts/submit-indexnow.mjs)
// hard-exits 1 on failure, which would fail the whole deploy if used here;
// this wrapper is the soft-fail variant: every path logs and exits 0.
//
// Scope: IndexNow only (Bing / Yandex / Naver / Seznam + ChatGPT &
// Copilot search via the Bing index). Google retired sitemap pings in
// 2023 and doesn't participate in IndexNow — Google discovery stays on
// Search Console (sitemap already registered) unless/until Indexing API
// service-account creds are added.

const KEY = "670b8f884651a5e8961659a261a0821b"; // must match public/{KEY}.txt
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://pawmasterpiece.com").replace(/\/$/, "");

// Always-submit core pages: a brand-new page's first deploy won't be in
// the previously-deployed sitemap we fetch below, so the merge keeps the
// money pages fresh regardless.
const CORE_PATHS = ["/", "/start", "/wallpaper", "/reviews", "/blog", "/free-photo-guide"];

async function main() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log(`[indexnow] skip — VERCEL_ENV=${process.env.VERCEL_ENV || "(local)"}`);
    return;
  }

  const urls = new Set(CORE_PATHS.map((p) => `${BASE_URL}${p}`));

  try {
    const res = await fetch(`${BASE_URL}/sitemap.xml`, { signal: AbortSignal.timeout(10_000) });
    if (res.ok) {
      const xml = await res.text();
      for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        const u = m[1].trim();
        if (u.startsWith(BASE_URL)) urls.add(u);
      }
    } else {
      console.warn(`[indexnow] sitemap fetch HTTP ${res.status} — core pages only`);
    }
  } catch (err) {
    console.warn(`[indexnow] sitemap fetch failed (${err?.message}) — core pages only`);
  }

  const urlList = [...urls].slice(0, 500);
  try {
    const res = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        host: new URL(BASE_URL).hostname,
        key: KEY,
        keyLocation: `${BASE_URL}/${KEY}.txt`,
        urlList,
      }),
    });
    console.log(`[indexnow] submitted ${urlList.length} URLs — HTTP ${res.status}`);
  } catch (err) {
    console.warn(`[indexnow] submission failed: ${err?.message}`);
  }
}

main().catch((err) => {
  console.warn(`[indexnow] unexpected error: ${err?.message}`);
});
