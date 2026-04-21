import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { signDownloadToken } from "@/lib/download-token"
import { isPhysicalProduct, PRODUCTS, type ProductType } from "@/lib/products"

const fmt$ = (cents: number | null): string => {
  if (cents == null) return "—"
  return "$" + (cents / 100).toFixed(2)
}

function productLabel(type: string): string {
  return PRODUCTS[type as ProductType]?.label ?? type
}

function statusChip(order: {
  productType: string
  prodigiStatus: string | null
  trackingUrl: string | null
  shippedAt: Date | null
}) {
  const physical = isPhysicalProduct(order.productType)

  if (!physical) {
    return {
      label: "Delivered",
      className: "bg-green-50 text-green-700 border-green-200",
      hint: "Digital download ready below",
    }
  }
  const s = order.prodigiStatus
  if (s === "Complete" || s === "Shipped" || order.trackingUrl) {
    return {
      label: order.shippedAt ? "Shipped" : "Complete",
      className: "bg-green-50 text-green-700 border-green-200",
      hint: "Track your package below",
    }
  }
  if (s === "InProgress") {
    return {
      label: "In production",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      hint: "We're printing and packing — tracking arrives when it ships",
    }
  }
  if (s === "Failed") {
    return {
      label: "Needs attention",
      className: "bg-red-50 text-red-700 border-red-200",
      hint: "Reply to your confirmation email — we'll sort this out",
    }
  }
  if (s === "Cancelled") {
    return {
      label: "Cancelled",
      className: "bg-gray-100 text-gray-600 border-gray-200",
      hint: "",
    }
  }
  return {
    label: "Preparing",
    className: "bg-gray-50 text-gray-500 border-gray-200",
    hint: "Setting up with our print partner",
  }
}

export default async function AccountOrdersPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/account/orders")

  const orders = await prisma.order.findMany({
    where: { email: session.user.email.toLowerCase() },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || ""

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="text-5xl mb-4">🐾</div>
        <h2 className="font-display text-xl text-brand-green mb-2">No orders yet</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          Create your first pet portrait — it takes about 30 seconds.
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
    <div className="space-y-4">
      {orders.map((order) => {
        const chip = statusChip(order)
        const { token, exp } = signDownloadToken(order.id)
        const downloadUrl = `${baseUrl}/api/download/${order.id}?token=${token}&exp=${exp}`
        const wallpaperUrl = order.wallpaperBlobUrl
          ? `${baseUrl}/api/download/${order.id}?token=${token}&exp=${exp}&type=wallpaper`
          : null
        const hasDigital = order.productType === "digital" || order.productType === "wallpaper" || order.productType === "bundle"
        const hasPhysical = isPhysicalProduct(order.productType)

        return (
          <article
            key={order.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display font-semibold text-brand-green text-base">
                  {productLabel(order.productType)}
                  {order.addWallpaper ? " + wallpaper" : ""}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Ordered {new Date(order.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  {" "}· Order <span className="font-mono">{order.id.slice(0, 8)}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display font-semibold text-brand-green">{fmt$(order.priceCents)}</span>
                <span
                  className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border ${chip.className}`}
                >
                  {chip.label}
                </span>
              </div>
            </div>

            <div className="px-5 py-4">
              {chip.hint && <p className="text-sm text-gray-500 mb-4">{chip.hint}</p>}

              {hasDigital && (
                <div className="flex flex-wrap gap-3 mb-3">
                  <a
                    href={downloadUrl}
                    className="inline-flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-full text-sm font-display font-semibold hover:bg-brand-green/90 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Portrait
                  </a>
                  {wallpaperUrl && (
                    <a
                      href={wallpaperUrl}
                      className="inline-flex items-center gap-2 bg-white border border-brand-green text-brand-green px-4 py-2 rounded-full text-sm font-display font-semibold hover:bg-brand-green/5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Wallpaper
                    </a>
                  )}
                </div>
              )}

              {hasPhysical && order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-brand-green hover:underline"
                >
                  Track with {order.carrier ?? "carrier"}
                  {order.trackingNumber && (
                    <span className="font-mono text-gray-500">({order.trackingNumber})</span>
                  )}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              )}

              {hasDigital && (
                <p className="text-xs text-gray-400 mt-3">
                  Download links expire in 7 days. Come back here or email us for a fresh one.
                </p>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
