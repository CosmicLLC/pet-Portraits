import crypto from "crypto"

// Signed-capability tokens for the public print-asset proxy (/api/print-asset).
//
// Why this exists: the Vercel Blob store is PRIVATE — a private blob URL 403s
// when fetched without our server token (verified live). But Prodigi's print
// lab AND Replicate's upscaler fetch image URLs anonymously (no way to hand
// them a bearer token). So we expose a PUBLIC proxy that streams a private
// blob to anonymous callers — gated by an HMAC over the blob's pathname prefix
// so it can't be turned into an open proxy for arbitrary blobs.

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET
  if (!s) throw new Error("NEXTAUTH_SECRET is required to sign print tokens")
  return s
}

// Only these blob namespaces may ever be served through the proxy.
const ALLOWED_PREFIX = /^(print-ready|portraits)\/[A-Za-z0-9_-]+$/

export function isAllowedPrintPrefix(prefix: string): boolean {
  return ALLOWED_PREFIX.test(prefix)
}

export function signPrintToken(prefix: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`print-asset:${prefix}`)
    .digest("hex")
}

export function verifyPrintToken(prefix: string, token: string): boolean {
  if (!prefix || !token || !isAllowedPrintPrefix(prefix)) return false
  const expected = signPrintToken(prefix)
  const a = Buffer.from(expected, "hex")
  const b = Buffer.from(token, "hex")
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

// Build the absolute public URL a third party (Prodigi/Replicate) can fetch.
// `prefix` is the blob namespace, e.g. "print-ready/<imageId>" or
// "portraits/<imageId>" (the proxy resolves the random-suffixed object via
// list({ prefix })). No expiry: Prodigi may re-fetch during reprints/returns,
// and the original design used permanent public URLs anyway — the unguessable
// HMAC is the gate.
export function printAssetUrl(prefix: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "")
  const token = signPrintToken(prefix)
  return `${base}/api/print-asset?p=${encodeURIComponent(prefix)}&token=${token}`
}
