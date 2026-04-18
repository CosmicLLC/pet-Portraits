import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { prisma } from "@/lib/prisma"
import { rateLimit, clientIp } from "@/lib/ratelimit"

export const runtime = "nodejs"

const ALLOWED_SOURCES = new Set([
  "footer",
  "exit_intent",
  "abandonment",
  "portrait",
  "purchase",
  "other",
])

function normalizeSource(raw: unknown): string {
  if (typeof raw !== "string") return "other"
  const s = raw.trim().toLowerCase().replace(/[^a-z_]/g, "_")
  return ALLOWED_SOURCES.has(s) ? s : "other"
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers)
  const limit = await rateLimit(`subscribe:${ip}`, 10, 60 * 10)
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    )
  }

  let body: { email?: unknown; source?: unknown; name?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }
  const source = normalizeSource(body.source)
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : null

  try {
    // Upsert — if they previously unsubscribed, re-subscribe them (signaling
    // explicit consent). If they already exist and are active, it's a no-op
    // beyond possibly updating the most recent signup source.
    await prisma.subscriber.upsert({
      where: { email },
      create: { email, source, name },
      update: {
        unsubscribedAt: null,
        source,
        ...(name ? { name } : {}),
      },
    })
  } catch (err) {
    console.error("Subscriber upsert failed:", err)
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 })
  }

  // Mirror to Resend audience if configured — gives the owner a second
  // place to manage the list (not the source of truth, but handy).
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (audienceId && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.contacts.create({ email, audienceId, unsubscribed: false })
    } catch (err) {
      console.error("Resend contacts mirror failed:", err)
    }
  }

  return NextResponse.json({ ok: true })
}
