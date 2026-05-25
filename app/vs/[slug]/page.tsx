import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import LandingHeader from "@/components/LandingHeader";
import LandingFooterCTA from "@/components/LandingFooterCTA";
import { COMPARISONS, comparisonBySlug } from "@/lib/comparisons";
import { AGGREGATE_RATING } from "@/lib/reviews";

// Captures "[us] vs [them]" search intent. Comparison content lives in
// lib/comparisons.ts so the page template stays generic — add a new
// COMPARISONS entry, get a new /vs/[slug] page automatically.

interface Props {
  params: { slug: string };
}

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const c = comparisonBySlug(params.slug);
  if (!c) return {};
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: `/vs/${c.slug}` },
    openGraph: {
      title: c.metaTitle,
      description: c.metaDescription,
      type: "article",
      url: `/vs/${c.slug}`,
      images: [{ url: "/examples/oil.png", width: 900, height: 1200, alt: `Paw Masterpiece vs ${c.competitor}` }],
    },
    // Comparison pages are commercial-investigation content — keep them
    // indexable but don't waste link equity on the tail of the slug.
    robots: { index: true, follow: true },
  };
}

export default function VsPage({ params }: Props) {
  const c = comparisonBySlug(params.slug);
  if (!c) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Comparisons", item: `${BASE_URL}/vs/${c.slug}` },
      { "@type": "ListItem", position: 3, name: `vs ${c.competitorShort}`, item: `${BASE_URL}/vs/${c.slug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <LandingHeader />

      {/* Hero */}
      <section className="bg-cream border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-14 sm:py-20 text-center">
          <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-4">
            Honest comparison · As of {c.asOf}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-brand-green leading-[1.08] mb-5">
            Paw Masterpiece <span className="text-gray-400 font-normal">vs</span> {c.competitor}
          </h1>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto leading-relaxed mb-6">
            {c.intro}
          </p>
          <p className="text-gray-500 text-xs">
            ★ {AGGREGATE_RATING.ratingValue} · {AGGREGATE_RATING.reviewCount} reviews · Free preview · No signup required
          </p>
        </div>
      </section>

      {/* When to choose which */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 space-y-8">
          {c.whenToChoose.map((block) => (
            <div key={block.headline}>
              <h2 className="font-display text-2xl text-brand-green mb-3">{block.headline}</h2>
              <p className="text-gray-700 leading-relaxed text-lg">{block.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-16 sm:py-20 bg-cream border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-3 text-center">
            Side-by-side
          </h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-10">
            Data current as of {c.asOf}. Their pricing and policies are sourced from their public site;
            we update this page when either side changes meaningfully.
          </p>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-cream/50">
                <tr className="border-b border-gray-200">
                  <th className="text-left px-5 py-4 font-display text-gray-500 font-medium w-1/3">Feature</th>
                  <th className="px-5 py-4 font-display text-brand-green font-semibold text-center">Paw Masterpiece</th>
                  <th className="px-5 py-4 font-display text-gray-500 font-medium text-center">{c.competitorShort}</th>
                </tr>
              </thead>
              <tbody>
                {c.table.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-cream/30"}>
                    <td className="px-5 py-4 text-gray-700 font-medium">{row.feature}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-brand-green">
                        {row.oursBetter && <span className="text-brand-green/80">✓</span>}
                        <span className={row.oursBetter ? "font-semibold" : ""}>{row.ours}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-gray-600">{row.theirs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Where they win — honest disclosure */}
      <section className="py-16 sm:py-20 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-display text-3xl text-brand-green mb-3">Where {c.competitorShort} is the better choice</h2>
          <p className="text-gray-500 mb-8">
            Comparison pages that pretend the other side has no virtues are useless. Here&apos;s where
            we&apos;d send you to them honestly.
          </p>
          <ul className="space-y-4">
            {c.whereTheyWin.map((item, i) => (
              <li key={i} className="flex gap-3 text-gray-700 leading-relaxed">
                <span className="text-brand-gold flex-shrink-0 mt-1.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 bg-cream border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-10 text-center">
            Common questions
          </h2>
          <div className="space-y-6">
            {c.faqs.map((f) => (
              <div key={f.q}>
                <h3 className="font-display text-lg font-semibold text-gray-800 mb-2">{f.q}</h3>
                <p className="text-gray-600 leading-relaxed text-[15px]">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-link to other comparison */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm mb-3">Comparing other options?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {COMPARISONS.filter((other) => other.slug !== c.slug).map((other) => (
              <Link
                key={other.slug}
                href={`/vs/${other.slug}`}
                className="text-sm text-brand-green hover:bg-brand-green/5 px-4 py-2 rounded-full border border-brand-green/20 transition-colors"
              >
                vs {other.competitorShort}
              </Link>
            ))}
            <Link
              href="/how-it-works"
              className="text-sm text-brand-green hover:bg-brand-green/5 px-4 py-2 rounded-full border border-brand-green/20 transition-colors"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      <LandingFooterCTA
        headline="See your pet's portrait before you pay anything."
        subhead="Preview free in 30 seconds. No signup. No credit card. If you don't love it, you don't pay."
        ctaLabel="Try It Free"
      />
    </main>
  );
}
