import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { UPSELL_PRICE_USD } from "@/lib/upsell"

export const metadata: Metadata = {
  title: "Upsell Ladder — Admin — Paw Masterpiece",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

const dayMs = 86400000
const fmt$ = (cents: number) => "$" + (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)
const fmtDate = (d: Date) =>
  d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })

// Human labels for each ladder touch, in funnel order.
const SOURCE_LABELS: Record<string, string> = {
  wallpaper_success_modal: "Success modal",
  email_1h: "Email — 1h",
  email_24h: "Email — 24h",
  email_72h: "Email — 72h",
}

const TEMPLATE_LABELS: Record<string, string> = {
  upsell_1h: "1h touch",
  upsell_24h: "24h touch",
  upsell_72h: "72h touch",
}

export default async function UpsellsAdminPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/")

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * dayMs)

  const [
    wallpaperAll,
    wallpaper30,
    conversions,
    pendingCount,
    sentCount,
    cancelledCount,
    failedCount,
    upcoming,
  ] = await Promise.all([
    prisma.order.count({ where: { productType: "wallpaper" } }),
    prisma.order.count({
      where: { productType: "wallpaper", createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.order.findMany({
      where: { upsellSource: { not: null } },
      select: {
        id: true,
        email: true,
        upsellSource: true,
        originalOrderId: true,
        priceCents: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.scheduledEmail.count({ where: { status: "pending" } }),
    prisma.scheduledEmail.count({ where: { status: "sent" } }),
    prisma.scheduledEmail.count({ where: { status: "cancelled" } }),
    prisma.scheduledEmail.count({ where: { status: "failed" } }),
    prisma.scheduledEmail.findMany({
      where: { status: "pending" },
      orderBy: { sendAt: "asc" },
      take: 10,
    }),
  ])

  const upsellRevenueCents = conversions.reduce((s, c) => s + (c.priceCents ?? 0), 0)
  const conversionRate = wallpaperAll > 0 ? (conversions.length / wallpaperAll) * 100 : 0

  const bySource = Object.keys(SOURCE_LABELS).map((source) => {
    const rows = conversions.filter((c) => c.upsellSource === source)
    return {
      source,
      label: SOURCE_LABELS[source],
      count: rows.length,
      revenueCents: rows.reduce((s, c) => s + (c.priceCents ?? 0), 0),
    }
  })

  const recentConversions = conversions.slice(0, 10)

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl text-brand-green font-semibold">
              Wallpaper → Canvas Ladder
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Upsell offer: 8×10 framed print at ${UPSELL_PRICE_USD} · modal + 3 email touches
            </p>
          </div>
          <Link href="/admin" className="text-sm text-brand-green hover:underline">
            ← Admin dashboard
          </Link>
        </div>

        {/* Headline stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Wallpaper orders (all)" value={String(wallpaperAll)} sub={`${wallpaper30} in last 30d`} />
          <StatCard label="Ladder conversions" value={String(conversions.length)} sub="orders with upsellSource" />
          <StatCard label="Conversion rate" value={`${conversionRate.toFixed(1)}%`} sub="conversions / wallpapers" />
          <StatCard label="Upsell revenue" value={fmt$(upsellRevenueCents)} sub="gross, attributed" />
        </div>

        {/* Per-source breakdown */}
        <section className="bg-white rounded-2xl border border-gray-100 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-display text-lg text-brand-green">Conversions by touch</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="px-6 py-3 font-medium">Touch</th>
                <th className="px-6 py-3 font-medium">Conversions</th>
                <th className="px-6 py-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bySource.map((s) => (
                <tr key={s.source}>
                  <td className="px-6 py-3 font-medium text-gray-700">{s.label}</td>
                  <td className="px-6 py-3 text-gray-600">{s.count}</td>
                  <td className="px-6 py-3 text-gray-600">{fmt$(s.revenueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Email queue state */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-display text-lg text-brand-green">Email queue</h2>
            </div>
            <div className="grid grid-cols-4 divide-x divide-gray-50 text-center">
              <QueueStat label="Pending" value={pendingCount} tone="text-brand-green" />
              <QueueStat label="Sent" value={sentCount} tone="text-gray-700" />
              <QueueStat label="Cancelled" value={cancelledCount} tone="text-gray-400" />
              <QueueStat label="Failed" value={failedCount} tone={failedCount > 0 ? "text-red-600" : "text-gray-400"} />
            </div>
            <p className="px-6 py-3 text-[11px] text-gray-400 border-t border-gray-50">
              Cancelled = converted, unsubscribed, or window expired before send.
              Failed rows have their last error stored and appear in the event log.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-display text-lg text-brand-green">Next sends</h2>
            </div>
            {upcoming.length === 0 ? (
              <p className="px-6 py-6 text-sm text-gray-400">Nothing queued.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {upcoming.map((e) => (
                  <li key={e.id} className="px-6 py-2.5 flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate mr-3">{e.email}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {TEMPLATE_LABELS[e.template] ?? e.template} · {fmtDate(e.sendAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Recent conversions */}
        <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-display text-lg text-brand-green">Recent conversions</h2>
          </div>
          {recentConversions.length === 0 ? (
            <p className="px-6 py-6 text-sm text-gray-400">
              No ladder conversions yet. They&rsquo;ll appear here the moment a
              wallpaper buyer upgrades.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-3 font-medium">When</th>
                  <th className="px-6 py-3 font-medium">Buyer</th>
                  <th className="px-6 py-3 font-medium">Touch</th>
                  <th className="px-6 py-3 font-medium">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentConversions.map((c) => (
                  <tr key={c.id}>
                    <td className="px-6 py-3 text-gray-500">{fmtDate(c.createdAt)}</td>
                    <td className="px-6 py-3 text-gray-700">{c.email}</td>
                    <td className="px-6 py-3 text-gray-600">
                      {SOURCE_LABELS[c.upsellSource ?? ""] ?? c.upsellSource}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{fmt$(c.priceCents ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="font-display text-2xl text-brand-green font-semibold">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function QueueStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="py-4">
      <p className={`font-display text-xl font-semibold ${tone}`}>{value}</p>
      <p className="text-[11px] text-gray-400">{label}</p>
    </div>
  )
}
