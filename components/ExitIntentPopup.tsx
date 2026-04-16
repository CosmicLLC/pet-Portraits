"use client";

import { useState, useEffect, useCallback } from "react";

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("exit-popup-dismissed")) return;

    const handler = (e: MouseEvent) => {
      if (e.clientY <= 5) {
        setVisible(true);
        document.removeEventListener("mouseleave", handler);
      }
    };

    // Wait 3s before listening so it doesn't fire on page load jitter
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handler);
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handler);
    };
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem("exit-popup-dismissed", "1");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "exit-intent" }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
      sessionStorage.setItem("exit-popup-dismissed", "1");
      setTimeout(dismiss, 2500);
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative bg-cream rounded-3xl max-w-md w-full p-8 shadow-2xl animate-fade-in-up">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {submitted ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-green flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-display text-2xl text-brand-green mb-2">You&apos;re in!</h3>
            <p className="text-gray-500 text-sm">Watch for your exclusive discount code.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <p className="text-4xl mb-3">🐾</p>
              <h3 className="font-display text-2xl text-brand-green mb-2">
                Wait — before you go!
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Get <strong>10% off</strong> your first portrait plus exclusive deals
                for pet lovers — delivered to your inbox.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-green text-white py-3 rounded-xl font-display font-semibold text-sm hover:bg-brand-green/90 transition-all disabled:opacity-60"
              >
                {submitting ? "Saving…" : "Claim My 10% Discount"}
              </button>
            </form>
            <button
              onClick={dismiss}
              className="w-full text-center text-xs text-gray-400 mt-3 hover:text-gray-500 transition-colors"
            >
              No thanks, I&apos;ll pay full price
            </button>
          </>
        )}
      </div>
    </div>
  );
}
