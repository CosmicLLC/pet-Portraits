import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { prisma } from "@/lib/prisma"
import { hashPassword, validatePasswordStrength } from "@/lib/password"
import { createVerifyToken } from "@/lib/auth-tokens"
import { renderVerifyEmail } from "@/lib/emails/auth-emails"
import { rateLimit, clientIp } from "@/lib/ratelimit"

export const runtime = "nodejs"

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers)
  const limit = await rateLimit(`register:${ip}`, 5, 60 * 10) // 5 / 10 min
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    )
  }

  let body: { email?: string; password?: string; name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const email = (body.email || "").trim().toLowerCase()
  const password = body.password || ""
  const name = (body.name || "").trim() || null

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
  }
  const pwErr = validatePasswordStrength(password)
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    // If the account has no password yet (OAuth/magic-link only), let them
    // set one via the password-reset flow. Don't leak existence otherwise.
    if (existing.password) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in or resetting your password." },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: "An account with this email already exists. Use 'Forgot password' to set one." },
      { status: 409 }
    )
  }

  const hash = await hashPassword(password)
  await prisma.user.create({
    data: { email, name, password: hash },
  })

  // Send verification email (non-fatal if email provider hiccups)
  try {
    const token = await createVerifyToken(email)
    const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"
    const verifyUrl = `${base}/api/auth/verify-email?email=${encodeURIComponent(email)}&token=${token}`
    const { html, text, subject } = renderVerifyEmail(verifyUrl)
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const from = `Paw Masterpiece <${process.env.FROM_EMAIL || "noreply@pawmasterpiece.com"}>`
    const { error } = await resend.emails.send({ from, to: email, subject, html, text })
    if (error) console.error("Verify email send failed:", error)
  } catch (err) {
    console.error("Verify email setup failed:", err)
  }

  return NextResponse.json({ ok: true })
}
