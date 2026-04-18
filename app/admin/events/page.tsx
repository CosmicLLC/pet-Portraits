import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Events — Paw Masterpiece Admin",
  robots: { index: false, follow: false },
}

const typeColor: Record<string, string> = {
  error: "bg-red-50 text-red-600 border-red-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
  info: "bg-gray-50 text-gray-600 border-gray-100",
}

export default async function EventsPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/")

  const [errorCount, warningCount, infoCount, events] = await Promise.all([
    prisma.eventLog.count({ where: { type: "error" } }),
    prisma.eventLog.count({ where: { type: "warning" } }),
    prisma.eventLog.count({ where: { type: "info" } }),
    prisma.eventLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ])

  return (
    <main className="min-h-screen bg-cream px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-brand-green">Event log</h1>
            <p className="text-gray-500 text-sm mt-1">
              Last 200 · {errorCount} errors · {warningCount} warnings · {infoCount} info
            </p>
          </div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-green transition-colors">← Admin</Link>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {events.length === 0 ? (
            <div className="px-6 py-16 text-center text-gray-400 text-sm">
              No events yet. Errors and notable actions will show here when they happen.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {events.map((e) => (
                <li key={e.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeColor[e.type] || typeColor.info}`}>
                          {e.type}
                        </span>
                        <span className="text-xs text-gray-400">{e.source}</span>
                      </div>
                      <p className="text-sm text-gray-800">{e.message}</p>
                      {e.context != null && (
                        <pre className="mt-1 text-[11px] text-gray-400 font-mono whitespace-pre-wrap break-all max-h-24 overflow-hidden">
                          {JSON.stringify(e.context, null, 2)}
                        </pre>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {new Date(e.createdAt).toLocaleString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
