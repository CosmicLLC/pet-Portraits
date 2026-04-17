"use client"

import { signIn } from "next-auth/react"
import { useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"

function SignInForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const error = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const errorMessages: Record<string, string> = {
    OAuthSignin: "Could not start sign-in. Please try again.",
    OAuthCallback: "Sign-in was cancelled or failed. Please try again.",
    OAuthCreateAccount: "Could not create account. Please try again.",
    EmailCreateAccount: "Could not create account. Please try again.",
    Callback: "Sign-in failed. Please try again.",
    default: "Something went wrong. Please try again.",
  }

  const handleGoogleSignIn = useCallback(async () => {
    setGoogleLoading(true)
    await signIn("google", { callbackUrl })
  }, [callbackUrl])

  const handleEmailSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!email.trim()) return
      setEmailLoading(true)
      try {
        const result = await signIn("resend", {
          email: email.trim(),
          callbackUrl,
          redirect: false,
        })
        if (result?.ok) {
          setEmailSent(true)
        }
      } finally {
        setEmailLoading(false)
      }
    },
    [email, callbackUrl]
  )

  if (emailSent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-brand-green/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="font-display text-2xl text-brand-green mb-3">Check your email</h2>
        <p className="text-gray-500 text-sm mb-2">
          We sent a magic link to <strong className="text-gray-700">{email}</strong>
        </p>
        <p className="text-gray-400 text-xs mb-8">Click the link in the email to sign in. It expires in 10 minutes.</p>
        <button
          onClick={() => setEmailSent(false)}
          className="text-sm text-brand-green hover:underline"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex flex-col items-center gap-2">
          <Image src="/logo.jpg" alt="Paw Masterpiece" width={56} height={56} />
          <span className="font-display text-3xl text-brand-green tracking-tight">Paw Masterpiece</span>
        </Link>
        <h1 className="font-display text-2xl text-gray-800 mt-4 mb-1">Sign In</h1>
        <p className="text-gray-500 text-sm">Create an account or sign in to access your portraits</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">
          {errorMessages[error] ?? errorMessages.default}
        </div>
      )}

      {/* Google sign-in */}
      <button
        onClick={handleGoogleSignIn}
        disabled={googleLoading || emailLoading}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-60 shadow-sm mb-4"
      >
        {googleLoading ? (
          <svg className="animate-spin w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-cream px-3 text-xs text-gray-400 uppercase tracking-wider">or</span>
        </div>
      </div>

      {/* Email magic link */}
      <form onSubmit={handleEmailSignIn} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-gray-600 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={emailLoading || googleLoading}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all bg-white placeholder-gray-300 disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={emailLoading || googleLoading || !email.trim()}
          className="w-full bg-brand-green text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-brand-green/90 transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {emailLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending link…
            </span>
          ) : (
            "Send magic link"
          )}
        </button>
      </form>

      {/* Fine print */}
      <p className="text-center text-xs text-gray-400 mt-6">
        By signing in, you agree to our{" "}
        <Link href="/terms" className="text-brand-green hover:underline">Terms</Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-brand-green hover:underline">Privacy Policy</Link>.
      </p>
    </>
  )
}

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-8 py-10">
          <Suspense fallback={<div className="text-center text-gray-400 text-sm">Loading…</div>}>
            <SignInForm />
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
