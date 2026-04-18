import crypto from "crypto"

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error("NEXTAUTH_SECRET is required to sign download tokens")
  return secret
}

export function signDownloadToken(orderId: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`download:${orderId}`)
    .digest("hex")
}

export function verifyDownloadToken(orderId: string, token: string): boolean {
  const expected = signDownloadToken(orderId)
  const a = Buffer.from(expected, "hex")
  const b = Buffer.from(token, "hex")
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
