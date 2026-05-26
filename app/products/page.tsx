import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import LandingHeader from "@/components/LandingHeader";
import LandingFooterCTA from "@/components/LandingFooterCTA";
import { PRODUCTS } from "@/lib/products";
import {
  PRODUCT_PRESENTATION,
  CATEGORY_ORDER,
} from "@/lib/product-presentation";

const PAGE_TITLE = "All Products — Custom Pet Portraits";
const PAGE_DESCRIPTION =
  "Every way to turn your pet into art — digital download, framed canvas, acrylic prints, gallery sets, phone wallpapers, and more. Starting at $6.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/products" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: "/products",
    images: [{ url: "/examples/watercolor.png", width: 900, height: 1200, alt: "Custom pet portraits" }],
  },
};

// Product presentation data moved to lib/product-presentation.ts so the
// detail pages at /products/[slug] can render from the same source.

export default function ProductsPage() {
  // Group by category so the grid reads as a catalog, not a soup of tiles.
  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: PRODUCT_PRESENTATION.filter((p) => p.category === cat),
  })).filter((group) => group.items.length > 0);

  return (
    <main className="min-h-screen bg-cream">
      <LandingHeader />

      {/* Hero */}
      <section className="bg-cream border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-14 sm:py-20 text-center">
          <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-4">
            Everything we make
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-brand-green leading-tight mb-5">
            All products. One portrait.
          </h1>
          <p className="text-gray-700 text-lg max-w-xl mx-auto leading-relaxed">
            Every way to turn your pet into a piece of art — from a $6 digital
            download to a 16×20 framed canvas. Upload once, pick the product
            that fits the moment.
          </p>
          <div className="mt-8">
            <Link
              href="/start"
              className="inline-flex items-center gap-3 bg-brand-green text-cream px-8 py-4 rounded-full text-base font-display font-semibold hover:bg-brand-green/90 transition-colors"
            >
              Start a Portrait
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Category sections */}
      <div className="max-w-6xl mx-auto px-4 py-14 sm:py-16 space-y-16">
        {byCategory.map(({ category, items }) => (
          <section key={category}>
            <div className="flex items-end justify-between mb-6 sm:mb-8">
              <h2 className="font-display text-2xl sm:text-3xl text-brand-green">{category}</h2>
              <p className="text-xs text-gray-400">{items.length} product{items.length === 1 ? "" : "s"}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((p) => {
                const product = PRODUCTS[p.key];
                if (!product) return null;
                const originalPrice =
                  "originalPrice" in product ? product.originalPrice : undefined;
                return (
                  <article
                    key={p.key}
                    className="bg-white rounded-3xl border border-gray-200 overflow-hidden flex flex-col group hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-[4/3] bg-cream overflow-hidden">
                      <Image
                        src={p.image}
                        alt={product.label}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                      {p.isPlaceholder && (
                        <span className="absolute top-3 left-3 bg-cream/92 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                          Product photo coming soon
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-display text-lg text-brand-green font-semibold mb-1">
                        {product.label}
                      </h3>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="font-display text-xl text-brand-green font-bold">{product.price}</span>
                        {originalPrice && (
                          <span className="text-sm text-gray-400 line-through">{originalPrice}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1">
                        {p.longDescription}
                      </p>
                      <ul className="space-y-1.5 mb-5">
                        {p.highlights.map((h) => (
                          <li key={h} className="flex items-center gap-2 text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5 text-brand-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            {h}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={`/products/${p.key}`}
                        className="w-full text-center bg-gray-100 text-brand-green py-2.5 rounded-xl font-display font-semibold text-sm hover:bg-brand-green hover:text-cream transition-colors"
                      >
                        View details
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <LandingFooterCTA
        headline="Ready to make one?"
        subhead="Upload any photo, pick a style, see your pet rendered in about 30 seconds. Free preview, no signup required."
      />
    </main>
  );
}
