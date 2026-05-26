import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import LandingHeader from "@/components/LandingHeader";
import LandingFooterCTA from "@/components/LandingFooterCTA";
import { PRODUCTS, type ProductType } from "@/lib/products";
import {
  PRODUCT_PRESENTATION,
  PRODUCT_SLUGS,
  presentationBySlug,
} from "@/lib/product-presentation";
import { AGGREGATE_RATING } from "@/lib/reviews";

interface Props {
  params: { slug: string };
}

// Pre-render a detail page for every SKU that has presentation data.
// Adding a new product to lib/product-presentation.ts automatically gives
// it a route here; no edits to this file required.
export function generateStaticParams() {
  return PRODUCT_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const presentation = presentationBySlug(params.slug);
  const product = presentation ? PRODUCTS[presentation.key] : undefined;
  if (!presentation || !product) return {};

  const title = `${product.label} — Custom Pet Portrait | Paw Masterpiece`;
  const description = `${presentation.longDescription} Upload any photo, see your pet rendered in 30 seconds, then order. Starting at ${product.price}.`;

  return {
    title,
    description,
    alternates: { canonical: `/products/${presentation.key}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/products/${presentation.key}`,
      images: [
        {
          url: presentation.image,
          width: 1200,
          height: 900,
          alt: product.label,
        },
      ],
    },
  };
}

// The four core styles we render every portrait in. Each tile on the
// detail page is a deep link into /start with the style pre-selected so
// the visitor lands one step closer to generating.
const STYLE_TILES: Array<{
  key: "watercolor" | "oil" | "renaissance" | "lineart";
  label: string;
  image: string;
}> = [
  { key: "watercolor", label: "Watercolor", image: "/examples/watercolor.png" },
  { key: "oil", label: "Oil Painting", image: "/examples/oil.png" },
  { key: "renaissance", label: "Renaissance", image: "/examples/renaissance.png" },
  { key: "lineart", label: "Line Art", image: "/examples/lineart.png" },
];

// Where the primary CTA goes per-product. Wallpaper has its own dedicated
// studio; everything else funnels through the zero-scroll /start page.
function startUrlFor(key: ProductType, style?: string): string {
  if (key === "wallpaper") {
    return style ? `/wallpaper?style=${style}` : "/wallpaper";
  }
  return style ? `/start?style=${style}` : "/start";
}

// Strip the "$" off so JSON-LD gets a clean numeric price.
function priceNumber(price: string): string {
  return price.replace(/[^\d.]/g, "");
}

