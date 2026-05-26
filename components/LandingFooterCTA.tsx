import Link from "next/link"
import TrustStrip from "./TrustStrip"
import NewsletterInline from "./NewsletterInline"

// Conversion-focused footer block that lives at the bottom of every SEO
// landing page. Trust strip on cream (rating/guarantee/shipping/speed) sits
// above the dark CTA so the eye lands on the proof before the ask.
export default function LandingFooterCTA({
  headline = "Ready to see your pet as art?",
  subhead = "Upload a photo, pick a style, see your portrait in about 30 seconds — free to preview, no signup required.",
  ctaLabel = "Create Your Portrait",
  showTrust = true,
  /** Where the CTA points. Defaults to /start (zero-scroll upload page).
   * Pass a style query like "/start?style=oil" to pre-select a style for
   * users landing from a style-specific page. */
  ctaHref = "/start",
}: {
  headline?: string
  subhead?: string
  ctaLabel?: string
  showTrust?: boolean
  ctaHref?: string
}) {
  return (
    <>
      {showTrust && (
        <section className="bg-cream py-10 sm:py-12 border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4">
            <TrustStrip variant="card" />
          </div>
        </section>
      )}
      <section className="bg-cream py-10 sm:py-12 border-t border-gray-100">
        <div className="max-w-xl mx-auto px-4">
          <NewsletterInline
            source="landing_footer"
            headline="Get one piece of pet art advice a week."
            copy="Style drops, framing tips, last-minute holiday deadlines, and the occasional discount. No spam — unsubscribe in one click."
          />
        </div>
      </section>
      <section className="bg-brand-green text-cream py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl sm:text-4xl mb-4">{headline}</h2>
          <p className="text-cream/80 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            {subhead}
          </p>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-3 bg-cream text-brand-green px-8 py-4 rounded-full text-base font-display font-semibold hover:bg-white hover:-translate-y-0.5 transition-all shadow-xl"
          >
            {ctaLabel}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>

          {/* Free tools row — migrated from the old "Tools" header dropdown
              so the breed-identifier / photo-guide / free-wallpaper magnets
              are still discoverable site-wide without crowding the nav. */}
          <p className="text-cream/70 text-xs mt-7 flex items-center justify-center gap-2.5 flex-wrap">
            <span className="text-cream/50">Free tools:</span>
            <Link href="/tools/breed-identifier" className="hover:text-cream underline-offset-2 hover:underline">
              Breed Identifier
            </Link>
            <span className="text-cream/30" aria-hidden="true">·</span>
            <Link href="/free-photo-guide" className="hover:text-cream underline-offset-2 hover:underline">
              Pet Photo Guide
            </Link>
            <span className="text-cream/30" aria-hidden="true">·</span>
            <Link href="/free-wallpaper" className="hover:text-cream underline-offset-2 hover:underline">
              Free Wallpaper (with email)
            </Link>
          </p>

          <p className="text-cream/60 text-xs mt-4">
            Loved by 40,000+ pet parents · 100% satisfaction guarantee · Ships to the United States
          </p>
        </div>
      </section>
    </>
  )
}
