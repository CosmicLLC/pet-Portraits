import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { prisma } from "@/lib/prisma"
import { createResetToken } from "@/lib/auth-tokens"
import { renderResetEmail } from "@/lib/emails/auth-emails"
import { rateLimit, clientIp } from "@/lib/ratelimit"

export const runtime = "nodejs"

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers)
  const limit = await rateLimit(`forgot:${ip}`, 5, 60 * 10)
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    )
  }

  let body: { email?: string }
  try { body = await req.json() } catch { body = {} }
  const email = (body.email || "").trim().toLowerCase()

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
  }

  // Always return 200 — do not leak which emails exist.
  const user = await prisma.user.findUnique({ where: { email } })
  if (user) {
    try {
      const token = await createResetToken(email)
      const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"
      const resetUrl = `${base}/auth/reset-password?email=${encodeURIComponent(email)}&token=${token}`
      const { html, text, subject } = renderResetEmail(resetUrl)
      const resend = new Resend(process.env.RESEND_API_KEY!)
      const from = `Paw Masterpiece <${process.env.FROM_EMAIL || "noreply@pawmasterpiece.com"}>`
      const { error } = await resend.emails.send({ from, to: email, subject, html, text })
      if (error) console.error("Reset email send failed:", error)
    } catch (err) {
      console.error("Reset flow failed:", err)
    }
  }

  return NextResponse.json({ ok: true })
}
