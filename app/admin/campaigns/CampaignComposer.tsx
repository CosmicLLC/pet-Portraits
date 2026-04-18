"use client"

import { useState, useCallback } from "react"

type Props = { activeSubscribers: number }

export default function CampaignComposer({ activeSubscribers }: Props) {
  const [subject, setSubject] = useState("")
  const [htmlBody, setHtmlBody] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ delivered: number; failed: number; recipients: number } | null>(null)
  const [confirming, setConfirming] = useState(false)

  const handleSend = useCallback(async () => {
    setError(null)
    setResult(null)
    setSending(true)
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, htmlBody }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Send failed")
        return
      }
      setResult({ delivered: data.delivered, failed: data.failed, recipients: data.recipients })
      setSubject("")
      setHtmlBody("")
      // Hard refresh the recent-campaigns list
      setTimeout(() => window.location.reload(), 1500)
    } catch {
      setError("Send failed")
    } finally {
      setSending(false)
      setConfirming(false)
    }
  }, [subject, htmlBody])

  const canSend = subject.trim().length > 0 && htmlBody.trim().length > 0 && activeSubscribers > 0

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-display text-xl text-brand-green mb-1">Compose a new campaign</h2>
      <p className="text-xs text-gray-400 mb-5">
        Brand header + legal footer (physical address + unsubscribe link) are added automatically.
      </p>

      {result && (
        <div className="mb-5 p-3 rounded-xl bg-brand-green/5 border border-brand-green/20 text-brand-green text-sm">
          Delivered to {result.delivered} of {result.recipients}
          {result.failed > 0 && ` — ${result.failed} failed`}.
        </div>
      )}
      {error && (
        <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label htmlFor="subject" className="block text-xs font-medium text-gray-600 mb-1.5">
            Subject line
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="New styles just dropped 🎨"
            maxLength={200}
            disabled={sending}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all bg-white placeholder-gray-300 disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor="html" className="block text-xs font-medium text-gray-600 mb-1.5">
            Email body (HTML)
          </label>
          <textarea
            id="html"
            value={htmlBody}
            onChange={(e) => setHtmlBody(e.target.value)}
            placeholder={`<h2 style="color:#2D4A3E;">Hello!</h2>\n<p>Your next portrait is $10 off through Sunday.</p>\n<p><a href="https://pawmasterpiece.com">Try a new style →</a></p>`}
            rows={12}
            disabled={sending}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all bg-white placeholder-gray-300 disabled:opacity-60"
          />
        </div>

        {confirming ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-900 mb-3">
              Send to <strong>{activeSubscribers}</strong> subscriber{activeSubscribers === 1 ? "" : "s"}? This is not reversible.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 bg-brand-green text-white py-3 rounded-xl text-sm font-semibold hover:bg-brand-green/90 transition-all disabled:opacity-60"
              >
                {sending ? "Sending…" : `Send to ${activeSubscribers}`}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={sending}
                className="px-4 py-3 rounded-xl text-sm text-gray-500 hover:text-gray-700 border border-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            disabled={!canSend || sending}
            className="w-full bg-brand-green text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-brand-green/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Review and send
          </button>
        )}
      </div>
    </div>
  )
}
