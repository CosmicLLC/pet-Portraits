"use client";

import { useEffect, useState } from "react";
import { track, productValue } from "@/lib/analytics";
import { isPhysicalProduct, type ProductType } from "@/lib/products";

interface ProductSelectorProps {
  imageId: string;
  onError: (msg: string) => void;
  wallpaperSelected?: boolean;
  /** Number of pets in the portrait (1 by default → identical behavior
   * to the existing single-pet flow). When 2-4, each tier's displayed
   * price is bumped by $15 × (petCount - 1). The corresponding
   * surcharge is applied at checkout via /api/create-checkout, which
   * detects multi-pet by the imageId's "multi<N>_" prefix. */
  petCount?: number;
}

const MULTIPET_SURCHARGE_PER_EXTRA = 15;

// Bump a tier's displayed dollar amount by the multi-pet surcharge.
// Single-pet (petCount = 1 or undefined) returns the price unchanged.
function applyMultiPetSurcharge(
  priceText: string | undefined,
  petCount: number | undefined
): string | undefined {
  if (!priceText) return priceText;
  const extras = Math.max(0, (petCount ?? 1) - 1);
  if (extras === 0) return priceText;
  const match = priceText.match(/^\$(\d+(?:\.\d{1,2})?)$/);
  if (!match) return priceText;
  const dollars = parseFloat(match[1]);
  const newAmount = dollars + extras * MULTIPET_SURCHARGE_PER_EXTRA;
  // Keep decimal precision only when the source had decimals.
  const formatted = priceText.includes(".")
    ? newAmount.toFixed(2)
    : Math.round(newAmount).toString();
  return `$${formatted}`;
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
    price: "$6",
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
    name: "Framed Print 8×10",
    price: "$79",
    description: "Ready to hang",
    features: ["Gallery-quality print", "Premium frame", "Ships in 3–5 days"],
    badge: "Most Popular",
    highlighted: true,
  },
  // NOTE: the standalone "Complete Bundle" tile was retired in favor of the
  // "+$5 digital" add-on toggle rendered above this grid (mirrors the
  // wallpaper add-on). The `bundle` productType still exists end-to-end for
  // any in-flight orders / catalog links — it's just no longer a tile here.
  // ─── Framed line, larger sizes + poster (unframed) line ───────────
  // Each auto-hidden until its STRIPE_*_PRICE_ID env var is set.
  {
    key: "framed_12x16",
    name: "Framed Print 12×16",
    price: "$99",
    description: "Larger framed size",
    features: ["Gallery-quality print", "Premium frame", "12×16 wall size"],
    highlighted: false,
  },
  {
    key: "framed_18x24",
    name: "Framed Print 18×24",
    price: "$149",
    description: "Statement-piece framed print",
    features: ["Gallery-quality print", "Premium frame", "18×24 wall size"],
    highlighted: false,
  },
  {
    key: "poster_8x10",
    name: "Poster 8×10",
    price: "$45",
    description: "Unframed — frame it your way",
    features: ["Fine art paper", "Vivid color", "Fits standard 8×10 frames"],
    highlighted: false,
  },
  {
    key: "poster_12x16",
    name: "Poster 12×16",
    price: "$54",
    description: "Unframed — frame it your way",
    features: ["Fine art paper", "Vivid color", "Fits standard 12×16 frames"],
    highlighted: false,
  },
  {
    key: "poster_18x24",
    name: "Poster 18×24",
    price: "$67",
    description: "Unframed statement size",
    features: ["Fine art paper", "Vivid color", "Fits standard 18×24 frames"],
    highlighted: false,
  },
  // ─── 2026-04-24 expansion ─────────────────────────────────────────
  // Each auto-hidden until its STRIPE_*_PRICE_ID env var is set.
  {
    key: "gallery_set",
    name: "Gallery Set",
    price: "$99",
    description: "All 4 styles, same pet",
    features: ["4 × 11×14 prints", "Watercolor · Oil · Renaissance · Line", "Gallery-wall ready"],
    badge: "New",
    highlighted: false,
  },
  {
    key: "acrylic",
    name: "Acrylic Print 11×14",
    price: "$149",
    description: "Vibrant photo acrylic",
    features: ["Premium acrylic", "Gallery finish", "Deep color"],
    highlighted: false,
  },
  {
    key: "metal",
    name: "Metal Print 11×14",
    price: "$129",
    description: "Aluminum metal print",
    features: ["Modern & durable", "Indoor/outdoor safe", "Sleek finish"],
    highlighted: false,
  },
  {
    key: "prism",
    name: "Acrylic Prism",
    price: "$69",
    description: "Standalone photo block",
    features: ["Desk-sized piece", "Crystal-clear acrylic", "Free-standing"],
    highlighted: false,
  },
  {
    key: "phone_case",
    name: "Phone Case",
    price: "$34",
    description: "Custom iPhone case",
    features: ["Printed back", "Slim & protective", "Snap fit"],
    highlighted: false,
  },
  {
    key: "pillow",
    name: "Throw Pillow",
    price: "$39",
    description: "18×18 with insert",
    features: ["Printed cover", "Insert included", "Zip-off washable"],
    highlighted: false,
  },
  {
    key: "mug",
    name: "Mug",
    price: "$24",
    description: "11oz ceramic",
    features: ["Dishwasher safe", "Full-wrap print", "Microwave safe"],
    highlighted: false,
  },
  {
    key: "cards",
    name: "Greeting Cards",
    price: "$24",
    description: "10-pack with envelopes",
    features: ["Premium cardstock", "10 cards + envelopes", "Holiday-ready"],
    highlighted: false,
  },
  {
    key: "multipet",
    name: "Multi-Pet Upgrade",
    price: "$20",
    description: "2+ pets in one portrait",
    features: ["Combines multiple pets", "One composed piece", "Add to any order"],
    highlighted: false,
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

export default function ProductSelector({ imageId, onError, wallpaperSelected, petCount }: ProductSelectorProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [portraitCount] = useState<number>(() => getSessionPortraitCount());
  // "+$5 digital" add-on. When on, clicking any physical print tier also
  // bundles the full-res download (delivered by the webhook). Ignored for
  // the digital/wallpaper tiers — adding the file to itself is meaningless.
  const [addDigital, setAddDigital] = useState(false);
  // Which products have their Stripe price ID configured. Tiers missing
  // from this set are auto-hidden — so scaffold-then-activate works with
  // zero code edits. null = still loading.
  const [enabledKeys, setEnabledKeys] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products/enabled")
      .then((r) => (r.ok ? r.json() : { enabled: [] }))
      .then((data: { enabled?: string[] }) => {
        if (!cancelled) setEnabledKeys(new Set(data.enabled ?? []));
      })
      .catch(() => {
        // If the endpoint fails, fall back to showing the original 5-tier
        // ladder so the page is never empty. Matches pre-expansion behavior.
        if (!cancelled) setEnabledKeys(new Set(["digital", "display", "mounted", "canvas"]));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleTiers = enabledKeys
    ? TIERS.filter((t) => enabledKeys.has(t.key))
    : TIERS.filter((t) => ["digital", "display", "mounted", "canvas"].includes(t.key));

  // Does the visible ladder include at least one shippable print? The
  // "+$5 digital" add-on only applies to physical products, so the toggle
  // is hidden on a digital-only ladder.
  const hasPhysicalTier = visibleTiers.some((t) => isPhysicalProduct(t.key));

  const handleSelect = async (key: string) => {
    setLoading(key);
    const productType = key as ProductType;
    // The digital add-on only applies to physical prints.
    const withDigital = addDigital && isPhysicalProduct(key);
    const value =
      productValue(productType) + (wallpaperSelected ? 5 : 0) + (withDigital ? 5 : 0);
    track({ name: "begin_checkout", productType, value, imageId });
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: key,
          imageId,
          addWallpaper: !!wallpaperSelected,
          addDigital: withDigital,
        }),
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

      {/* "+$5 digital" add-on toggle — replaces the old standalone bundle
          tile. Flip it on, then pick any framed print or canvas and the
          full-resolution download is emailed alongside the print. */}
      {hasPhysicalTier && (
        <button
          type="button"
          onClick={() => setAddDigital((v) => !v)}
          aria-pressed={addDigital}
          className={`mb-6 w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
            addDigital
              ? "border-brand-green bg-brand-green/5 shadow-md"
              : "border-gray-200 bg-white hover:border-brand-green hover:bg-brand-green/5"
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-display text-sm font-semibold text-brand-green leading-tight">
                Add the full-res digital file
              </p>
              <span className="text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full flex-shrink-0">
                +$5
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-snug">
              Get the print-ready download emailed with any print — print again at any size, anytime.
            </p>
          </div>

          {/* Checkbox indicator */}
          <div
            className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
              addDigital ? "border-brand-green bg-brand-green" : "border-gray-300 bg-white"
            }`}
          >
            {addDigital && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </button>
      )}

      {/* Tier ladder — entire card is the click target so a mis-tap
          anywhere on the tile still routes to checkout (bigger hitbox,
          fewer dropped conversions on mobile). Stacks on phone, 2-up
          on tablet, 3-up on desktop — deliberately bigger than before
          so each tier is a full scroll "section" rather than a
          cramped row. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleTiers.map((tier) => {
          const isLoading = loading === tier.key;
          const anyLoading = loading !== null;
          return (
            <button
              key={tier.key}
              type="button"
              onClick={() => handleSelect(tier.key)}
              disabled={anyLoading}
              className={`relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all text-left w-full disabled:cursor-not-allowed ${
                tier.highlighted
                  ? "border-brand-green shadow-xl ring-4 ring-brand-green/10 hover:ring-brand-green/20 hover:shadow-2xl active:scale-[0.99]"
                  : "border-gray-200 hover:border-brand-green hover:shadow-lg active:scale-[0.99]"
              } ${anyLoading && !isLoading ? "opacity-50" : ""}`}
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

              <div className="flex flex-col flex-1 p-5 bg-white">
                <p className="font-display text-base font-semibold text-brand-green mb-1">
                  {tier.name}
                </p>
                <p className="text-xs text-gray-400 mb-4">{tier.description}</p>

                <div className="mb-5">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-display text-3xl font-bold text-brand-green">
                      {applyMultiPetSurcharge(tier.price, petCount)}
                    </span>
                    {tier.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {applyMultiPetSurcharge(tier.originalPrice, petCount)}
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

                {/* Decorative CTA label — the whole card is the button, this
                    is just a visual affordance so the click target is obvious. */}
                <div
                  className={`w-full py-3 rounded-xl font-display font-semibold text-sm text-center ${
                    tier.highlighted
                      ? "bg-brand-green text-white"
                      : "bg-gray-100 text-brand-green"
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      Get This
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
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
