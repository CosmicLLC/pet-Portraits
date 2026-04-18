import crypto from "crypto"

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET
  if (!s) throw new Error("NEXTAUTH_SECRET is required to sign unsubscribe tokens")
  return s
}

export function signUnsubToken(email: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`unsub:${email.toLowerCase()}`)
    .digest("hex")
}

export function verifyUnsubToken(email: string, token: string): boolean {
  const expected = signUnsubToken(email)
  const a = Buffer.from(expected, "hex")
  const b = Buffer.from(token, "hex")
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export function unsubUrl(email: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"
  const token = signUnsubToken(email)
  return `${base}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`
}
