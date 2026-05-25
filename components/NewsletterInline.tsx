"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

// Reusable inline newsletter signup designed to be slotted into any page.
// Source distinguishes capture surface for segmentation in /admin/subscribers
// and Meta/TikTok Custom Audience uploads (e.g., "subscribed via blog but
// never purchased" → retargeting cohort). Add the source value to
// ALLOWED_SOURCES in app/api/subscribe/route.ts before using a new one.

interface Props {
  /** Source tag for segmentation. Must match an ALLOWED_SOURCES value. */
  source: string;
  /** Custom headline. Defaults to a gentle generic. */
  headline?: string;
  /** Sub-headline / value-prop line. */
  copy?: string;
  /** "card" — bordered card with cream background. "bare" — no chrome, just form. */
  variant?: "card" | "bare";
  /** Visual size — "compact" for tight slots, "full" for hero-adjacent. */
  size?: "compact" | "full";
}

export default function NewsletterInline({
  source,
  headline = "Get one piece of pet art advice a week.",
  copy = "Style drops, framing tips, and the occasional discount. No spam — unsubscribe in one click.",
  variant = "card",
  size = "full",
}: Props) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
      track({ name: "sign_up", source });
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const containerClass =
    variant === "card"
      ? "bg-cream border border-brand-green/15 rounded-2xl"
      : "";
  const paddingClass = size === "compact" ? "p-4 sm:p-5" : "p-6 sm:p-8";

  return (
    <div className={`${containerClass} ${variant === "card" ? paddingClass : ""}`}>
      {submitted ? (
        <div className="text-center">
          <p className="text-2xl mb-2">🐾</p>
          <p className="font-display text-lg text-brand-green font-semibold">
            You&apos;re in.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Watch your inbox — the first email lands today.
          </p>
        </div>
      ) : (
        <>
          {size === "full" ? (
            <p className="font-display text-xl sm:text-2xl text-brand-green leading-snug mb-1.5">
              {headline}
            </p>
          ) : (
            <p className="font-display text-lg text-brand-green leading-snug mb-1">
              {headline}
            </p>
          )}
          {copy ? (
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{copy}</p>
          ) : null}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              aria-label="Email address"
              className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-green text-cream px-5 py-2.5 rounded-full text-sm font-display font-semibold hover:bg-brand-green/90 transition-all disabled:opacity-60 whitespace-nowrap"
            >
              {submitting ? "…" : "Subscribe"}
            </button>
          </form>
          {error ? <p className="text-red-500 text-xs mt-2">{error}</p> : null}
          <p className="text-[11px] text-gray-400 mt-2.5">
            One-click unsubscribe in every email. We never sell or share your address.
          </p>
        </>
      )}
    </div>
  );
}
