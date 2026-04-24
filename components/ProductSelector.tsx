"use client";

import { useState } from "react";
import { track, productValue } from "@/lib/analytics";
import type { ProductType } from "@/lib/products";

interface ProductSelectorProps {
  imageId: string;
  onError: (msg: string) => void;
  wallpaperSelected?: boolean;
}

type Tier = {
  key: string;
  name: string;
  price: string;
  originalPrice?: string;
  description: string;
  features: string[];
  badge?: string;
  highlighted: boolean;
};

const TIERS: Tier[] = [
  {
    key: "digital",
    name: "Digital Download",
    price: "$19",
    description: "Instant email delivery",
    features: ["Full-resolution PNG", "Print-ready file", "Lifetime access"],
    highlighted: false,
  },
  {
    key: "display",
    name: "Display Print 11×14",
    price: "$15.99",
    description: "Bagged ready to frame",
    features: ["Fine art paper", "Rigid backing board", "Protective sleeve"],
    highlighted: false,
  },
  {
    key: "mounted",
    name: "Mounted Print 11×14",
    price: "$33",
    description: "Gallery-matted & ready to frame",
    features: ["Window mount + backing", "Fine art paper", "Gallery finish"],
    highlighted: false,
  },
  {
    key: "canvas",
    name: "Framed Canvas 8×12",
    price: "$79",
    description: "Ready to hang",
    features: ["Gallery-quality canvas", "Premium frame", "Ships in 3–5 days"],
    badge: "Most Popular",
    highlighted: false,
  },
  {
    key: "bundle",
    name: "Complete Bundle",
    price: "$89",
    originalPrice: "$98",
    description: "Digital + Framed Canvas",
    features: ["Full-res digital", "8×12 framed canvas", "Save $9"],
    badge: "Best Value",
    highlighted: true,
  },
];

// Session-consistent portrait count for social proof
function getSessionPortraitCount(): number {
  try {
    const stored = sessionStorage.getItem("petPortraitCount");
    if (stored) return parseInt(stored, 10);
    const count = Math.floor(Math.random() * 51) + 30;
    sessionStorage.setItem("petPortraitCount", count.toString());
    return count;
  } catch {
    return 47;
  }
}

export default function ProductSelector({ imageId, onError, wallpaperSelected }: ProductSelectorProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [portraitCount] = useState<number>(() => getSessionPortraitCount());

  const handleSelect = async (key: string) => {
    setLoading(key);
    const productType = key as ProductType;
    const value = productValue(productType) + (wallpaperSelected ? 1.99 : 0);
    track({ name: "begin_checkout", productType, value, imageId });
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType: key, imageId, addWallpaper: !!wallpaperSelected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch {
      onError("Payment error — please try again.");
      setLoading(null);
    }
  };

  return (
    <div className="w-full mt-10">
      {/* Social proof */}
      <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-500">
        <span>🔥</span>
        <span>
          <strong className="text-brand-green">{portraitCount}</strong> portraits purchased today
        </span>
      </div>

      {/* 5-tier ladder — stacks on mobile, 2-up on tablet, row on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {TIERS.map((tier) => (
          <div
            key={tier.key}
            className={`relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all ${
              tier.highlighted
                ? "border-brand-green shadow-xl ring-4 ring-brand-green/10 scale-[1.02]"
                : "border-gray-200"
            }`}
          >
            {/* Tier badge */}
            {tier.badge && (
              <div className={`text-center py-1.5 text-xs font-bold uppercase tracking-widest ${
                tier.highlighted
                  ? "bg-brand-green text-white"
                  : "bg-brand-green/10 text-brand-green"
              }`}>
                {tier.badge}
              </div>
            )}

            <div className={`flex flex-col flex-1 p-5 ${tier.highlighted ? "bg-white" : "bg-white"}`}>
              <p className="font-display text-base font-semibold text-brand-green mb-1">
                {tier.name}
              </p>
              <p className="text-xs text-gray-400 mb-4">{tier.description}</p>

              <div className="mb-5">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-display text-3xl font-bold text-brand-green">{tier.price}</span>
                  {tier.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">{tier.originalPrice}</span>
                  )}
                  {wallpaperSelected && (
                    <span className="text-xs font-semibold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full">
                      +$1.99 wallpaper
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-1.5 mb-6 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <svg className="w-3.5 h-3.5 text-brand-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(tier.key)}
                disabled={loading !== null}
                className={`w-full py-3 rounded-xl font-display font-semibold text-sm transition-all ${
                  tier.highlighted
                    ? "bg-brand-green text-white hover:bg-brand-green/90 hover:shadow-lg disabled:opacity-60"
                    : "bg-gray-100 text-brand-green hover:bg-brand-green hover:text-white disabled:opacity-60"
                }`}
              >
                {loading === tier.key ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing…
                  </span>
                ) : (
                  "Get This"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 pt-5 border-t border-gray-100">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg className="w-4 h-4 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure Checkout
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg className="w-4 h-4 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Money-Back Guarantee
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          5-Star Rated
        </span>
      </div>
    </div>
  );
}
