"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics";
import type { ProductType } from "@/lib/products";

// Flagship framed line — the hero offer on the post-generation screen. Each
// size is a real Stripe-backed SKU; we only render sizes whose Stripe price ID
// is configured (fetched from /api/products/enabled), so larger sizes light up
// automatically once their env var is wired. `canvas` is the live 8x10 framed
// print (historical key) and is always shown.
const SIZES: { key: ProductType; label: string; dims: string; price: number; badge?: string }[] = [
  { key: "canvas", label: '8" × 10"', dims: "Perfect for a desk or shelf", price: 79, badge: "Most loved" },
  { key: "framed_12x16", label: '12" × 16"', dims: "A statement on the wall", price: 99 },
  { key: "framed_18x24", label: '18" × 24"', dims: "Above the mantel", price: 149 },
];

// Add-on prices mirror the existing /api/create-checkout behavior: the digital
// + wallpaper bumps are each +$5 when bundled with a print. Standalone digital
// is its own $6 product.
const DIGITAL_ADDON = 5;
const WALLPAPER_ADDON = 5;
const DIGITAL_SOLO = 6;
const FREE_SHIP_OVER = 100;
const REVIEW_COUNT = 487;

interface PortraitOfferProps {
  imageId: string;
  watermarkedImage: string;
  /** Optional pet name, printed on the mat like a real framed piece. */
  petName?: string;
  onError: (msg: string) => void;
}

