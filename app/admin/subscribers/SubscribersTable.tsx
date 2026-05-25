"use client"

import { useState, useMemo, useCallback, useEffect } from "react"

type Sub = {
  id?: string
  email: string
  name: string | null
  source: string
  subscribedAt: string
  unsubscribedAt: string | null
  hasPurchased?: boolean
}

interface Filters {
  source: string
  status: "active" | "unsubscribed" | "all"
  from: string
  to: string
  nonPurchaser: boolean
}

const DEFAULT_FILTERS: Filters = {
  source: "",
  status: "active",
  from: "",
  to: "",
  nonPurchaser: false,
}

function buildQuery(filters: Filters): string {
  const params = new URLSearchParams()
  if (filters.source) params.set("source", filters.source)
  if (filters.status !== "active") params.set("status", filters.status)
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)
  if (filters.nonPurchaser) params.set("nonPurchaser", "true")
  return params.toString()
}

export default function SubscribersTable({
  initialSubscribers,
  availableSources,
}: {
  initialSubscribers: Sub[]
  availableSources: string[]
}) {
  const [subs, setSubs] = useState(initialSubscribers)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [q, setQ] = useState("")
  const [working, setWorking] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(initialSubscribers.length)
  const [nonPurchaserCount, setNonPurchaserCount] = useState<number | null>(null)

  // Refetch when filters change. The initialSubscribers come from the page's
  // unfiltered server render — once the user touches a filter, we route
  // through the API so segmentation matches what the CSV download will give.
  useEffect(() => {
    const isDefault =
      filters.source === DEFAULT_FILTERS.source &&
      filters.status === DEFAULT_FILTERS.status &&
      filters.from === DEFAULT_FILTERS.from &&
      filters.to === DEFAULT_FILTERS.to &&
      filters.nonPurchaser === DEFAULT_FILTERS.nonPurchaser
    if (isDefault) {
      setSubs(initialSubscribers)
      setTotalCount(initialSubscribers.length)
      setNonPurchaserCount(null)
      return
    }
    let cancelled = false
    setLoading(true)
    const qs = buildQuery(filters)
    fetch(`/api/admin/subscribers?${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setSubs(data.subscribers || [])
        setTotalCount(data.total ?? 0)
        setNonPurchaserCount(data.nonPurchaserCount ?? null)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [filters, initialSubscribers])

  const filtered = useMemo(() => {
    if (!q.trim()) return subs
    const n = q.trim().toLowerCase()
    return subs.filter(
      (s) =>
        s.email.toLowerCase().includes(n) ||
        s.name?.toLowerCase().includes(n) ||
        s.source.toLowerCase().includes(n)
    )
  }, [subs, q])

  const csvHref = `/api/admin/subscribers?${buildQuery(filters)}${
    buildQuery(filters) ? "&" : ""
  }format=csv`

  const onRemove = useCallback(async (email: string) => {
    if (!confirm(`Remove ${email} from the subscriber list?`)) return
    setWorking(email)
    try {
      const res = await fetch(
        `/api/admin/subscribers?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      )
      if (res.ok) setSubs((prev) => prev.filter((s) => s.email !== email))
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
      if (res.ok)
        setSubs((prev) =>
          prev.map((s) =>
            s.email === email
              ? { ...s, unsubscribedAt: new Date().toISOString() }
              : s
          )
        )
    } finally {
      setWorking(null)
    }
  }, [])

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }))

  return (
    <>
      {/* Retargeting filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
        <p className="text-xs font-display font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Segmentation filters
          <span className="ml-2 text-gray-400 normal-case font-normal tracking-normal">
            — for retargeting + Meta/TikTok Custom Audience exports
          </span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-gray-600">Source</span>
            <select
              value={filters.source}
              onChange={(e) => updateFilter("source", e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-brand-green/40"
            >
              <option value="">All sources</option>
              {availableSources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-gray-600">Status</span>
            <select
              value={filters.status}
              onChange={(e) =>
                updateFilter("status", e.target.value as Filters["status"])
              }
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-brand-green/40"
            >
              <option value="active">Active only</option>
              <option value="unsubscribed">Unsubscribed only</option>
              <option value="all">All</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-gray-600">From</span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => updateFilter("from", e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-brand-green/40"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-gray-600">To</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => updateFilter("to", e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-brand-green/40"
            />
          </label>
          <label className="flex items-end gap-2 pb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.nonPurchaser}
              onChange={(e) => updateFilter("nonPurchaser", e.target.checked)}
              className="w-4 h-4 accent-brand-green"
            />
            <span className="text-xs text-gray-700 leading-tight">
              Non-purchasers only
              <br />
              <span className="text-gray-400">(retargeting cohort)</span>
            </span>
          </label>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {loading ? (
              "Loading…"
            ) : (
              <>
                <strong className="text-gray-700">
                  {totalCount.toLocaleString()}
                </strong>{" "}
                matches
                {nonPurchaserCount !== null && nonPurchaserCount !== totalCount ? (
                  <span className="text-gray-400 ml-2">
                    · {nonPurchaserCount.toLocaleString()} are non-purchasers
                  </span>
                ) : null}
              </>
            )}
          </p>
          <div className="flex gap-2">
            {(filters.source ||
              filters.status !== "active" ||
              filters.from ||
              filters.to ||
              filters.nonPurchaser) && (
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-full border border-gray-200"
              >
                Reset
              </button>
            )}
            <a
              href={csvHref}
              className="text-xs bg-brand-green text-cream px-3 py-1.5 rounded-full font-semibold hover:bg-brand-green/90 inline-flex items-center gap-1.5"
            >
              ⬇ Export filtered CSV
            </a>
          </div>
        </div>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Quick search the loaded rows…"
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
                <th className="px-4 py-3 text-left">Purchased</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    No matches
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.email}>
                    <td className="px-4 py-3 text-gray-800">
                      {s.email}
                      {s.name ? (
                        <span className="text-gray-400 ml-2">({s.name})</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.source}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(s.subscribedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {s.unsubscribedAt ? (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          unsubscribed
                        </span>
                      ) : (
                        <span className="text-xs bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full">
                          active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.hasPurchased ? (
                        <span className="text-xs bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded-full">
                          ✓ buyer
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
