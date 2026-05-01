import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import MugPrintTool from "./MugPrintTool"

export const metadata: Metadata = {
  title: "Mug Print Tool — Paw Masterpiece Admin",
  robots: { index: false, follow: false },
}

export default async function MugPrintPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/")

  return (
    <main className="min-h-screen bg-cream px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-brand-green">Mug Print Tool</h1>
            <p className="text-gray-500 text-sm mt-1">
              Drop a pet photo, pick a background, get a 2700×1050 banner PNG ready for the magic mug.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-brand-green transition-colors"
          >
            ← Admin
          </Link>
        </div>

        <MugPrintTool />
      </div>
    </main>
  )
}
