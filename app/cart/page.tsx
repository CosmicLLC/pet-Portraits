"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/CartProvider";
import { PRODUCTS, isPhysicalProduct } from "@/lib/products";
import { track } from "@/lib/analytics";

// Product types a portrait can be bought as in the cart (excludes wallpaper /
// multipet / canvas_upsell — those aren't standalone cart items). Filtered to
// whatever actually exists in the catalog.
const CHOICE_KEYS = ["digital", "canvas", "display", "mounted"].filter(
  (k) => k in PRODUCTS
);

function priceCents(productType: string, petCount = 1): number {
  const raw = (PRODUCTS as Record<string, { price?: string }>)[productType]?.price ?? "$0";
  const base = Math.round(parseFloat(raw.replace(/[^0-9.]/g, "")) * 100) || 0;
  const surcharge = Math.max(0, petCount - 1) * 1500;
  return base + surcharge;
}

export default function CartPage() {
  const { items, remove, setProductType, clear, hydrated } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCents = items.reduce(
    (sum, it) => sum + priceCents(it.productType, it.petCount),
    0
  );

  const checkout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    // productType is required by the analytics type; "digital" is a stand-in
    // for the mixed cart (the order value is the meaningful field here).
    track({ name: "begin_checkout", productType: "digital", value: totalCents / 100 });
    try {
      const res = await fetch("/api/create-cart-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((it) => ({ imageId: it.imageId, productType: it.productType })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Checkout failed");
    }
  };

  const anyPhysical = items.some((it) => isPhysicalProduct(it.productType));

  return (
    <main className="min-h-screen bg-cream">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.jpg" alt="Paw Masterpiece" width={32} height={32} className="rounded-lg" />
            <span className="font-display text-base text-brand-green font-semibold">Paw Masterpiece</span>
          </Link>
          <Link href="/start" className="text-sm text-brand-green font-semibold hover:underline">
            + Add another portrait
          </Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="font-display text-3xl text-brand-green mb-1">Your cart</h1>
        <p className="text-gray-500 mb-8 text-sm">
          {hydrated ? `${items.length} portrait${items.length === 1 ? "" : "s"}` : "…"} · checkout together in one payment
        </p>

        {hydrated && items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="text-3xl mb-3">🛒</div>
            <p className="text-gray-600 mb-6">Your cart is empty.</p>
            <Link
              href="/start"
              className="inline-block bg-brand-green text-cream px-6 py-3 rounded-full text-sm font-display font-semibold hover:bg-brand-green/90 transition-colors"
            >
              Create a portrait
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((it) => (
                <div
                  key={it.imageId}
                  className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {it.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.preview} alt="Portrait" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🐾</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <select
                      value={it.productType}
                      onChange={(e) => setProductType(it.imageId, e.target.value)}
                      className="w-full max-w-[14rem] text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700"
                    >
                      {CHOICE_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {(PRODUCTS as Record<string, { label: string }>)[k].label}
                        </option>
                      ))}
                    </select>
                    {it.petCount && it.petCount > 1 ? (
                      <p className="text-[11px] text-gray-400 mt-1">
                        Includes +${(it.petCount - 1) * 15} multi-pet surcharge
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-semibold text-brand-green">
                      ${(priceCents(it.productType, it.petCount) / 100).toFixed(2)}
                    </p>
                    <button
                      onClick={() => remove(it.imageId)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Total</span>
                <span className="font-display text-2xl font-bold text-brand-green">
                  ${(totalCents / 100).toFixed(2)}
                </span>
              </div>
              {anyPhysical ? (
                <p className="text-[11px] text-gray-400 mb-4">
                  Shipping address collected at checkout for your print(s).
                </p>
              ) : (
                <p className="text-[11px] text-gray-400 mb-4">
                  Digital items delivered by email instantly.
                </p>
              )}
              <button
                onClick={checkout}
                disabled={loading || items.length === 0}
                className="w-full bg-brand-green text-cream py-4 rounded-full text-base font-display font-semibold hover:bg-brand-green/90 transition-colors disabled:opacity-60"
              >
                {loading ? "Loading checkout…" : `Check out all ${items.length} →`}
              </button>
              {error ? <p className="text-red-500 text-xs text-center mt-3">{error}</p> : null}
              <button
                onClick={clear}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors mt-3"
              >
                Clear cart
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
