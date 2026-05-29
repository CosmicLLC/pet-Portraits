// Subject isolation via fal.ai birefnet (background removal).
//
// Used by the wallpaper pipeline to cut the pet out of the Gemini-
// generated square so it can be composited onto a perfectly uniform
// solid-color canvas (eliminating the horizontal seam the old
// "extend with sampled color" approach produced).
//
// Why birefnet and not a Sharp chroma-key: tested live on 2026-05-28 —
// chroma-key ate light-colored fur (white husky / golden retriever)
// because it can't distinguish "light fur" from "light background"
// when they're the same color. birefnet segments semantically, so it
// preserves all fur regardless of coat/background color match.
// Validated: clean cutout in ~2s, white fur fully preserved.
//
// Airtight by design (same philosophy as generateWallpaperPortrait):
// every network call is bounded by an AbortController timeout + a
// single retry on transient failure, so it always resolves with a
// buffer or throws a clean error — never a silent hang.

const FAL_ENDPOINT = "https://fal.run/fal-ai/birefnet";
const CALL_TIMEOUT_MS = 30_000;
const FETCH_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 2;

async function callBirefnet(dataUrl: string, apiKey: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);
  try {
    const res = await fetch(FAL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_url: dataUrl }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`fal birefnet HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      image?: { url?: string };
      images?: Array<{ url?: string }>;
    };
    // birefnet returns { image: { url } }; tolerate the array shape too.
    const url = data.image?.url || data.images?.[0]?.url;
    if (!url) {
      throw new Error(
        `fal birefnet returned no image url: ${JSON.stringify(data).slice(0, 200)}`
      );
    }
    return url;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch birefnet cutout: HTTP ${res.status}`);
    }
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Remove the background from a PNG buffer, returning a transparent-
 * background PNG of just the subject. Throws a clean Error on terminal
 * failure (caller catches + surfaces a friendly message).
 */
export async function removeBackground(pngBuffer: Buffer): Promise<Buffer> {
  const apiKey = process.env.FAL_AI_API_KEY;
  if (!apiKey) {
    throw new Error("FAL_AI_API_KEY environment variable is not set");
  }

  const dataUrl = `data:image/png;base64,${pngBuffer.toString("base64")}`;
  let lastErr: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const url = await callBirefnet(dataUrl, apiKey);
      return await fetchBuffer(url);
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      const msg = lastErr.message.toLowerCase();
      const isTransient =
        msg.includes("aborted") ||
        msg.includes("timeout") ||
        msg.includes("fetch failed") ||
        msg.includes("network") ||
        msg.includes("econn") ||
        msg.includes("etimedout") ||
        msg.includes("http 5") ||
        msg.includes("unavailable");
      if (!isTransient || attempt >= MAX_ATTEMPTS) {
        throw lastErr;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw lastErr ?? new Error("Background removal failed");
}
