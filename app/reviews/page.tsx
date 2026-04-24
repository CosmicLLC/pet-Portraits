import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import LandingHeader from "@/components/LandingHeader";
import LandingFooterCTA from "@/components/LandingFooterCTA";
import { WALL_REVIEWS, AGGREGATE_RATING } from "@/lib/reviews";
import { STYLE_SEO } from "@/lib/seo-data";

const PAGE_TITLE = "Customer Reviews & Pet Portrait Gallery";
const PAGE_DESCRIPTION =
  "See what 40,000+ pet parents say about Paw Masterpiece. Real reviews, real portraits, and the stories behind them. 4.9/5 average across 487 verified reviews.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/reviews" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: "/reviews",
    images: [{ url: "/examples/oil.png", width: 900, height: 1200, alt: "Custom pet portrait — oil painting example" }],
  },
};

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

export default function ReviewsPage() {
  const reviewPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Custom AI Pet Portrait",
    description: PAGE_DESCRIPTION,
    brand: { "@type": "Brand", name: "Paw Masterpiece" },
    image: `${BASE_URL}/examples/oil.png`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: AGGREGATE_RATING.ratingValue,
      reviewCount: AGGREGATE_RATING.reviewCount,
      bestRating: AGGREGATE_RATING.bestRating,
      worstRating: AGGREGATE_RATING.worstRating,
    },
    review: WALL_REVIEWS.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      datePublished: r.datePublished,
      reviewBody: r.review,
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(r.stars),
        bestRating: "5",
        worstRating: "1",
      },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Reviews", item: `${BASE_URL}/reviews` },
    ],
  };

  return (
    <main className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <LandingHeader />

      {/* Hero */}
      <section className="bg-cream border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-20 text-center">
          <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-4">
            Wall of Love
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-brand-green mb-5 leading-tight">
            40,000+ pet parents. 4.9 stars. One portrait at a time.
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            These are the stories behind the portraits. Real customers, real pets, shared with their permission.
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-8">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-6 h-6 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="font-display text-lg text-brand-green mt-3">
            {AGGREGATE_RATING.ratingValue} out of 5 · {AGGREGATE_RATING.reviewCount} reviews
          </p>
        </div>
      </section>

      {/* Review grid — card per review, grouped with the style sample the
          customer chose so the wall is visually rich, not just a block of
          text. When more reviews land the grid will scale to fill. */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4">
          {WALL_REVIEWS.length === 0 ? (
            <div className="text-center text-gray-500">
              No reviews yet — check back after our Mother&apos;s Day launch.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {WALL_REVIEWS.map((r, i) => {
                const style = r.style ? STYLE_SEO[r.style] : null;
                return (
                  <article
                    key={i}
                    className="bg-white rounded-3xl border border-gray-200 overflow-hidden flex flex-col sm:flex-row"
                  >
                    {style && (
                      <div className="relative w-full sm:w-40 aspect-[3/4] sm:aspect-auto flex-shrink-0">
                        <Image
                          src={style.image}
                          alt={`${style.fullName} pet portrait example`}
                          fill
                          sizes="(max-width: 640px) 100vw, 160px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex gap-0.5 mb-3">
                        {[...Array(r.stars)].map((_, j) => (
                          <svg key={j} className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-gray-700 text-[15px] leading-relaxed mb-4 flex-1">
                        &ldquo;{r.review}&rdquo;
                      </p>
                      <div className="border-t border-gray-100 pt-3">
                        <p className="font-semibold text-sm text-gray-800">{r.name}</p>
                        <p className="text-xs text-gray-400">
                          {r.pet}
                          {r.location ? ` · ${r.location}` : ""}
                          {style ? ` · ${style.shortName}` : ""}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Submit your portrait CTA */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl text-brand-green mb-3">
            Show us your portrait.
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            We love seeing how our customers use their portraits — on the mantel, in the office, as a gift to a friend. Send us a photo and we may feature it on the Wall of Love (and send you a little thank-you credit on your next order).
          </p>
          <a
            href="mailto:cosmic.company.llc@gmail.com?subject=Wall%20of%20Love%20Submission&body=Attach%20a%20photo%20of%20your%20framed%20portrait%20or%20wallpaper%2C%20and%20let%20us%20know%20your%20pet%27s%20name%20%2B%20style!"
            className="inline-flex items-center gap-2 bg-brand-green text-cream px-6 py-3 rounded-full text-sm font-display font-semibold hover:bg-brand-green/90 transition-colors"
          >
            Submit your portrait
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </a>
          <p className="text-xs text-gray-400 mt-4">
            By emailing us, you grant Paw Masterpiece permission to share your photo + first name on our site and social channels.
          </p>
        </div>
      </section>

      {/* Internal linking — gently push to popular landing pages */}
      <section className="py-12 bg-cream border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/memorial" className="text-sm text-brand-green hover:bg-brand-green/5 px-4 py-2 rounded-full border border-brand-green/20 transition-colors">
              Memorial Portraits
            </Link>
            <Link href="/gifts/mothers-day" className="text-sm text-brand-green hover:bg-brand-green/5 px-4 py-2 rounded-full border border-brand-green/20 transition-colors">
              Mother&apos;s Day Gifts
            </Link>
            <Link href="/gifts/fathers-day" className="text-sm text-brand-green hover:bg-brand-green/5 px-4 py-2 rounded-full border border-brand-green/20 transition-colors">
              Father&apos;s Day Gifts
            </Link>
            <Link href="/gifts/christmas" className="text-sm text-brand-green hover:bg-brand-green/5 px-4 py-2 rounded-full border border-brand-green/20 transition-colors">
              Christmas Gifts
            </Link>
          </div>
        </div>
      </section>

      <LandingFooterCTA />
    </main>
  );
}
