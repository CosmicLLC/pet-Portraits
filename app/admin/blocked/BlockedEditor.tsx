"use client"

import { useState, useCallback } from "react"

type Blocked = { email: string; reason: string | null; blockedAt: string }

export default function BlockedEditor({ initial }: { initial: Blocked[] }) {
  const [blocked, setBlocked] = useState(initial)
  const [email, setEmail] = useState("")
  const [reason, setReason] = useState("")
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const add = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setAdding(true)
    try {
      const res = await fetch("/api/admin/blocked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), reason: reason.trim() || undefined }),
      })
      if (res.ok) {
        setBlocked(prev => [
          { email: email.trim().toLowerCase(), reason: reason.trim() || null, blockedAt: new Date().toISOString() },
          ...prev.filter(b => b.email !== email.trim().toLowerCase()),
        ])
        setEmail("")
        setReason("")
      }
    } finally {
      setAdding(false)
    }
  }, [email, reason])

  const remove = useCallback(async (target: string) => {
    setRemoving(target)
    try {
      await fetch(`/api/admin/blocked?email=${encodeURIComponent(target)}`, { method: "DELETE" })
      setBlocked(prev => prev.filter(b => b.email !== target))
    } finally {
      setRemoving(null)
    }
  }, [])

  return (
    <>
      <form onSubmit={add} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-display text-lg text-brand-green mb-3">Block a new email</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
          <input
            type="email"
            placeholder="abuser@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={adding}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white"
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={e => setReason(e.target.value)}
            disabled={adding}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white"
          />
          <button
            type="submit"
            disabled={adding || !email.trim()}
            className="bg-brand-green text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-green/90 disabled:opacity-60"
          >
            {adding ? "Blocking…" : "Block"}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {blocked.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            No blocked emails.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {blocked.map((b) => (
              <li key={b.email} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{b.email}</p>
                  {b.reason && <p className="text-xs text-gray-400 mt-0.5">{b.reason}</p>}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(b.blockedAt).toLocaleDateString()}</span>
                <button
                  onClick={() => remove(b.email)}
                  disabled={removing === b.email}
                  className="text-xs text-gray-500 hover:text-brand-green disabled:opacity-50"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
