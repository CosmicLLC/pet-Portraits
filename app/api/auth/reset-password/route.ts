import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, validatePasswordStrength } from "@/lib/password"
import { consumeResetToken } from "@/lib/auth-tokens"
import { rateLimit, clientIp } from "@/lib/ratelimit"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers)
  const limit = await rateLimit(`reset:${ip}`, 10, 60 * 10)
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    )
  }

  let body: { email?: string; token?: string; password?: string }
  try { body = await req.json() } catch { body = {} }

  const email = (body.email || "").trim().toLowerCase()
  const token = body.token || ""
  const password = body.password || ""

  if (!email || !token) {
    return NextResponse.json({ error: "Invalid reset link." }, { status: 400 })
  }
  const pwErr = validatePasswordStrength(password)
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 })

  const ok = await consumeResetToken(email, token)
  if (!ok) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    )
  }

  const hash = await hashPassword(password)
  // Mark email as verified too — clicking the link proves ownership of the inbox.
  await prisma.user.update({
    where: { email },
    data: { password: hash, emailVerified: new Date() },
  }).catch(() => null)

  return NextResponse.json({ ok: true })
}
