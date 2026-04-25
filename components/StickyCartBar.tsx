"use client";

import { useState } from "react";
import { track, productValue } from "@/lib/analytics";

interface StickyCartBarProps {
  watermarkedImage: string;
  imageId: string;
  onError: (msg: string) => void;
  wallpaperSelected?: boolean;
}

export default function StickyCartBar({ watermarkedImage, imageId, onError, wallpaperSelected }: StickyCartBarProps) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    const value = productValue("bundle") + (wallpaperSelected ? 5 : 0);
    track({ name: "begin_checkout", productType: "bundle", value, imageId });
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType: "bundle", imageId, addWallpaper: !!wallpaperSelected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch {
      onError("Payment error — please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 py-3 animate-fade-in-up">
      <div className="max-w-2xl mx-auto flex items-center gap-3">
        {/* Thumbnail */}
        <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
          <img
            src={watermarkedImage}
            alt="Your portrait"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Best Value</p>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-bold text-brand-green text-base">$79</span>
            <span className="text-gray-400 text-xs line-through">$85</span>
            <span className="text-[10px] text-brand-gold font-semibold bg-brand-gold/10 px-1.5 py-0.5 rounded-full">Digital FREE</span>
          </div>
          <p className="text-xs text-gray-500 truncate">Canvas + free digital</p>
        </div>

        {/* CTA */}
        <button
          onClick={handleBuy}
          disabled={loading}
          className="flex-shrink-0 bg-brand-green text-white px-5 py-2.5 rounded-full font-display font-semibold text-sm hover:bg-brand-green/90 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Processing…</span>
            </span>
          ) : (
            "Buy Now"
          )}
        </button>
      </div>
    </div>
  );
}
