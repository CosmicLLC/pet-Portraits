"use client"

import { useState } from "react"

export default function PaymentPortalButton({ hasCustomer }: { hasCustomer: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openPortal = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/account/billing-portal", { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Couldn't open billing portal")
      }
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={openPortal}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-brand-green text-white px-5 py-2.5 rounded-full text-sm font-display font-semibold hover:bg-brand-green/90 transition-colors disabled:opacity-60"
      >
        {loading ? "Opening…" : hasCustomer ? "Manage payment methods" : "Add a payment method"}
        {!loading && (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        )}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
