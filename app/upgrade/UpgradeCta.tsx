"use client";

import { useCallback, useEffect, useState } from "react";
import { UPSELL_PRICE_USD, type UpsellSource } from "@/lib/upsell";
import { track } from "@/lib/analytics";

// Client half of /upgrade: live countdown + the checkout hand-off. The
// server component already validated the session and window; the API
// re-validates on click (410 → flip to the expired state inline).

interface Props {
  originalSessionId: string;
  source: UpsellSource;
  /** ISO timestamp — when this touch's discount window closes. */
  expiresAt: string;
}

export default function UpgradeCta({ originalSessionId, source, expiresAt }: Props) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One offer-view event per landing (email click-through).
  useEffect(() => {
    track({ name: "upsell_offer_view", source });
  }, [source]);

  useEffect(() => {
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setExpired(true);
        setTimeLeft("expired");
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
    track({
      name: "begin_checkout",
      productType: "canvas",
      value: UPSELL_PRICE_USD,
    });
    try {
      const res = await fetch("/api/create-upsell-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalSessionId, upsellSource: source }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 410) {
        setExpired(true);
        throw new Error("This discount window just closed.");
      }
      if (!res.ok) {
        throw new Error(data.error || "Could not start the upgrade");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start the upgrade — please try again."
      );
      setLoading(false);
    }
  }, [originalSessionId, source, expired]);

  if (expired) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-4">
          This discount window has closed — but you can still order the
          framed print at full price any time.
        </p>
        <a
          href="/start"
          className="inline-block bg-brand-green text-cream px-8 py-3.5 rounded-full font-display font-semibold text-sm hover:bg-brand-green/90 transition-colors"
        >
          Create a framed print
        </a>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="rounded-xl bg-brand-green/5 px-3 py-2 mb-4 text-center text-xs text-brand-green">
        Offer ends in{" "}
        <span className="font-mono font-bold tabular-nums">{timeLeft}</span>
      </div>

      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full bg-brand-green text-cream py-3.5 rounded-full font-display font-semibold text-sm hover:bg-brand-green/90 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading
          ? "Loading checkout…"
          : `Upgrade to framed print — $${UPSELL_PRICE_USD}`}
      </button>

      <p className="text-[10px] text-gray-400 mt-4 leading-snug">
        Real wood frame · ships 5–7 days in the US · 100% money-back guarantee
      </p>
    </div>
  );
}
