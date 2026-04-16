"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "pp_popup_dismissed";
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function EmailPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - parseInt(dismissed, 10) < DISMISS_TTL) return;

    const isMobile = window.innerWidth < 768;
    let triggered = false;

    const show = () => {
      if (!triggered) {
        triggered = true;
        setVisible(true);
      }
    };

    if (isMobile) {
      const timer = setTimeout(show, 30_000);
      return () => clearTimeout(timer);
    } else {
      const onLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) show();
      };
      document.addEventListener("mouseleave", onLeave);
      return () => document.removeEventListener("mouseleave", onLeave);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
      setTimeout(dismiss, 2500);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal */}
      <div className="relative bg-cream rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fade-in-up">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!submitted ? (
          <>
            <div className="text-4xl text-center mb-4">🐾</div>
            <h2 className="font-display text-2xl sm:text-3xl text-brand-green text-center mb-2">
              Get 15% Off Your First Portrait
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6 leading-relaxed">
              Join thousands of pet parents. Your discount code arrives instantly.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-green text-white font-semibold py-3.5 rounded-xl hover:bg-brand-green/90 transition-all hover:shadow-md disabled:opacity-70 text-sm"
              >
                {loading ? "Sending…" : "Claim My 15% Discount"}
              </button>
            </form>

            <button
              onClick={dismiss}
              className="w-full text-center text-xs text-gray-400 mt-3 hover:text-gray-600 transition-colors"
            >
              No thanks, I&apos;ll pay full price
            </button>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="font-display text-2xl text-brand-green mb-2">Check your inbox!</h3>
            <p className="text-gray-500 text-sm">Your 15% discount code is on its way.</p>
          </div>
        )}
      </div>
    </div>
  );
}
