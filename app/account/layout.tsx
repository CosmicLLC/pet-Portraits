import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import AccountTabs from "./AccountTabs"
import type { Metadata } from "next"
import SignOutButton from "./SignOutButton"

export const metadata: Metadata = {
  title: "My Account — Paw Masterpiece",
  robots: { index: false, follow: false },
}

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/account/orders")
  }

  const name = session.user.name || session.user.email.split("@")[0]

  return (
    <main className="min-h-screen bg-cream">
      {/* Slim header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.jpg" alt="" width={32} height={32} className="rounded-lg" />
            <span className="font-display text-lg text-brand-green font-semibold">
              Paw Masterpiece
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:inline">
              Hi, <strong className="text-gray-700">{name}</strong>
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl text-brand-green mb-1">My Account</h1>
          <p className="text-gray-500 text-sm">Orders, portraits, and profile in one place.</p>
        </div>

        <AccountTabs />

        <div className="mt-6">{children}</div>
      </div>
    </main>
  )
}
