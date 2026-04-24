import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard — Paw Masterpiece",
  robots: { index: false, follow: false },
}

const dayMs = 86400000
const dayKey = (d: Date) => d.toISOString().slice(0, 10)
const fmt$ = (cents: number) => "$" + (cents / 100).toFixed(cents >= 10000 ? 0 : 2)

export default async function AdminPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/")

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * dayMs)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * dayMs)

  const [
    totalUsers,
    recentUsers,
    activeSubscribers,
    unsubscribedCount,
    totalOrders,
    revenue30Raw,
    revenue7Raw,
    ordersForSparkline,
    subsForSparkline,
    errorCount,
    recentErrors,
    todayRateLimit,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, name: true, email: true, role: true, createdAt: true, image: true,
        accounts: { select: { provider: true } },
      },
    }),
    prisma.subscriber.count({ where: { unsubscribedAt: null } }),
    prisma.subscriber.count({ where: { unsubscribedAt: { not: null } } }),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { priceCents: true },
      _count: true,
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.order.aggregate({
      _sum: { priceCents: true },
      _count: true,
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, priceCents: true },
    }),
    prisma.subscriber.findMany({
      where: { subscribedAt: { gte: sevenDaysAgo } },
      select: { subscribedAt: true },
    }),
    prisma.eventLog.count({ where: { type: "error", createdAt: { gte: sevenDaysAgo } } }),
    prisma.eventLog.findMany({
      where: { type: "error" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.rateLimit.findUnique({ where: { key: `generate:global:${dayKey(now)}` } }),
  ])

  // 7-day buckets (oldest → newest)
  const ordersByDay: Record<string, { orders: number; cents: number; subs: number }> = {}
  for (let i = 6; i >= 0; i--) {
    ordersByDay[dayKey(new Date(now.getTime() - i * dayMs))] = { orders: 0, cents: 0, subs: 0 }
  }
  ordersForSparkline.forEach((o) => {
    const k = dayKey(o.createdAt)
    if (ordersByDay[k]) {
      ordersByDay[k].orders += 1
      ordersByDay[k].cents += o.priceCents || 0
    }
  })
  subsForSparkline.forEach((s) => {
    const k = dayKey(s.subscribedAt)
    if (ordersByDay[k]) ordersByDay[k].subs += 1
  })
  const sparklineDays = Object.entries(ordersByDay).map(([date, v]) => ({ date, ...v }))
  const maxOrders = Math.max(1, ...sparklineDays.map((d) => d.orders))
  const maxSubs = Math.max(1, ...sparklineDays.map((d) => d.subs))

  const dailyCap = Number(process.env.DAILY_GENERATE_CAP || "300")
  const usedToday = todayRateLimit?.count || 0
  const usedPct = Math.min(100, Math.round((usedToday / dailyCap) * 100))

  return (
    <main className="min-h-screen bg-cream px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl text-brand-green">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Signed in as {session.user.email}</p>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-brand-green transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to site
          </Link>
        </div>

        {/* Top row: revenue + orders + subscribers + users */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Revenue (30d)"
            value={fmt$(revenue30Raw._sum.priceCents || 0)}
            sub={`${revenue30Raw._count} orders`}
            tone="green"
          />
          <StatCard
            label="Revenue (7d)"
            value={fmt$(revenue7Raw._sum.priceCents || 0)}
            sub={`${revenue7Raw._count} orders`}
            tone="gold"
          />
          <StatCard
            label="Active subscribers"
            value={activeSubscribers.toLocaleString()}
            sub={unsubscribedCount > 0 ? `${unsubscribedCount} unsubscribed` : "all-time"}
          />
          <StatCard
            label="Users"
            value={totalUsers.toLocaleString()}
            sub={`${totalOrders} total orders`}
          />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mb-8">
          <QuickLink href="/admin/orders" label="Orders" />
          <QuickLink href="/admin/subscribers" label="Subscribers" />
          <QuickLink href="/admin/campaigns" label="Email campaigns" primary />
          <QuickLink href="/admin/ad-studio" label="🎨 Ad Studio" />
          <QuickLink href="/admin/events" label={`Event log${errorCount > 0 ? ` · ${errorCount} errors` : ""}`} danger={errorCount > 0} />
          <QuickLink href="/admin/portraits" label="Portraits gallery" />
          <QuickLink href="/admin/blocked" label="Blocked emails" />
          <a
            href="/api/admin/subscribers?format=csv"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs font-medium hover:border-gray-300"
          >
            ⬇ Subscribers CSV
          </a>
        </div>

        {/* Middle row: sparkline + rate limit */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-brand-green">Last 7 days</h2>
              <p className="text-xs text-gray-400">
                <span className="inline-block w-2 h-2 rounded-full bg-brand-green mr-1 align-middle" />
                orders
                <span className="inline-block w-2 h-2 rounded-full bg-brand-gold mr-1 ml-3 align-middle" />
                new subscribers
              </p>
            </div>
            <div className="flex items-end gap-2 h-32">
              {sparklineDays.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-0.5 h-24">
                    <div
                      className="flex-1 rounded-t bg-brand-green"
                      style={{ height: `${Math.max(2, (d.orders / maxOrders) * 100)}%` }}
                      title={`${d.orders} orders · ${fmt$(d.cents)}`}
                    />
                    <div
                      className="flex-1 rounded-t bg-brand-gold"
                      style={{ height: `${Math.max(2, (d.subs / maxSubs) * 100)}%` }}
                      title={`${d.subs} new subscribers`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-display text-lg text-brand-green mb-3">Generation usage today</h2>
            <div className="flex items-baseline gap-2 mb-3">
              <p className="font-display text-3xl text-brand-green font-bold">{usedToday}</p>
              <p className="text-sm text-gray-400">/ {dailyCap} cap</p>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full ${usedPct > 90 ? "bg-red-500" : usedPct > 70 ? "bg-amber-500" : "bg-brand-green"}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Per-IP rate limit 5/min. Global cap resets at midnight UTC.
            </p>
          </div>
        </div>

        {/* Recent errors */}
        {recentErrors.length > 0 && (
          <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-red-50 flex items-center justify-between">
              <h2 className="font-display text-lg text-red-600">Recent errors</h2>
              <Link href="/admin/events?type=error" className="text-xs text-red-600 hover:underline">View all →</Link>
            </div>
            <ul className="divide-y divide-gray-100">
              {recentErrors.map((e) => (
                <li key={e.id} className="px-6 py-3">
                  <div className="flex items-start gap-3">
                    <span className="text-[10px] uppercase tracking-wider text-red-600 font-bold flex-shrink-0 mt-0.5">{e.source}</span>
                    <p className="text-sm text-gray-700 flex-1 min-w-0">{e.message}</p>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent users */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-display text-xl text-brand-green">Recent sign-ups</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentUsers.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-400 text-sm">
                No users yet.
              </div>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-semibold text-sm flex-shrink-0 overflow-hidden">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
                    ) : (
                      (user.name?.[0] || user.email?.[0] || "?").toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{user.name || "—"}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {user.accounts.map((a) => (
                      <span key={a.provider} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                        {a.provider}
                      </span>
                    ))}
                    {user.accounts.length === 0 && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">email</span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${user.role === "admin" ? "bg-brand-green/10 text-brand-green" : "bg-gray-100 text-gray-500"}`}>
                    {user.role}
                  </span>
                  <span className="text-xs text-gray-300 flex-shrink-0 hidden sm:block">
                    {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string | number
  sub?: string
  tone?: "green" | "gold"
}) {
  const accent =
    tone === "gold"
      ? "bg-brand-gold/10 text-brand-gold"
      : tone === "green"
      ? "bg-brand-green/10 text-brand-green"
      : "bg-gray-100 text-gray-500"
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${accent} mb-3`}>
        {label}
      </span>
      <p className="font-display text-3xl text-brand-green font-bold">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function QuickLink({ href, label, primary, danger }: { href: string; label: string; primary?: boolean; danger?: boolean }) {
  const base = "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
  if (primary) return <Link href={href} className={`${base} bg-brand-green text-white hover:bg-brand-green/90`}>{label}</Link>
  if (danger) return <Link href={href} className={`${base} bg-red-50 border border-red-100 text-red-600 hover:bg-red-100`}>{label}</Link>
  return <Link href={href} className={`${base} bg-white border border-gray-200 text-gray-700 hover:border-brand-green/40`}>{label}</Link>
}
