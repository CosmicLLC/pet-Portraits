import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Admin — Pet Portraits" };

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/auth/signin?callbackUrl=/admin");
  if ((session.user as { role?: string }).role !== "admin") {
    redirect("/");
  }

  const [userCount, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-2xl text-brand-green tracking-tight hover:opacity-80 transition-opacity"
          >
            Pet Portraits
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-green/60 bg-brand-green/10 px-3 py-1 rounded-full">
            Admin
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-brand-green mb-1">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Signed in as{" "}
            <strong className="text-gray-700">{session.user?.email}</strong>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard label="Total Users" value={userCount} icon="👤" />
          <StatCard label="Admin Role" value="Active" icon="🛡️" />
          <StatCard label="Auth Providers" value="Google + Email" icon="🔐" />
        </div>

        {/* Recent users */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-display text-lg text-brand-green">
              Recent Signups
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">
                No users yet
              </p>
            ) : (
              recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="px-6 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {u.name ?? u.email ?? "—"}
                    </p>
                    {u.name && (
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        u.role === "admin"
                          ? "bg-brand-green/10 text-brand-green"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {u.role}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center gap-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-2xl font-display font-semibold text-brand-green">
          {value}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
