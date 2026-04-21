import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import ProfileForm from "./ProfileForm"

export default async function AccountProfilePage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/account/profile")

  const [user, subscriber] = await Promise.all([
    prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: { id: true, name: true, email: true, emailVerified: true, createdAt: true, password: true },
    }),
    prisma.subscriber.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: { unsubscribedAt: true },
    }),
  ])

  if (!user) redirect("/auth/signin")

  const hasPassword = Boolean(user.password)
  const isSubscribed = Boolean(subscriber && !subscriber.unsubscribedAt)

  return (
    <div className="space-y-6">
      <ProfileForm
        initialName={user.name ?? ""}
        email={user.email}
        hasPassword={hasPassword}
        isSubscribed={isSubscribed}
      />

      {/* Static account facts */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-display text-lg font-semibold text-brand-green mb-4">Account details</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Email</dt>
            <dd className="text-gray-800 font-medium">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Email verified</dt>
            <dd className="text-gray-800 font-medium">{user.emailVerified ? "Yes" : "Pending"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Member since</dt>
            <dd className="text-gray-800 font-medium">
              {new Date(user.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Sign-in method</dt>
            <dd className="text-gray-800 font-medium">
              {hasPassword ? "Email + password" : "Google / magic link"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
