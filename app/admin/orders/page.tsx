import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import OrdersTable from "./OrdersTable"

export const metadata: Metadata = {
  title: "Orders — Paw Masterpiece Admin",
  robots: { index: false, follow: false },
}

export default async function OrdersPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/")

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      stripeSessionId: true,
      stripePaymentIntent: true,
      email: true,
      imageId: true,
      productType: true,
      priceCents: true,
      addWallpaper: true,
      createdAt: true,
      prodigiOrderId: true,
      prodigiStatus: true,
      prodigiStage: true,
      trackingUrl: true,
      trackingNumber: true,
      carrier: true,
      shippedAt: true,
    },
  })

  return (
    <main className="min-h-screen bg-cream px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl text-brand-green">Orders</h1>
            <p className="text-gray-500 text-sm mt-1">Latest 100 paid checkouts</p>
          </div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-green transition-colors">
            ← Admin
          </Link>
        </div>
        <OrdersTable
          initialOrders={orders.map(o => ({
            ...o,
            createdAt: o.createdAt.toISOString(),
            shippedAt: o.shippedAt ? o.shippedAt.toISOString() : null,
          }))}
        />
      </div>
    </main>
  )
}
