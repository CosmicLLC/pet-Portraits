import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { GIFT_OCCASIONS, giftOccasionBySlug } from "@/lib/gift-occasions"
import { STYLE_SEO } from "@/lib/seo-data"
import { AGGREGATE_RATING } from "@/lib/reviews"
import LandingHeader from "@/components/LandingHeader"
import LandingFooterCTA from "@/components/LandingFooterCTA"

interface Props {
  params: { occasion: string }
}

export function generateStaticParams() {
  return GIFT_OCCASIONS.map((o) => ({ occasion: o.slug }))
}

export function generateMetadata({ params }: Props): Metadata {
  const occ = giftOccasionBySlug(params.occasion)
  if (!occ) return {}
  return {
    title: occ.metaTitle,
    description: occ.metaDescription,
    keywords: occ.keywords,
    alternates: { canonical: `/gifts/${occ.slug}` },
    openGraph: {
      title: occ.metaTitle,
      description: occ.metaDescription,
      type: "website",
      url: `/gifts/${occ.slug}`,
      images: [{ url: occ.heroImage, width: 900, height: 1200, alt: occ.heroImageAlt }],
    },
  }
}

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"

export default function GiftOccasionPage({ params }: Props) {
  const occ = giftOccasionBySlug(params.occasion)
  if (!occ) notFound()

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${occ.displayName} Pet Portrait Gift`,
    description: occ.metaDescription,
    brand: { "@type": "Brand", name: "Paw Masterpiece" },
    image: `${BASE_URL}${occ.heroImage}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "19.00",
      highPrice: "89.00",
      offerCount: "5",
      availability: "https://schema.org/InStock",
      url: `${BASE_URL}/gifts/${occ.slug}`,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: AGGREGATE_RATING.ratingValue,
      reviewCount: AGGREGATE_RATING.reviewCount,
      bestRating: AGGREGATE_RATING.bestRating,
      worstRating: AGGREGATE_RATING.worstRating,
    },
  }

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: occ.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      // Strip any inline HTML (anchors) we allow in faq answers — FAQPage
      // structured data must be plain text or Google flags it.
      acceptedAnswer: { "@type": "Answer", text: f.a.replace(/<[^>]+>/g, "") },
    })),
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Gifts", item: `${BASE_URL}/gifts/${occ.slug}` },
      { "@type": "ListItem", position: 3, name: occ.displayName, item: `${BASE_URL}/gifts/${occ.slug}` },
    ],
  }

  return (
    <main className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <LandingHeader />

      {/* Hero — inspired by the Mother's Day ad creative: warm cream
          background, editorial lifestyle photography, centered trust badge
          pill overlay on the image, Playfair headline, brand-green CTA pill,
          URL line. Shared template across all gift occasions. */}
      <section className="relative bg-cream border-b border-gray-100 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-14 sm:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="text-center md:text-left md:order-1 order-2">
            <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-4">
              {occ.eyebrow}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] text-brand-green leading-[1.08] mb-5">
              {occ.heroHeadline}
            </h1>
            <p className="text-gray-700 text-lg sm:text-xl max-w-xl md:mx-0 mx-auto mb-8 leading-relaxed">
              {occ.heroSubhead}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-3 bg-brand-green text-cream px-8 py-4 rounded-full text-base font-display font-semibold shadow-[0_12px_30px_-10px_rgba(45,74,62,0.45)] hover:bg-brand-green/90 hover:shadow-[0_18px_38px_-12px_rgba(45,74,62,0.55)] hover:-translate-y-0.5 transition-all uppercase tracking-wider"
            >
              {occ.heroCta ?? "Start Your Portrait"}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <p className="text-brand-green/80 text-sm font-display font-medium mt-4">
              pawmasterpiece.com
            </p>
            <p className="text-gray-500 text-xs mt-3">{occ.heroTrust}</p>
          </div>
          <div className="relative md:order-2 order-1">
            <div className="relative aspect-[4/3] sm:aspect-[5/4] w-full mx-auto rounded-3xl overflow-hidden shadow-[0_30px_60px_-25px_rgba(45,74,62,0.3)] ring-1 ring-gray-100 bg-white">
              <Image
                src={occ.heroImage}
                alt={occ.heroImageAlt}
                fill
                priority
                sizes="(max-width: 768px) 90vw, 540px"
                className="object-cover"
              />
              {/* Trust badge pill overlay, bottom-left corner — matches ad */}
              <div className="absolute bottom-3 left-3 bg-cream/92 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
                <span className="text-brand-gold text-sm leading-none">★</span>
                <span className="text-xs font-display font-semibold text-brand-green">
                  4.9 · Ships in 3–5 days
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three content blocks — unique body per occasion for SEO */}
      <section className="py-16 sm:py-20 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 space-y-12">
          {occ.sections.map((sec) => (
            <div key={sec.heading}>
              <h2 className="font-display text-3xl text-brand-green mb-4">{sec.heading}</h2>
              <p
                className="text-gray-700 leading-relaxed text-lg"
                // Allow the lib data to embed an internal link (e.g. to /memorial).
                // Inputs come from our own source file so XSS risk is bounded.
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: sec.body }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Recommended styles */}
      <section className="py-16 sm:py-20 bg-cream border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-3">
              Recommended styles for {occ.displayName}
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Preview all four free. Most {occ.displayName.toLowerCase()} gifters end up with one of these.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {occ.recommendedStyles.map((rec) => {
              const style = STYLE_SEO[rec.key]
              return (
                <Link
                  key={rec.key}
                  href={`/styles/${style.slug}`}
                  className="group block bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-100 hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={style.image}
                      alt={`${style.fullName} — ${occ.displayName} gift style`}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <p className="font-display font-bold text-xl drop-shadow">{style.shortName}</p>
                      <p className="text-xs opacity-90">{style.tagline}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 leading-snug">{rec.why}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-5 h-5 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="font-display text-lg text-brand-green">
            {AGGREGATE_RATING.ratingValue} out of 5 · {AGGREGATE_RATING.reviewCount} reviews
          </p>
          <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto leading-relaxed">
            Loved by 40,000+ pet parents. Love-it-or-redo-it guarantee on every order.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 bg-cream border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-10 text-center">
            {occ.displayName} portrait FAQs
          </h2>
          <div className="space-y-6">
            {occ.faqs.map((f) => (
              <div key={f.q}>
                <h3 className="font-display text-lg font-semibold text-gray-800 mb-2">{f.q}</h3>
                <p
                  className="text-gray-600 leading-relaxed text-[15px]"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: f.a }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooterCTA
        headline={occ.closingHeadline}
        subhead={occ.closingSubhead}
        ctaLabel="Start Your Portrait"
      />
    </main>
  )
}
