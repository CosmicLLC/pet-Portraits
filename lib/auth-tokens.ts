import crypto from "crypto"
import { prisma } from "@/lib/prisma"

// One-time tokens for email verification + password reset.
// Stored in the existing VerificationToken table (already present via the
// Prisma NextAuth adapter), namespaced by an identifier prefix:
//   verify:<email> — proves ownership of the email after signup
//   reset:<email>  — authorizes a password reset

const VERIFY_TTL_MINUTES = 60 * 24 // 24 hours
const RESET_TTL_MINUTES = 60       // 1 hour

function newToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

async function createToken(identifier: string, ttlMinutes: number): Promise<string> {
  // Invalidate any previous tokens with the same identifier so only the newest is valid.
  await prisma.verificationToken.deleteMany({ where: { identifier } })
  const token = newToken()
  const expires = new Date(Date.now() + ttlMinutes * 60 * 1000)
  await prisma.verificationToken.create({ data: { identifier, token, expires } })
  return token
}

async function consumeToken(identifier: string, token: string): Promise<boolean> {
  const row = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token } },
  })
  if (!row) return false
  if (row.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier, token } },
    }).catch(() => {})
    return false
  }
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier, token } },
  })
  return true
}

export function createVerifyToken(email: string) {
  return createToken(`verify:${email}`, VERIFY_TTL_MINUTES)
}

export function consumeVerifyToken(email: string, token: string) {
  return consumeToken(`verify:${email}`, token)
}

export function createResetToken(email: string) {
  return createToken(`reset:${email}`, RESET_TTL_MINUTES)
}

export function consumeResetToken(email: string, token: string) {
  return consumeToken(`reset:${email}`, token)
}
