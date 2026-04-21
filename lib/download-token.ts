import crypto from "crypto"

// 7 days — long enough for customers to act on the confirmation email or dig
// it out of their archive, short enough that a leaked link loses value
// quickly. Admin can re-issue via the "Resend email" action anytime.
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error("NEXTAUTH_SECRET is required to sign download tokens")
  return secret
}

export type DownloadToken = { token: string; exp: number }

// Mints a download token that expires at `expiresAt` (unix ms).
// The expiry is both part of the signed payload and returned separately so
// callers can build URLs like `?token=<hex>&exp=<ms>`.
export function signDownloadToken(orderId: string, ttlMs: number = DEFAULT_TTL_MS): DownloadToken {
  const exp = Date.now() + ttlMs
  const token = crypto
    .createHmac("sha256", getSecret())
    .update(`download:${orderId}:${exp}`)
    .digest("hex")
  return { token, exp }
}

export function verifyDownloadToken(orderId: string, token: string, exp: number): boolean {
  if (!Number.isFinite(exp) || exp <= Date.now()) return false
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(`download:${orderId}:${exp}`)
    .digest("hex")
  const a = Buffer.from(expected, "hex")
  const b = Buffer.from(token, "hex")
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
