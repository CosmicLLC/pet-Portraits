import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== "admin") return null
  return session
}

// Query params:
//   ?source=blog_post           — filter to one source (omit for all)
//   ?from=2026-01-01            — subscribed on/after this date (ISO)
//   ?to=2026-12-31              — subscribed on/before this date (ISO)
//   ?status=active|unsubscribed|all  — defaults to active
//   ?nonPurchaser=true          — exclude emails that exist in Order table
//                                 (use this to build retargeting Custom Audiences)
//   ?format=csv                 — download as CSV instead of JSON
//
// CSV columns: email, name, source, subscribed_at, unsubscribed_at,
//              last_email_sent, has_purchased
// Upload to Meta Events Manager → Audiences → Customer file → Custom Audience.
// Meta hashes the email column for you on upload. Same workflow for TikTok.
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  const sourceFilter = sp.get("source")?.trim() || null
  const fromIso = sp.get("from")?.trim() || null
  const toIso = sp.get("to")?.trim() || null
  const status = (sp.get("status") || "active").trim()
  const nonPurchaser = sp.get("nonPurchaser") === "true"
  const format = sp.get("format")

  const where: Record<string, unknown> = {}
  if (sourceFilter) where.source = sourceFilter
  if (status === "active") where.unsubscribedAt = null
  else if (status === "unsubscribed") where.unsubscribedAt = { not: null }
  if (fromIso || toIso) {
    const subscribedAt: Record<string, Date> = {}
    if (fromIso) {
      const d = new Date(fromIso)
      if (!isNaN(d.getTime())) subscribedAt.gte = d
    }
    if (toIso) {
      const d = new Date(toIso)
      if (!isNaN(d.getTime())) {
        // Inclusive end-of-day so a "to" of 2026-05-25 includes that day.
        d.setUTCHours(23, 59, 59, 999)
        subscribedAt.lte = d
      }
    }
    if (Object.keys(subscribedAt).length > 0) where.subscribedAt = subscribedAt
  }

  const allSubs = await prisma.subscriber.findMany({
    where,
    orderBy: { subscribedAt: "desc" },
  })

  // Cross-reference with Order to know which subscribers have purchased.
  // We always compute this so the JSON response can show "has_purchased"
  // segmentation — it's also what the nonPurchaser filter needs.
  const emails = allSubs.map((s) => s.email)
  const orderEmails = emails.length
    ? await prisma.order.findMany({
        where: { email: { in: emails } },
        select: { email: true },
        distinct: ["email"],
      })
    : []
  const purchaserSet = new Set(orderEmails.map((o) => o.email))

  const subscribers = nonPurchaser
    ? allSubs.filter((s) => !purchaserSet.has(s.email))
    : allSubs

  if (format === "csv") {
    const header =
      "email,name,source,subscribed_at,unsubscribed_at,last_email_sent,has_purchased\n"
    const rows = subscribers
      .map((s) =>
        [
          s.email,
          s.name ?? "",
          s.source,
          s.subscribedAt.toISOString(),
          s.unsubscribedAt?.toISOString() ?? "",
          s.lastEmailSent?.toISOString() ?? "",
          purchaserSet.has(s.email) ? "1" : "0",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n")
    // Filename encodes the active filters so multiple downloads stay sorted.
    const parts = ["subscribers"]
    if (sourceFilter) parts.push(sourceFilter)
    if (nonPurchaser) parts.push("non-purchaser")
    parts.push(new Date().toISOString().slice(0, 10))
    const filename = `${parts.join("-")}.csv`
    return new NextResponse(header + rows, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  }

  const active = subscribers.filter((s) => !s.unsubscribedAt).length
  return NextResponse.json({
    total: subscribers.length,
    active,
    unsubscribed: subscribers.length - active,
    bySource: subscribers.reduce<Record<string, number>>((acc, s) => {
      if (s.unsubscribedAt) return acc
      acc[s.source] = (acc[s.source] ?? 0) + 1
      return acc
    }, {}),
    nonPurchaserCount: subscribers.filter((s) => !purchaserSet.has(s.email)).length,
    subscribers: subscribers.slice(0, 200).map((s) => ({
      email: s.email,
      name: s.name,
      source: s.source,
      subscribedAt: s.subscribedAt.toISOString(),
      unsubscribedAt: s.unsubscribedAt?.toISOString() ?? null,
      hasPurchased: purchaserSet.has(s.email),
    })),
  })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase()
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })
  await prisma.subscriber.deleteMany({ where: { email } })
  return NextResponse.json({ ok: true })
}
