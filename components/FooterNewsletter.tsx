"use client";

import { useState } from "react";

export default function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-gray-100 bg-brand-green/5 py-10 px-4">
      <div className="max-w-lg mx-auto text-center">
        {submitted ? (
          <>
            <p className="text-2xl mb-2">🐾</p>
            <p className="font-display text-lg text-brand-green">You&apos;re subscribed!</p>
            <p className="text-sm text-gray-500 mt-1">
              Portrait inspiration is headed to your inbox.
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-xl text-brand-green mb-1">Love Paw Masterpiece?</p>
            <p className="text-sm text-gray-500 mb-5">
              Get style tips, new art styles, and exclusive discounts for pet lovers.
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
                className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-brand-green text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-green/90 transition-all disabled:opacity-60 whitespace-nowrap"
              >
                {submitting ? "…" : "Subscribe"}
              </button>
            </form>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
