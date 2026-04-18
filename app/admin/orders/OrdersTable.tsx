"use client"

import { useState, useCallback } from "react"

type Order = {
  id: string
  stripeSessionId: string
  stripePaymentIntent: string | null
  email: string
  imageId: string
  productType: string
  priceCents: number | null
  addWallpaper: boolean
  createdAt: string
}

function fmt$(cents: number | null): string {
  if (cents == null) return "—"
  return "$" + (cents / 100).toFixed(2)
}

export default function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [q, setQ] = useState("")
  const [searching, setSearching] = useState(false)
  const [resending, setResending] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const doSearch = useCallback(async () => {
    setSearching(true)
    try {
      const res = await fetch("/api/admin/orders?q=" + encodeURIComponent(q.trim()))
      const data = await res.json()
      setOrders(data.orders || [])
    } finally {
      setSearching(false)
    }
  }, [q])

  const onResend = useCallback(async (orderId: string) => {
    setResending(orderId)
    setToast(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/resend`, { method: "POST" })
      setToast(res.ok ? "Email resent" : "Resend failed")
      setTimeout(() => setToast(null), 2500)
    } finally {
      setResending(null)
    }
  }, [])

  return (
    <div>
      <div className="mb-4 flex gap-2 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="Search email, imageId, or Stripe session id…"
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white"
        />
        <button
          onClick={doSearch}
          disabled={searching}
          className="bg-brand-green text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-green/90 disabled:opacity-60"
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </div>

      {toast && (
        <div className="mb-3 p-2.5 rounded-lg bg-brand-green/5 border border-brand-green/20 text-brand-green text-sm text-center">
          {toast}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">When</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-left">imageId</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No orders</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{o.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {o.productType}{o.addWallpaper ? " + wallpaper" : ""}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-brand-green">{fmt$(o.priceCents)}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs truncate max-w-[120px]" title={o.imageId}>{o.imageId.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onResend(o.id)}
                      disabled={resending === o.id}
                      className="text-xs text-brand-green hover:underline mr-3 disabled:opacity-50"
                    >
                      {resending === o.id ? "Sending…" : "Resend email"}
                    </button>
                    <a
                      href={`/api/admin/download-portrait/${o.imageId}`}
                      className="text-xs text-brand-green hover:underline mr-3"
                    >
                      Download
                    </a>
                    {o.stripePaymentIntent && (
                      <a
                        href={`https://dashboard.stripe.com/payments/${o.stripePaymentIntent}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-brand-green hover:underline"
                      >
                        Refund on Stripe ↗
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
