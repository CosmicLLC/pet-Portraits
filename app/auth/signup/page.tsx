"use client"

import { useState, useCallback, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"

function SignUpForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      if (!email.trim() || !password) return
      setLoading(true)
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email: email.trim(), password }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(data.error || "Couldn't create your account. Please try again.")
          return
        }
        setSent(true)
      } finally {
        setLoading(false)
      }
    },
    [name, email, password]
  )

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-brand-green/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="font-display text-2xl text-brand-green mb-3">Confirm your email</h2>
        <p className="text-gray-500 text-sm mb-2">
          We sent a confirmation link to <strong className="text-gray-700">{email}</strong>
        </p>
        <p className="text-gray-400 text-xs mb-8">Click the link in the email to activate your account. Link expires in 24 hours.</p>
        <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-sm text-brand-green hover:underline">
          Back to sign in
        </Link>
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
        <h1 className="font-display text-2xl text-gray-800 mt-4 mb-1">Create your account</h1>
        <p className="text-gray-500 text-sm">Free to start. Portraits take 30 seconds.</p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-xs font-medium text-gray-600 mb-1.5">Name <span className="text-gray-300">(optional)</span></label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all bg-white placeholder-gray-300 disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all bg-white placeholder-gray-300 disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
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
        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className="w-full bg-brand-green text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-brand-green/90 transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating account…
            </span>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-brand-green hover:underline font-medium">
          Sign in
        </Link>
      </p>
      <p className="text-center text-xs text-gray-400 mt-6">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="text-brand-green hover:underline">Terms</Link>{" "}and{" "}
        <Link href="/privacy" className="text-brand-green hover:underline">Privacy Policy</Link>.
      </p>
    </>
  )
}

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-8 py-10">
          <Suspense fallback={<div className="text-center text-gray-400 text-sm">Loading…</div>}>
            <SignUpForm />
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
