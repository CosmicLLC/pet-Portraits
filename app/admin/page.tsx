import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard — Pet Portraits",
}

// Read subscriber count from local JSON store
async function getSubscriberCount(): Promise<number> {
  try {
    const fs = await import("fs/promises")
    const path = await import("path")
    const filePath = path.join(process.cwd(), "data", "subscribers.json")
    const raw = await fs.readFile(filePath, "utf-8")
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data.length : 0
  } catch {
    return 0
  }
}

export default async function AdminPage() {
  const session = await auth()

  // Guard: must be signed in as admin
  if (!session || session.user.role !== "admin") {
    redirect("/")
  }

  // Fetch stats in parallel
  const [totalUsers, recentUsers, subscriberCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        image: true,
        accounts: { select: { provider: true } },
      },
    }),
    getSubscriberCount(),
  ])

  return (
    <main className="min-h-screen bg-cream px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl text-brand-green">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Signed in as {session.user.email}</p>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-brand-green transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to site
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard label="Total Users" value={totalUsers} icon="👤" />
          <StatCard label="Subscribers" value={subscriberCount} icon="✉️" subtitle="portraits + newsletter" />
          <StatCard label="Total Accounts" value={totalUsers} icon="🔐" subtitle="across all providers" />
        </div>

        {/* Recent signups */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-display text-xl text-brand-green">Recent Sign-ups</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentUsers.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-400 text-sm">
                No users yet. Users will appear here after they sign in.
              </div>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="px-6 py-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-semibold text-sm flex-shrink-0 overflow-hidden">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
                    ) : (
                      (user.name?.[0] || user.email?.[0] || "?").toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{user.name || "—"}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>

                  {/* Providers */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {user.accounts.map((a) => (
                      <span
                        key={a.provider}
                        className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize"
                      >
                        {a.provider}
                      </span>
                    ))}
                    {user.accounts.length === 0 && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">email</span>
                    )}
                  </div>

                  {/* Role badge */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      user.role === "admin"
                        ? "bg-brand-green/10 text-brand-green"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {user.role}
                  </span>

                  {/* Date */}
                  <span className="text-xs text-gray-300 flex-shrink-0 hidden sm:block">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
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
  icon,
  subtitle,
}: {
  label: string
  value: number
  icon: string
  subtitle?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="text-2xl mb-3">{icon}</div>
      <p className="font-display text-3xl text-brand-green font-bold">{value.toLocaleString()}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}
