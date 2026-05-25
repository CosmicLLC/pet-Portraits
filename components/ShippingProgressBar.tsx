"use client";

// Free-shipping progress bar. Inert until FREE_SHIPPING_THRESHOLD_USD is set
// — the user can flip the feature on by setting the env var without touching
// code. Crown & Paw's documented case study attributes +7% orders / +10%
// revenue to a dynamic shipping bar of this exact shape.
//
// Inert behavior: if threshold is 0 or unset, returns null. No layout shift.
//
// Threshold logic: subtotalCents is the relevant line items only — not
// taxes, not shipping, not credits/discounts. Cap progress visually at 100%
// but keep the "you qualify" copy after.

import { useEffect, useState } from "react";

interface Props {
  subtotalCents: number;
  /** Threshold override in cents. If unset, reads NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_USD. */
  thresholdCents?: number;
  /** Visual variant — "thin" for sticky bars, "full" for landing-page promos. */
  variant?: "thin" | "full";
}

function envThresholdCents(): number {
  const raw = process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_USD;
  if (!raw) return 0;
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

export default function ShippingProgressBar({
  subtotalCents,
  thresholdCents,
  variant = "thin",
}: Props) {
  const [threshold, setThreshold] = useState(thresholdCents ?? 0);

  useEffect(() => {
    if (thresholdCents === undefined) setThreshold(envThresholdCents());
  }, [thresholdCents]);

  if (!threshold) return null;

  const qualified = subtotalCents >= threshold;
  const remainingCents = Math.max(0, threshold - subtotalCents);
  const pct = qualified ? 100 : Math.min(100, Math.round((subtotalCents / threshold) * 100));
  const remainingDisplay = (remainingCents / 100).toFixed(2);

  if (variant === "full") {
    return (
      <div className="bg-cream border border-brand-gold/30 rounded-2xl p-4 sm:p-5">
        <p className="text-sm text-gray-700 mb-3 font-medium">
          {qualified
            ? "🎉 You qualify for free shipping"
            : `Add $${remainingDisplay} more to your order for free shipping`}
        </p>
        <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-100">
          <div
            className="h-full bg-brand-green transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-1.5 text-center text-xs sm:text-sm bg-brand-gold/8 border-b border-brand-gold/20">
      <span className="text-gray-700">
        {qualified
          ? "✓ Free shipping unlocked on this order"
          : (
            <>
              <span className="font-semibold">${remainingDisplay}</span> more for{" "}
              <span className="font-semibold">free shipping</span>
            </>
          )}
      </span>
      <div className="max-w-xs mx-auto mt-1 h-1 bg-white/80 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-green transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
