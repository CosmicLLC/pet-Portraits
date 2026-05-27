"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";

// Post-generation email capture modal. Fires once per session as soon
// as the user successfully generates ANY image (portrait, multi-pet,
// or wallpaper). Compliance-friendly: explicit UNCHECKED consent
// checkbox (GDPR-style), clear unsubscribe promise + link to privacy
// policy, and an easy "no thanks" dismiss. Existing subscribers don't
// see it (localStorage flag set after any successful subscribe).
//
// Source value: "post_generation" — must be in the subscribe route's
// ALLOWED_SOURCES enum so campaigns can target this segment cleanly.
//
// Usage: render in each generation Studio. Pass `trigger` as true once
// the preview is rendered. Pass `imageType` so the headline + analytics
// pick the right wording.

const SESSION_SHOWN_KEY = "post_gen_email_shown";
const SUBSCRIBED_KEY = "pp_subscribed";

type ImageType = "portrait" | "multipet" | "wallpaper";

const COPY: Record<ImageType, { headline: string; sub: string }> = {
  portrait: {
    headline: "Save your portrait — and grab 10% off",
    sub: "Drop your email and we'll send you a copy of this preview plus a one-time 10% discount if you decide to print or download the full-res version.",
  },
  multipet: {
    headline: "Save your group portrait — and grab 10% off",
    sub: "We'll email this preview so you don't lose it, plus a one-time 10% discount on multi-pet orders.",
  },
  wallpaper: {
    headline: "Save your wallpaper — and grab 10% off",
    sub: "We'll email this preview to your inbox, plus a one-time 10% discount on the full HD download.",
  },
};

export default function PostGenerationEmailCapture({
  trigger,
  imageType,
}: {
  trigger: boolean;
  imageType: ImageType;
}) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Reveal the modal ~1.5s after generation lands so the user sees
  // their preview first (less obnoxious than instant interruption).
  // Suppressed if already shown this session or if user has previously
  // subscribed (anywhere on the site).
  useEffect(() => {
    if (!trigger) return;
    try {
      if (sessionStorage.getItem(SESSION_SHOWN_KEY) === "1") return;
      if (localStorage.getItem(SUBSCRIBED_KEY) === "1") return;
    } catch {
      /* private mode — fail open, still show */
    }
    const t = setTimeout(() => {
      setVisible(true);
      try {
        sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
      } catch {
        /* ignore */
      }
      track({ name: "sign_up", source: `post_generation_${imageType}_shown` });
    }, 1500);
    return () => clearTimeout(t);
  }, [trigger, imageType]);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) return;
      // CAN-SPAM is OK without the checkbox (the value exchange is
      // clear), but GDPR/CASL want explicit consent. We require the
      // checkbox before allowing submit.
      if (!consent) {
        setError("Please check the consent box to continue.");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            source: "post_generation",
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not subscribe — please try again.");
        }
        try {
          localStorage.setItem(SUBSCRIBED_KEY, "1");
        } catch {
          /* ignore */
        }
        track({ name: "sign_up", source: `post_generation_${imageType}` });
        setSubmitted(true);
        setTimeout(dismiss, 2500);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not subscribe — please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [email, consent, imageType, dismiss]
  );

  if (!visible) return null;

  const { headline, sub } = COPY[imageType];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      <div className="relative bg-cream rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fade-in-up">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {!submitted ? (
          <>
            <div className="text-4xl text-center mb-4">🐾</div>
            <h2 className="font-display text-2xl sm:text-3xl text-brand-green text-center mb-3 leading-tight">
              {headline}
            </h2>
            <p className="text-gray-600 text-sm text-center mb-5 leading-relaxed">
              {sub}
            </p>

            <form onSubmit={onSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-colors"
              />

              {/* Explicit consent — unchecked by default for GDPR / CASL
                  compliance. Required to enable submit. */}
              <label className="flex items-start gap-3 text-xs text-gray-600 leading-relaxed cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green flex-shrink-0"
                />
                <span>
                  I agree to receive marketing emails from Paw Masterpiece —
                  new styles, tips, and occasional offers. Unsubscribe in one
                  click anytime. See our{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="underline hover:text-brand-green"
                  >
                    privacy policy
                  </Link>
                  .
                </span>
              </label>

              {error && (
                <p className="text-red-500 text-xs leading-snug">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !consent}
                className="w-full bg-brand-green text-white font-semibold py-3.5 rounded-xl hover:bg-brand-green/90 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading
                  ? "Saving…"
                  : "Email me my preview + 10% off"}
              </button>
            </form>

            <button
              onClick={dismiss}
              className="w-full text-center text-xs text-gray-400 mt-3 hover:text-gray-600 transition-colors"
            >
              No thanks, I&apos;ll skip this
            </button>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="font-display text-2xl text-brand-green mb-2">
              Check your inbox!
            </h3>
            <p className="text-gray-500 text-sm">
              Your discount code is on its way.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
