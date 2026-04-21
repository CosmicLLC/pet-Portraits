import Link from "next/link"

// Conversion-focused footer block that lives at the bottom of every SEO
// landing page. Recency pulse + single clear CTA back to the portrait
// creator.
export default function LandingFooterCTA({
  headline = "Ready to see your pet as art?",
  subhead = "Upload a photo, pick a style, see your portrait in about 30 seconds — free to preview, no signup required.",
  ctaLabel = "Create Your Portrait",
}: {
  headline?: string
  subhead?: string
  ctaLabel?: string
}) {
  return (
    <section className="bg-brand-green text-cream py-16 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-display text-3xl sm:text-4xl mb-4">{headline}</h2>
        <p className="text-cream/80 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
          {subhead}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-3 bg-cream text-brand-green px-8 py-4 rounded-full text-base font-display font-semibold hover:bg-white hover:-translate-y-0.5 transition-all shadow-xl"
        >
          {ctaLabel}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
        <p className="text-cream/60 text-xs mt-6">
          Loved by 40,000+ pet parents · 100% satisfaction guarantee · Ships to the United States
        </p>
      </div>
    </section>
  )
}
