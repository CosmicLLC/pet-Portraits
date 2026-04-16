"use client";

import { useState } from "react";
import { PRODUCTS, type ProductType } from "@/lib/products";

interface ProductSelectorProps {
  imageId: string;
  onError: (msg: string) => void;
}

const PRODUCT_ICONS: Record<ProductType, React.ReactNode> = {
  digital: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  wallpaper: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  canvas: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

const BADGES: Record<ProductType, string | null> = {
  digital: "Most Popular",
  wallpaper: null,
  canvas: "Premium",
};

// Session-consistent portrait count (30–80) for social proof
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

export default function ProductSelector({
  imageId,
  onError,
}: ProductSelectorProps) {
  const [loading, setLoading] = useState<ProductType | null>(null);
  const [portraitCount] = useState<number>(() => getSessionPortraitCount());

  const handleSelect = async (productType: ProductType) => {
    setLoading(productType);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType, imageId }),
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
      <div className="flex items-center justify-center gap-2 mb-3 text-sm text-gray-500">
        <span>🔥</span>
        <span>
          <strong className="text-brand-green">{portraitCount}</strong> portraits created today
        </span>
      </div>

      {/* Limited-time offer banner */}
      <div className="bg-brand-green/5 border border-brand-green/20 rounded-xl px-4 py-2.5 mb-4 text-center">
        <p className="text-xs text-brand-green font-medium">
          🎁 Limited time: Free digital download with every canvas order
        </p>
      </div>

      {/* Urgency text */}
      <div className="flex items-center justify-center gap-1.5 mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 w-fit mx-auto">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Preview expires in 24 hours — purchase to save the full resolution
      </div>

      {/* Canvas upsell banner */}
      <button
        onClick={() => handleSelect("canvas")}
        disabled={loading !== null}
        className="w-full mb-4 p-4 rounded-2xl bg-brand-green text-white text-left relative overflow-hidden hover:bg-brand-green/90 transition-all hover:shadow-lg disabled:opacity-60 group"
      >
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 text-8xl leading-none select-none">
          🖼
        </div>
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-0.5">
            Recommended upgrade
          </p>
          <p className="font-display font-bold text-base leading-snug">
            Make it real — Canvas Print 8×10
          </p>
          <p className="text-white/70 text-xs mt-0.5">
            Gallery-quality print shipped to your door. The perfect keepsake or gift.
          </p>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading === "canvas" ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </button>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-px bg-gray-200" />
        <p className="text-xs text-gray-400">or choose below</p>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="flex flex-col gap-3">
        {(Object.entries(PRODUCTS) as [ProductType, (typeof PRODUCTS)[ProductType]][]).map(
          ([key, product]) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              disabled={loading !== null}
              className={`relative flex items-center gap-4 w-full p-5 rounded-2xl border-2 transition-all text-left bg-white ${
                loading === key
                  ? "border-brand-green bg-brand-green/5"
                  : key === "digital"
                    ? "border-brand-green/30 hover:border-brand-green hover:shadow-lg hover:-translate-y-0.5"
                    : "border-gray-200 hover:border-brand-green/30 hover:shadow-lg hover:-translate-y-0.5"
              } ${loading !== null && loading !== key ? "opacity-50" : ""}`}
            >
              {/* Badge */}
              {BADGES[key] && (
                <span className="absolute -top-2.5 right-4 bg-brand-gold text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
                  {BADGES[key]}
                </span>
              )}

              <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center flex-shrink-0 text-brand-green">
                {PRODUCT_ICONS[key]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-brand-green text-base">
                  {product.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {product.description}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <p className="font-display text-2xl font-bold text-brand-green">
                  {product.price}
                </p>
                {loading === key ? (
                  <div className="w-5 h-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </button>
          )
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure payment
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Delivered by email
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Instant delivery
        </span>
      </div>
    </div>
  );
}
