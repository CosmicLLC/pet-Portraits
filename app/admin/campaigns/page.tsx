import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import CampaignComposer from "./CampaignComposer"

export const metadata: Metadata = {
  title: "Campaigns — Paw Masterpiece Admin",
  robots: { index: false, follow: false },
}

export default async function CampaignsPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/")

  const [activeSubscribers, campaigns] = await Promise.all([
    prisma.subscriber.count({ where: { unsubscribedAt: null } }),
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        subject: true,
        status: true,
        recipients: true,
        delivered: true,
        failed: true,
        sentAt: true,
        createdAt: true,
      },
    }),
  ])

  return (
    <main className="min-h-screen bg-cream px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl text-brand-green">Email Campaigns</h1>
            <p className="text-gray-500 text-sm mt-1">
              Sending to <strong>{activeSubscribers}</strong> active subscriber{activeSubscribers === 1 ? "" : "s"}
            </p>
          </div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-green transition-colors">
            ← Admin
          </Link>
        </div>

        <CampaignComposer activeSubscribers={activeSubscribers} />

        <div className="mt-10 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-display text-xl text-brand-green">Recent campaigns</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {campaigns.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-400 text-sm">
                No campaigns sent yet.
              </div>
            ) : (
              campaigns.map((c) => (
                <div key={c.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.subject}</p>
                    <p className="text-xs text-gray-400">
                      {c.sentAt ? new Date(c.sentAt).toLocaleString() : new Date(c.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">
                      {c.delivered} delivered{c.failed > 0 ? ` · ${c.failed} failed` : ""}
                    </p>
                    <p className="text-[11px] text-gray-400">of {c.recipients}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      c.status === "sent"
                        ? "bg-brand-green/10 text-brand-green"
                        : c.status === "failed"
                        ? "bg-red-50 text-red-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {c.status}
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