export default function PortraitOffer({ imageId, watermarkedImage, petName, onError }: PortraitOfferProps) {
  const [enabled, setEnabled] = useState<Set<string> | null>(null);
  const [sizeKey, setSizeKey] = useState<ProductType>("canvas");
  const [addDigital, setAddDigital] = useState(false);
  const [addWallpaper, setAddWallpaper] = useState(false);
  const [loading, setLoading] = useState<"frame" | "digital" | null>(null);

  // Which SKUs have a Stripe price ID configured. Sizes missing from this set
  // are hidden, so scaffold-then-activate works with no code change.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/products/enabled")
      .then((r) => (r.ok ? r.json() : { enabled: [] }))
      .then((data: { enabled?: string[] }) => {
        if (!cancelled) setEnabled(new Set(data.enabled ?? []));
      })
      .catch(() => {
        if (!cancelled) setEnabled(new Set(["canvas"]));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Until the enabled list loads, show all three sizes optimistically; after,
  // filter to configured SKUs (canvas always shown as the live flagship).
  const sizes = useMemo(
    () => SIZES.filter((s) => (enabled ? enabled.has(s.key) || s.key === "canvas" : true)),
    [enabled]
  );

  // If the selected size isn't actually enabled, snap to the first available.
  useEffect(() => {
    if (enabled && !sizes.some((s) => s.key === sizeKey)) {
      setSizeKey(sizes[0]?.key ?? "canvas");
    }
  }, [enabled, sizes, sizeKey]);

  const selected = sizes.find((s) => s.key === sizeKey) ?? SIZES[0];
  const subtotal =
    selected.price + (addDigital ? DIGITAL_ADDON : 0) + (addWallpaper ? WALLPAPER_ADDON : 0);
  const freeShip = subtotal >= FREE_SHIP_OVER;

  async function checkout(
    productType: ProductType,
    opts: { addDigital?: boolean; addWallpaper?: boolean; value: number },
    which: "frame" | "digital"
  ) {
    if (loading) return;
    setLoading(which);
    track({ name: "begin_checkout", productType, value: opts.value, imageId });
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType,
          imageId,
          addDigital: !!opts.addDigital,
          addWallpaper: !!opts.addWallpaper,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch {
      onError("Payment error — please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="w-full mt-6">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* ─────────── Framed hero ─────────── */}
        <div className="lg:sticky lg:top-24">
          <div className="mx-auto max-w-sm">
            {/* Dark moulding → cream mat → portrait */}
            <div className="rounded-[3px] bg-gradient-to-b from-[#2c2722] to-[#1b1813] p-3 sm:p-4 shadow-2xl ring-1 ring-black/20">
              <div className="bg-cream p-4 sm:p-6 shadow-inner">
                {petName && (
                  <p className="text-center font-display tracking-[0.25em] uppercase text-brand-green/70 text-xs sm:text-sm mb-3">
                    {petName}
                  </p>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={watermarkedImage}
                  alt="Your custom pet portrait, framed"
                  className="block w-full h-auto"
                />
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-gray-400">
              Gallery-quality framed print · {selected.label} shown
            </p>
          </div>
        </div>

        {/* ─────────── Offer panel ─────────── */}
        <div>
          <h2 className="font-display text-3xl sm:text-4xl text-brand-green leading-tight">
            Your pet, framed
          </h2>

          {/* Social proof */}
          <div className="mt-2 mb-6 flex items-center gap-2">
            <div className="flex">
              {[0, 1, 2, 3, 4].map((i) => (
                <svg key={i} className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-500">Loved by {REVIEW_COUNT.toLocaleString()} pet parents</span>
          </div>

          {/* Size selector */}
          <p className="mb-2 font-display text-sm font-semibold text-brand-green">Choose your size</p>
          <div className="space-y-2.5">
            {sizes.map((s) => {
              const active = s.key === sizeKey;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSizeKey(s.key)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                    active
                      ? "border-brand-green bg-brand-green/5 shadow-sm"
                      : "border-gray-200 bg-white hover:border-brand-green/40"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                        active ? "border-brand-green" : "border-gray-300"
                      }`}
                    >
                      {active && <span className="h-2.5 w-2.5 rounded-full bg-brand-green" />}
                    </span>
                    <span>
                      <span className="font-display font-semibold text-brand-green">{s.label}</span>
                      <span className="block text-xs text-gray-400">{s.dims}</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {s.badge && (
                      <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-green">
                        {s.badge}
                      </span>
                    )}
                    <span className="font-display font-bold text-brand-green">${s.price}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Extras / order bumps */}
          <p className="mb-2 mt-6 font-display text-sm font-semibold text-brand-green">Add extras?</p>
          <div className="space-y-2.5">
            <BumpRow
              checked={addDigital}
              onToggle={() => setAddDigital((v) => !v)}
              title="Digital download"
              price="+$5"
              desc="Get the print-ready file emailed too — reprint at any size, anytime."
            />
            <BumpRow
              checked={addWallpaper}
              onToggle={() => setAddWallpaper((v) => !v)}
              title="Phone wallpaper"
              price="+$5"
              desc="Your portrait sized for your phone lock screen — instant download."
            />
          </div>

          {/* Subtotal */}
          <div className="mt-6 rounded-2xl border border-brand-green/15 bg-brand-green/5 px-4 py-3.5 text-center">
            <p className="font-display text-brand-green">
              Subtotal: <span className="text-lg font-bold">${subtotal}</span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {freeShip ? "✓ Free shipping unlocked" : `Free shipping over $${FREE_SHIP_OVER}`}
            </p>
          </div>

          {/* Primary CTA */}
          <button
            type="button"
            onClick={() => checkout(selected.key, { addDigital, addWallpaper, value: subtotal }, "frame")}
            disabled={loading !== null}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-green py-4 font-display text-base font-semibold text-white shadow-lg transition-all hover:bg-brand-green/90 hover:shadow-xl active:scale-[0.99] disabled:opacity-60"
          >
            {loading === "frame" ? (
              <Spinner label="Taking you to checkout…" />
            ) : (
              <>
                Checkout securely · ${subtotal}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Apple Pay · Google Pay · card — secured by Stripe
          </p>

          {/* Guarantee */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
            <svg className="h-4 w-4 flex-shrink-0 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Love it or we redo it — free.
          </div>

          {/* Standalone digital path */}
          <div className="mt-5 border-t border-gray-100 pt-5 text-center">
            <button
              type="button"
              onClick={() => checkout("digital", { value: DIGITAL_SOLO }, "digital")}
              disabled={loading !== null}
              className="text-sm text-gray-500 transition-colors hover:text-brand-green disabled:opacity-60"
            >
              {loading === "digital" ? (
                "Taking you to checkout…"
              ) : (
                <>
                  Just want the file?{" "}
                  <span className="font-semibold text-brand-green underline underline-offset-2">
                    Digital download — ${DIGITAL_SOLO}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─────────── Reassurance band ─────────── */}
      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Benefit emoji="🚚" title="Ships in 3–5 days" desc="Printed, framed, delivered to your door." />
        <Benefit emoji="🖼️" title="Gallery quality" desc="Premium frame, fade-resistant fine-art print." />
        <Benefit emoji="💚" title="Risk-free" desc="Not in love with it? We redo it, free." />
      </div>
    </div>
  );
}

function BumpRow({
  checked,
  onToggle,
  title,
  price,
  desc,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  price: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={`flex w-full items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
        checked ? "border-brand-green bg-brand-green/5" : "border-gray-200 bg-white hover:border-brand-green/40"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
          checked ? "border-brand-green bg-brand-green" : "border-gray-300 bg-white"
        }`}
      >
        {checked && (
          <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-display text-sm font-semibold text-brand-green">{title}</span>
          <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-bold text-brand-green">{price}</span>
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-gray-500">{desc}</span>
      </span>
    </button>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2">
      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {label}
    </span>
  );
}

function Benefit({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3.5">
      <span className="flex-shrink-0 text-xl" aria-hidden="true">
        {emoji}
      </span>
      <div>
        <p className="font-display text-sm font-semibold leading-tight text-brand-green">{title}</p>
        <p className="text-xs leading-snug text-gray-500">{desc}</p>
      </div>
    </div>
  );
}
