import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { list } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Portraits — Paw Masterpiece Admin",
  robots: { index: false, follow: false },
}

export default async function PortraitsPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/")

  const { blobs } = await list({ prefix: "portraits/", limit: 60 })
  const imageIds = blobs
    .map((b) => b.pathname.match(/^portraits\/([^.]+?)(?:-[A-Za-z0-9]{21})?\.png$/)?.[1] ?? null)
    .filter(Boolean) as string[]

  const orders = await prisma.order.findMany({
    where: { imageId: { in: imageIds } },
    select: { imageId: true, email: true, productType: true, createdAt: true },
  })
  const byImageId = new Map(orders.map((o) => [o.imageId, o]))

  return (
    <main className="min-h-screen bg-cream px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-brand-green">Generated portraits</h1>
            <p className="text-gray-500 text-sm mt-1">Latest 60 full-resolution portraits in Blob storage</p>
          </div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-green transition-colors">← Admin</Link>
        </div>

        {blobs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-6 py-16 text-center text-gray-400 text-sm">
            No portraits yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {blobs.map((b) => {
              const imageId = b.pathname.match(/^portraits\/([^.]+?)(?:-[A-Za-z0-9]{21})?\.png$/)?.[1] ?? null
              const order = imageId ? byImageId.get(imageId) : undefined
              const downloadUrl = imageId ? `/api/admin/download-portrait/${imageId}` : null
              return (
                <div key={b.pathname} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-2">
                    {downloadUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={downloadUrl} alt="portrait" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>
                    )}
                  </div>
                  <div className="text-xs">
                    {order ? (
                      <>
                        <p className="text-gray-800 truncate">{order.email}</p>
                        <p className="text-gray-400">{order.productType} · {new Date(order.createdAt).toLocaleDateString()}</p>
                      </>
                    ) : (
                      <p className="text-gray-400">no order yet</p>
                    )}
                    <p className="text-gray-300 mt-1">{(b.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
