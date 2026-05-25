import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import OutreachBoard from "./OutreachBoard"

export const metadata: Metadata = {
  title: "Outreach Hub — Paw Masterpiece Admin",
  robots: { index: false, follow: false },
}

export default async function OutreachPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/")

  return (
    <main className="min-h-screen bg-cream px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-brand-green">Outreach Hub</h1>
            <p className="text-gray-500 text-sm mt-1">
              Pet blogger pitches + influencer DMs. Status tracking, copy-paste templates,
              and a DM generator for new Instagram/TikTok contacts.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-brand-green transition-colors"
          >
            ← Admin
          </Link>
        </div>

        <OutreachBoard />
      </div>
    </main>
  )
}
