import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { signDownloadToken } from "@/lib/download-token"

export default async function AccountPortraitsPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/account/portraits")

  // A customer's portrait gallery = the set of paid orders they have.
  // We dedupe by imageId so a canvas + its bundle reprint don't double-show.
  const orders = await prisma.order.findMany({
    where: { email: session.user.email.toLowerCase() },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const seen = new Set<string>()
  const portraits = orders.filter((o) => {
    if (seen.has(o.imageId)) return false
    seen.add(o.imageId)
    return true
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || ""

  if (portraits.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="text-5xl mb-4">🎨</div>
        <h2 className="font-display text-xl text-brand-green mb-2">No portraits yet</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          Once you purchase a portrait, it'll live here for future downloads.
        </p>
        <Link
          href="/"
          className="inline-block bg-brand-green text-white px-6 py-3 rounded-full text-sm font-display font-semibold hover:bg-brand-green/90 transition-colors"
        >
          Make a Portrait
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {portraits.map((p) => {
        const { token, exp } = signDownloadToken(p.id)
        const downloadUrl = `${baseUrl}/api/download/${p.id}?token=${token}&exp=${exp}`
        return (
          <article
            key={p.id}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* We show the portrait blob URL directly here so customers can see
                their art — even though full download goes through the gated route.
                These server-rendered URLs leak only inside the logged-in dashboard. */}
            <div className="relative aspect-square bg-gray-50">
              <Image
                src={p.portraitBlobUrl}
                alt="Your portrait"
                fill
                unoptimized
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className="p-3">
              <p className="text-xs text-gray-400 mb-2">
                {new Date(p.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <a
                href={downloadUrl}
                className="block text-center bg-brand-green text-white text-xs font-display font-semibold py-2 rounded-full hover:bg-brand-green/90 transition-colors"
              >
                Download
              </a>
            </div>
          </article>
        )
      })}
    </div>
  )
}
