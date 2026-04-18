import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function GET() {
  const session = await auth()
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const now = new Date()
  const dayMs = 86400000
  const sevenDaysAgo = new Date(now.getTime() - 7 * dayMs)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * dayMs)

  const [revenue7Raw, revenue30Raw, recentOrders, recentSubs, todayGen] = await Promise.all([
    prisma.order.aggregate({
      _sum: { priceCents: true },
      _count: true,
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.order.aggregate({
      _sum: { priceCents: true },
      _count: true,
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, priceCents: true },
    }),
    prisma.subscriber.findMany({
      where: { subscribedAt: { gte: sevenDaysAgo } },
      select: { subscribedAt: true },
    }),
    prisma.rateLimit.findUnique({
      where: { key: `generate:global:${dayKey(now)}` },
    }),
  ])

  // Build 7-day sparkline buckets (oldest → newest)
  const ordersByDay: Record<string, { orders: number; cents: number }> = {}
  const subsByDay: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const key = dayKey(new Date(now.getTime() - i * dayMs))
    ordersByDay[key] = { orders: 0, cents: 0 }
    subsByDay[key] = 0
  }
  recentOrders.forEach((o) => {
    const k = dayKey(o.createdAt)
    if (!ordersByDay[k]) return
    ordersByDay[k].orders += 1
    ordersByDay[k].cents += o.priceCents || 0
  })
  recentSubs.forEach((s) => {
    const k = dayKey(s.subscribedAt)
    if (!(k in subsByDay)) return
    subsByDay[k] += 1
  })

  const dailyCap = Number(process.env.DAILY_GENERATE_CAP || "300")

  return NextResponse.json({
    revenue7: {
      cents: revenue7Raw._sum.priceCents || 0,
      orders: revenue7Raw._count,
    },
    revenue30: {
      cents: revenue30Raw._sum.priceCents || 0,
      orders: revenue30Raw._count,
    },
    sparkline: Object.keys(ordersByDay).map((k) => ({
      date: k,
      orders: ordersByDay[k].orders,
      cents: ordersByDay[k].cents,
      subscribers: subsByDay[k] || 0,
    })),
    rateLimit: {
      usedToday: todayGen?.count || 0,
      cap: dailyCap,
      resetsAt: todayGen?.resetAt?.toISOString() || null,
    },
  })
}
