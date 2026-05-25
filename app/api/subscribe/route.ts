import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { prisma } from "@/lib/prisma"
import { rateLimit, clientIp } from "@/lib/ratelimit"
import { sendWelcomeEmail, sendAbandonedPortraitEmail } from "@/lib/resend"

export const runtime = "nodejs"

// Source enum drives segmentation for retargeting + Custom Audience exports.
// Add new sources here when adding a new capture surface — anything else falls
// through to "other" and you lose segmentation for that traffic.
const ALLOWED_SOURCES = new Set([
  "footer",            // legacy home-footer newsletter
  "landing_footer",    // newsletter inline in LandingFooterCTA (all landing pages)
  "exit_intent",       // ExitIntentPopup
  "popup",             // EmailPopup (sitewide, 7-day cooldown)
  "abandonment",       // BrowseAbandonmentCapture (preview step, 30s idle)
  "portrait",          // reserved
  "blog_post",         // inline + end-of-post newsletter on /blog/[slug]
  "success_page",      // post-purchase explicit opt-in
  "wallpaper",         // /free-wallpaper lead magnet (formerly "other")
  "photo_guide",       // /free-photo-guide lead magnet (formerly "other")
  "purchase",          // silent auto-enroll from Stripe webhook
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

  const blocked = await prisma.blockedEmail.findUnique({ where: { email } }).catch(() => null)
  if (blocked) {
    // Silently succeed — don't reveal the block list.
    return NextResponse.json({ ok: true })
  }

  const source = normalizeSource(body.source)
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : null

  let isNewSubscriber = false
  try {
    // Upsert — if they previously unsubscribed, re-subscribe them (signaling
    // explicit consent). If they already exist and are active, it's a no-op
    // beyond possibly updating the most recent signup source.
    const existing = await prisma.subscriber.findUnique({
      where: { email },
      select: { id: true, unsubscribedAt: true, lastEmailSent: true },
    })
    isNewSubscriber = !existing || !!existing.unsubscribedAt

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

  // Source-specific email triggers. Order matters: abandonment beats the
  // generic welcome — if someone bailed mid-preview, they need the "your
  // portrait is saved + 10% code" email, not a brand-tour welcome.
  const existingLastSent = await prisma.subscriber
    .findUnique({ where: { email }, select: { lastEmailSent: true } })
    .then((s) => s?.lastEmailSent ?? null)
    .catch(() => null)
  const lastSentMs = existingLastSent?.getTime() ?? 0
  const oneDayMs = 24 * 60 * 60 * 1000
  const cooledDown = Date.now() - lastSentMs > oneDayMs

  if (source === "abandonment" && cooledDown) {
    // Fire-and-forget. Rate-limited to once per day so a user who churns
    // through multiple previews doesn't get bombarded.
    sendAbandonedPortraitEmail(email)
      .then(() =>
        prisma.subscriber
          .update({ where: { email }, data: { lastEmailSent: new Date() } })
          .catch(() => {})
      )
      .catch((err) => console.error("Abandonment send failed:", err))
  } else if (isNewSubscriber && source !== "abandonment") {
    // Fire-and-forget welcome email for genuinely new subscribers from any
    // capture surface other than abandonment. Failure here must not fail
    // the API request — they're already in the list.
    sendWelcomeEmail(email)
      .then(() =>
        prisma.subscriber.update({
          where: { email },
          data: { lastEmailSent: new Date() },
        }).catch(() => {})
      )
      .catch((err) => console.error("Welcome send failed:", err))
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
