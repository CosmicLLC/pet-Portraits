"use client"

import { useState } from "react"

interface Props {
  initialName: string
  email: string
  hasPassword: boolean
  isSubscribed: boolean
}

export default function ProfileForm({ initialName, email, hasPassword, isSubscribed }: Props) {
  const [name, setName] = useState(initialName)
  const [subscribed, setSubscribed] = useState(isSubscribed)
  const [savingName, setSavingName] = useState(false)
  const [savingSub, setSavingSub] = useState(false)
  const [nameStatus, setNameStatus] = useState<string | null>(null)
  const [subStatus, setSubStatus] = useState<string | null>(null)

  const onSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingName(true)
    setNameStatus(null)
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      setNameStatus(res.ok ? "Saved" : "Couldn't save — try again")
    } catch {
      setNameStatus("Couldn't save — try again")
    } finally {
      setSavingName(false)
      setTimeout(() => setNameStatus(null), 2500)
    }
  }

  const onToggleSub = async () => {
    setSavingSub(true)
    setSubStatus(null)
    const next = !subscribed
    try {
      const res = await fetch("/api/account/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscribed: next }),
      })
      if (res.ok) {
        setSubscribed(next)
        setSubStatus(next ? "Subscribed" : "Unsubscribed")
      } else {
        setSubStatus("Couldn't update — try again")
      }
    } catch {
      setSubStatus("Couldn't update — try again")
    } finally {
      setSavingSub(false)
      setTimeout(() => setSubStatus(null), 2500)
    }
  }

  return (
    <>
      {/* Name */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-display text-lg font-semibold text-brand-green mb-4">Your name</h2>
        <form onSubmit={onSaveName} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="name" className="block text-xs text-gray-500 mb-1.5">
              Display name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={80}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
            />
          </div>
          <button
            type="submit"
            disabled={savingName || name === initialName}
            className="bg-brand-green text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-green/90 disabled:opacity-50"
          >
            {savingName ? "Saving…" : "Save"}
          </button>
          {nameStatus && (
            <span className="text-sm text-gray-500">{nameStatus}</span>
          )}
        </form>
      </section>

      {/* Email preferences */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-display text-lg font-semibold text-brand-green mb-1">Email preferences</h2>
        <p className="text-sm text-gray-500 mb-4">
          Order confirmations, shipping updates, and download links will always be sent to <strong>{email}</strong>. Marketing emails are optional.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSub}
            disabled={savingSub}
            role="switch"
            aria-checked={subscribed}
            className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
              subscribed ? "bg-brand-green" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                subscribed ? "translate-x-5" : ""
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">
            {subscribed ? "Subscribed to marketing updates" : "Not subscribed to marketing emails"}
          </span>
          {subStatus && <span className="text-sm text-gray-500">{subStatus}</span>}
        </div>
      </section>

      {/* Password — only shown for password-auth users */}
      {hasPassword && (
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-display text-lg font-semibold text-brand-green mb-1">Password</h2>
          <p className="text-sm text-gray-500 mb-4">
            Change your password using the reset flow — we'll email you a secure link.
          </p>
          <a
            href="/auth/forgot-password"
            className="inline-block text-sm text-brand-green hover:underline font-medium"
          >
            Send a password reset link →
          </a>
        </section>
      )}
    </>
  )
}
