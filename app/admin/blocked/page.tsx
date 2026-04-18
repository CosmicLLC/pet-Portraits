import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import BlockedEditor from "./BlockedEditor"

export const metadata: Metadata = {
  title: "Blocked Emails — Paw Masterpiece Admin",
  robots: { index: false, follow: false },
}

export default async function BlockedPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/")

  const blocked = await prisma.blockedEmail.findMany({ orderBy: { blockedAt: "desc" } })

  return (
    <main className="min-h-screen bg-cream px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-brand-green">Blocked emails</h1>
            <p className="text-gray-500 text-sm mt-1">
              These addresses can&apos;t subscribe to newsletters. Adding an email also unsubscribes them.
            </p>
          </div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-green transition-colors">← Admin</Link>
        </div>
        <BlockedEditor initial={blocked.map(b => ({ ...b, blockedAt: b.blockedAt.toISOString() }))} />
      </div>
    </main>
  )
}
