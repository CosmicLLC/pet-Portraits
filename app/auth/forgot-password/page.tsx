"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      // Always show "sent" — the API deliberately doesn't leak whether the
      // email exists, so the UI must match.
      setSent(true)
    } finally {
      setLoading(false)
    }
  }, [email])

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-8 py-10">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-brand-green/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-display text-2xl text-brand-green mb-3">Check your email</h2>
              <p className="text-gray-500 text-sm mb-2">
                If an account exists for <strong className="text-gray-700">{email}</strong>, we just sent a password reset link.
              </p>
              <p className="text-gray-400 text-xs mb-8">Link expires in 1 hour. Didn&apos;t get it? Check spam or try again.</p>
              <Link href="/auth/signin" className="text-sm text-brand-green hover:underline">Back to sign in</Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <Link href="/" className="inline-flex flex-col items-center gap-2">
                  <Image src="/logo.jpg" alt="Paw Masterpiece" width={56} height={56} />
                  <span className="font-display text-3xl text-brand-green tracking-tight">Paw Masterpiece</span>
                </Link>
                <h1 className="font-display text-2xl text-gray-800 mt-4 mb-1">Reset your password</h1>
                <p className="text-gray-500 text-sm">Enter your email and we&apos;ll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
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
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-brand-green text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-brand-green/90 transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Remembered it?{" "}
                <Link href="/auth/signin" className="text-brand-green hover:underline font-medium">Sign in</Link>
              </p>
            </>
          )}
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
