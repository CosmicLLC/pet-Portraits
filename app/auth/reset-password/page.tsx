"use client"

import { useState, useCallback, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"

function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get("email") || ""
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!password) return
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Couldn't reset your password.")
        return
      }
      setDone(true)
      setTimeout(() => router.push("/auth/signin?reset=1"), 1500)
    } finally {
      setLoading(false)
    }
  }, [password, confirm, email, token, router])

  if (!email || !token) {
    return (
      <div className="text-center">
        <h2 className="font-display text-2xl text-brand-green mb-3">Invalid reset link</h2>
        <p className="text-gray-500 text-sm mb-8">
          This link is missing information. Please request a new reset link.
        </p>
        <Link href="/auth/forgot-password" className="text-sm text-brand-green hover:underline">
          Request a new link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-brand-green/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display text-2xl text-brand-green mb-3">Password updated</h2>
        <p className="text-gray-500 text-sm mb-8">Redirecting you to sign in…</p>
      </div>
    )
  }

  return (
    <>
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex flex-col items-center gap-2">
          <Image src="/logo.jpg" alt="Paw Masterpiece" width={56} height={56} />
          <span className="font-display text-3xl text-brand-green tracking-tight">Paw Masterpiece</span>
        </Link>
        <h1 className="font-display text-2xl text-gray-800 mt-4 mb-1">Choose a new password</h1>
        <p className="text-gray-500 text-sm">for <strong className="text-gray-700">{email}</strong></p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="password" className="block text-xs font-medium text-gray-600 mb-1.5">New password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all bg-white placeholder-gray-300 disabled:opacity-60"
          />
          <p className="text-xs text-gray-400 mt-1.5">Min. 8 characters · must include a letter and a number</p>
        </div>
        <div>
          <label htmlFor="confirm" className="block text-xs font-medium text-gray-600 mb-1.5">Confirm password</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all bg-white placeholder-gray-300 disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !password || !confirm}
          className="w-full bg-brand-green text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-brand-green/90 transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-8 py-10">
          <Suspense fallback={<div className="text-center text-gray-400 text-sm">Loading…</div>}>
            <ResetForm />
          </Suspense>
        </div>
        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-gray-400 hover:text-brand-green transition-colors">
            ← Back to Paw Masterpiece
          </Link>
        </div>
      </div>
    </main>
  )
}
