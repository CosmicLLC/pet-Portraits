// IndexNow — push fresh URLs to Bing, Yandex, and Naver (and indirectly
// to ChatGPT/Copilot which use Bing as their search index). Bypasses the
// 1-4 week crawl wait by giving search engines a direct "this URL just
// changed" notification.
//
// The key file is at /public/{KEY}.txt and must be served live at
// https://pawmasterpiece.com/{KEY}.txt so IndexNow can verify domain
// ownership. The KEY value here MUST match the filename.
//
// Docs: https://www.indexnow.org/documentation

const INDEXNOW_KEY = "670b8f884651a5e8961659a261a0821b"
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"

// Bing accepts via api.indexnow.org which forwards to all participating
// search engines. Direct hostnames (api.bing.com, yandex.com/indexnow)
// also work — we use the aggregator for one-shot fan-out.
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow"

interface IndexNowResult {
  ok: boolean
  status: number
  submitted: number
  message?: string
}

/**
 * Submit a batch of URLs to IndexNow. Up to 10,000 per request; we cap
 * at 500 here as a sanity limit — typical use is 1-50 URLs per deploy.
 * Returns the HTTP status and submitted count.
 */
export async function pingIndexNow(urls: string[]): Promise<IndexNowResult> {
  if (urls.length === 0) {
    return { ok: true, status: 200, submitted: 0, message: "No URLs to submit" }
  }
  const capped = urls.slice(0, 500)
  // All URLs must be on the same host as KEYLOCATION
  const sanitized = capped.filter((u) => u.startsWith(BASE_URL))
  if (sanitized.length === 0) {
    return { ok: false, status: 400, submitted: 0, message: "No URLs matched BASE_URL host" }
  }

  const body = {
    host: new URL(BASE_URL).hostname,
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: sanitized,
  }

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    })
    return {
      ok: res.ok,
      status: res.status,
      submitted: sanitized.length,
      message: res.ok ? "Submitted" : await res.text().catch(() => res.statusText),
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      submitted: 0,
      message: err instanceof Error ? err.message : String(err),
    }
  }
}

/** Convenience: ping IndexNow with a single URL. */
export function pingOne(url: string): Promise<IndexNowResult> {
  return pingIndexNow([url])
}
