import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import SubscribersTable from "./SubscribersTable"

export const metadata: Metadata = {
  title: "Subscribers — Paw Masterpiece Admin",
  robots: { index: false, follow: false },
}

export default async function SubscribersPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/")

  const [active, unsubscribed, bySource, recent, recentEmails] = await Promise.all([
    prisma.subscriber.count({ where: { unsubscribedAt: null } }),
    prisma.subscriber.count({ where: { unsubscribedAt: { not: null } } }),
    prisma.subscriber.groupBy({
      by: ["source"],
      _count: true,
      where: { unsubscribedAt: null },
    }),
    prisma.subscriber.findMany({
      orderBy: { subscribedAt: "desc" },
      take: 200,
      select: {
        id: true,
        email: true,
        name: true,
        source: true,
        subscribedAt: true,
        unsubscribedAt: true,
      },
    }),
    prisma.subscriber.findMany({
      orderBy: { subscribedAt: "desc" },
      take: 200,
      select: { email: true },
    }),
  ])

  // Tag the initial rows with hasPurchased so the table shows the buyer badge
  // even before any filter is applied. Cross-references with the Order table.
  const orderEmails = recentEmails.length
    ? await prisma.order.findMany({
        where: { email: { in: recentEmails.map((s) => s.email) } },
        select: { email: true },
        distinct: ["email"],
      })
    : []
  const purchaserSet = new Set(orderEmails.map((o) => o.email))

  return (
    <main className="min-h-screen bg-cream px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-brand-green">Subscribers</h1>
            <p className="text-gray-500 text-sm mt-1">
              <strong className="text-gray-700">{active.toLocaleString()}</strong> active · {unsubscribed.toLocaleString()} unsubscribed
            </p>
          </div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-green transition-colors">← Admin</Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {bySource.map((s) => (
            <span key={s.source} className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full">
              {s.source}: {s._count}
            </span>
          ))}
          <Link
            href="/admin/blocked"
            className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-gray-300"
          >
            Blocked emails
          </Link>
        </div>

        <SubscribersTable
          availableSources={bySource.map((s) => s.source).sort()}
          initialSubscribers={recent.map((s) => ({
            ...s,
            subscribedAt: s.subscribedAt.toISOString(),
            unsubscribedAt: s.unsubscribedAt?.toISOString() ?? null,
            hasPurchased: purchaserSet.has(s.email),
          }))}
        />
      </div>
    </main>
  )
}
