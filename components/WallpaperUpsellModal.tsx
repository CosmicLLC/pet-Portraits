"use client";

import { useCallback, useEffect, useState } from "react";

// Wallpaper → canvas upsell modal. Fires 4s after the wallpaper
// success state renders, showing the buyer's portrait inside a
// CSS-rendered canvas frame, with a 24h real-server countdown to
// $10 off the canvas upgrade.
//
// All discount-window logic is server-side (see
// /api/create-upsell-checkout). The countdown shown here is a UX
// progress indicator — if the user clicks past expiry, the API
// returns 410 and we surface it.

interface Props {
  /** Stripe checkout session ID of the original wallpaper purchase.
   * Used as the server-side proof of eligibility. */
  originalSessionId: string;
  /** The watermarked wallpaper preview the buyer just saw on the
   * studio. Embedded as the canvas-mockup image. May be a data: URL. */
  portraitDataUrl: string | null;
  /** When the discount window closes (24h after the wallpaper
   * purchase). ISO timestamp from the same Stripe.session.created
   * the server validates against — keeps client + server in sync. */
  expiresAt: string;
}

export default function WallpaperUpsellModal({
  originalSessionId,
  portraitDataUrl,
  expiresAt,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Open the modal 4s after mount — long enough for the success
  // confirmation to register, short enough that it still feels like a
  // beat in the same experience rather than a separate interruption.
  useEffect(() => {
    const t = setTimeout(() => setIsOpen(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // Live countdown. Server-validated; this is just UX.
  useEffect(() => {
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setTimeLeft("expired");
        setExpired(true);
        return;
      }
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      setTimeLeft(
        `${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const handleUpgrade = useCallback(async () => {
    if (expired) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create-upsell-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalSessionId,
          upsellSource: "wallpaper_success_modal",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not start canvas upgrade");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start canvas upgrade — please try again."
      );
      setLoading(false);
    }
  }, [originalSessionId, expired]);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setIsDismissed(true);
  }, []);

  const handleReopen = useCallback(() => {
    setIsOpen(true);
    setIsDismissed(false);
  }, []);

  // After dismissal: persistent floating pill so a reflex-dismiss
  // buyer can still come back to the offer. Hidden once truly expired.
  if (isDismissed && !expired) {
    return (
      <button
        onClick={handleReopen}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-brand-green px-5 py-3 text-cream shadow-xl hover:scale-105 transition-transform font-display font-semibold text-sm"
      >
        Get the canvas — $69 · {timeLeft}
      </button>
    );
  }

  if (!isOpen || expired) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up"
      onClick={handleDismiss}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative max-w-md w-full rounded-3xl bg-cream p-6 sm:p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDismiss}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* CSS-rendered canvas frame mockup. Real Sharp composite is a
            phase-2 upgrade — for now, an inline wood-grain frame with
            the buyer's portrait inside reads as a canvas at the modal's
            display size. */}
        <div className="mb-5 flex justify-center">
          <div
            className="relative"
            style={{
              width: 220,
              padding: 14,
              background:
                "linear-gradient(135deg, #1f1410 0%, #2a1d15 40%, #1a100c 100%)",
              borderRadius: 6,
              boxShadow:
                "0 22px 50px -18px rgba(0,0,0,0.5), 0 8px 20px -8px rgba(0,0,0,0.3)",
            }}
          >
            <div
              className="bg-white overflow-hidden"
              style={{
                aspectRatio: "2 / 3",
                boxShadow: "inset 0 0 14px rgba(0,0,0,0.18)",
              }}
            >
              {portraitDataUrl ? (
                // Buyer's actual portrait — same image they just saw on
                // the wallpaper success state.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={portraitDataUrl}
                  alt="Your pet on canvas"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-cream flex items-center justify-center text-3xl">
                  🐾
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl text-brand-green text-center mb-2 leading-tight">
          Want this on your wall too?
        </h2>
        <p className="text-sm text-gray-700 text-center mb-4 leading-relaxed">
          Your portrait, printed on an 8×12 framed canvas. Wallpaper buyers
          save $10 — today only.
        </p>

        <div className="flex items-baseline justify-center gap-3 mb-3">
          <span className="font-display text-3xl font-bold text-brand-green">
            $69
          </span>
          <span className="text-lg text-gray-400 line-through">$79</span>
          <span className="text-xs text-brand-gold font-semibold">
            + free shipping
          </span>
        </div>

        <div className="rounded-xl bg-brand-green/5 px-3 py-2 mb-4 text-center text-xs text-brand-green">
          Offer ends in{" "}
          <span className="font-mono font-bold tabular-nums">{timeLeft}</span>
        </div>

        {error && (
          <p className="text-red-500 text-xs text-center mb-3">{error}</p>
        )}

        <button
          onClick={handleUpgrade}
          disabled={loading || expired}
          className="w-full bg-brand-green text-cream py-3.5 rounded-full font-display font-semibold text-sm hover:bg-brand-green/90 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading
            ? "Loading checkout…"
            : `Upgrade to canvas — $69`}
        </button>

        <button
          onClick={handleDismiss}
          className="mt-3 w-full text-center text-xs text-gray-500 hover:text-brand-green transition-colors"
        >
          No thanks, just the wallpaper
        </button>

        <p className="text-[10px] text-gray-400 text-center mt-4 leading-snug">
          Real wood frame · ships 5–7 days in the US · 100% money-back guarantee
        </p>
      </div>
    </div>
  );
}
