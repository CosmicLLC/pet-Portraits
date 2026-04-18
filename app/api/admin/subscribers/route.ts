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

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const format = req.nextUrl.searchParams.get("format")
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { subscribedAt: "desc" },
  })

  if (format === "csv") {
    const header = "email,name,source,subscribed_at,unsubscribed_at,last_email_sent\n"
    const rows = subscribers
      .map((s) =>
        [
          s.email,
          s.name ?? "",
          s.source,
          s.subscribedAt.toISOString(),
          s.unsubscribedAt?.toISOString() ?? "",
          s.lastEmailSent?.toISOString() ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n")
    return new NextResponse(header + rows, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
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
    subscribers: subscribers.slice(0, 100).map((s) => ({
      email: s.email,
      name: s.name,
      source: s.source,
      subscribedAt: s.subscribedAt.toISOString(),
      unsubscribedAt: s.unsubscribedAt?.toISOString() ?? null,
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