export default function ProductDetailPage({ params }: Props) {
  const presentation = presentationBySlug(params.slug);
  if (!presentation) notFound();
  const product = PRODUCTS[presentation.key];
  if (!product) notFound();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    "https://pawmasterpiece.com";

  const originalPrice =
    "originalPrice" in product ? product.originalPrice : undefined;

  // Related products: same category, excluding the current one. Cap at 3
  // so the "More in {category}" rail doesn't compete with the primary CTA.
  const related = PRODUCT_PRESENTATION.filter(
    (p) => p.category === presentation.category && p.key !== presentation.key
  ).slice(0, 3);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.label,
    description: presentation.longDescription,
    brand: { "@type": "Brand", name: "Paw Masterpiece" },
    image: `${baseUrl}${presentation.image}`,
    category: presentation.category,
    offers: {
      "@type": "Offer",
      price: priceNumber(product.price),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/products/${presentation.key}`,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: AGGREGATE_RATING.ratingValue,
      reviewCount: AGGREGATE_RATING.reviewCount,
      bestRating: AGGREGATE_RATING.bestRating,
      worstRating: AGGREGATE_RATING.worstRating,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${baseUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${baseUrl}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.label,
        item: `${baseUrl}/products/${presentation.key}`,
      },
    ],
  };

  const primaryHref = startUrlFor(presentation.key);
  const primaryCta =
    presentation.key === "wallpaper"
      ? "Make my wallpaper — $0.99"
      : `Start my ${product.label.toLowerCase()}`;

  return (
    <main className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <LandingHeader />

      {/* Breadcrumb strip */}
      <nav
        aria-label="Breadcrumb"
        className="max-w-6xl mx-auto px-4 pt-6 text-xs text-gray-500"
      >
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-brand-green">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/products" className="hover:text-brand-green">
              Products
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-brand-green font-medium" aria-current="page">
            {product.label}
          </li>
        </ol>
      </nav>

      {/* Hero — product image + buy box */}
      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Image */}
          <div className="relative aspect-[4/5] bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
            <Image
              src={presentation.image}
              alt={product.label}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            {presentation.isPlaceholder && (
              <span className="absolute top-4 left-4 bg-cream/92 backdrop-blur-sm rounded-full px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                Product photo coming soon
              </span>
            )}
          </div>

          {/* Buy box */}
          <div className="lg:pt-6">
            <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-3">
              {presentation.category}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl text-brand-green leading-tight mb-3">
              {product.label}
            </h1>
            <div className="flex items-baseline gap-3 mb-5">
              <span className="font-display text-3xl text-brand-green font-bold">
                {product.price}
              </span>
              {originalPrice && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    {originalPrice}
                  </span>
                  <span className="inline-block bg-brand-gold/15 text-brand-green text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full">
                    Save
                  </span>
                </>
              )}
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              {presentation.longDescription}
            </p>

            <ul className="space-y-2.5 mb-7">
              {presentation.highlights.map((h) => (
                <li key={h} className="flex items-start gap-3 text-sm text-gray-700">
                  <svg
                    className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>{h}</span>
                </li>
              ))}
            </ul>

            {/* Primary CTA */}
            <Link
              href={primaryHref}
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-brand-green text-cream px-8 py-4 rounded-full text-base font-display font-semibold hover:bg-brand-green/90 transition-colors shadow-sm"
            >
              {primaryCta}
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
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>

            <p className="mt-4 text-xs text-gray-500 leading-relaxed">
              Upload any photo. Free preview in 30 seconds — only pay if you
              love it. <span className="text-brand-green font-medium">100% money-back guarantee.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Style picker — every product can be rendered in any of 4 styles */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-3">
              Pick your style
            </p>
            <h2 className="font-display text-2xl sm:text-3xl text-brand-green mb-3">
              Same {product.label.toLowerCase()}, four artistic finishes
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Tap a style to start your portrait with it pre-selected — no
              scrolling, no signup, free preview in about 30 seconds.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
            {STYLE_TILES.map((style) => (
              <Link
                key={style.key}
                href={startUrlFor(presentation.key, style.key)}
                className="group relative aspect-[4/5] bg-cream rounded-2xl overflow-hidden border border-gray-200 hover:border-brand-green hover:shadow-lg transition-all"
              >
                <Image
                  src={style.image}
                  alt={`${style.label} pet portrait example`}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 sm:p-4">
                  <p className="text-cream font-display font-semibold text-sm sm:text-base">
                    {style.label}
                  </p>
                  <p className="text-cream/80 text-[11px] sm:text-xs">
                    Start with this style →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Related products in same category */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <h2 className="font-display text-2xl sm:text-3xl text-brand-green">
              More in {presentation.category}
            </h2>
            <Link
              href="/products"
              className="text-xs text-brand-green font-semibold hover:underline"
            >
              See all products →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((r) => {
              const rp = PRODUCTS[r.key];
              if (!rp) return null;
              return (
                <Link
                  key={r.key}
                  href={`/products/${r.key}`}
                  className="bg-white rounded-3xl border border-gray-200 overflow-hidden group hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-[4/3] bg-cream overflow-hidden">
                    <Image
                      src={r.image}
                      alt={rp.label}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg text-brand-green font-semibold mb-1">
                      {rp.label}
                    </h3>
                    <p className="font-display text-base text-brand-green font-bold mb-2">
                      {rp.price}
                    </p>
                    <p className="text-sm text-gray-600 leading-snug line-clamp-2">
                      {r.longDescription}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <LandingFooterCTA
        headline={`Ready for your ${product.label.toLowerCase()}?`}
        subhead="Upload any photo, pick a style, see your pet rendered in 30 seconds. Free preview, no signup required."
      />
    </main>
  );
}
