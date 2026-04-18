"use client"

import { useState, useMemo, useCallback } from "react"

type Sub = {
  id: string
  email: string
  name: string | null
  source: string
  subscribedAt: string
  unsubscribedAt: string | null
}

export default function SubscribersTable({ initialSubscribers }: { initialSubscribers: Sub[] }) {
  const [subs, setSubs] = useState(initialSubscribers)
  const [q, setQ] = useState("")
  const [working, setWorking] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!q.trim()) return subs
    const n = q.trim().toLowerCase()
    return subs.filter(s =>
      s.email.toLowerCase().includes(n) ||
      s.name?.toLowerCase().includes(n) ||
      s.source.toLowerCase().includes(n)
    )
  }, [subs, q])

  const onRemove = useCallback(async (email: string) => {
    if (!confirm(`Remove ${email} from the subscriber list?`)) return
    setWorking(email)
    try {
      const res = await fetch(`/api/admin/subscribers?email=${encodeURIComponent(email)}`, { method: "DELETE" })
      if (res.ok) setSubs(prev => prev.filter(s => s.email !== email))
    } finally {
      setWorking(null)
    }
  }, [])

  const onBlock = useCallback(async (email: string) => {
    const reason = prompt(`Block ${email}? (optional reason)`)
    if (reason === null) return
    setWorking(email)
    try {
      const res = await fetch("/api/admin/blocked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason: reason || undefined }),
      })
      if (res.ok) setSubs(prev => prev.map(s => s.email === email ? { ...s, unsubscribedAt: new Date().toISOString() } : s))
    } finally {
      setWorking(null)
    }
  }, [])

  return (
    <>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Filter by email, name, or source…"
        className="w-full mb-4 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white"
      />
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No matches</td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 text-gray-800">
                    {s.email}{s.name ? <span className="text-gray-400 ml-2">({s.name})</span> : null}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.source}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(s.subscribedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {s.unsubscribedAt ? (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">unsubscribed</span>
                    ) : (
                      <span className="text-xs bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full">active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {!s.unsubscribedAt && (
                      <button
                        onClick={() => onBlock(s.email)}
                        disabled={working === s.email}
                        className="text-xs text-amber-700 hover:underline mr-3 disabled:opacity-50"
                      >
                        Block
                      </button>
                    )}
                    <button
                      onClick={() => onRemove(s.email)}
                      disabled={working === s.email}
                      className="text-xs text-red-600 hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
