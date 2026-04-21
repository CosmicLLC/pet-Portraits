import Link from "next/link"
import Image from "next/image"

interface Props {
  eyebrow?: string
  headline: string
  subhead: string
  previewImage: string
  previewAlt: string
  ctaLabel?: string
  ctaHref?: string
}

// Shared hero for all SEO landing pages (style pages, pet category pages,
// breed × style pages). Keeps the look consistent and the CTA obvious.
export default function LandingHero({
  eyebrow,
  headline,
  subhead,
  previewImage,
  previewAlt,
  ctaLabel = "Create Your Portrait",
  ctaHref = "/",
}: Props) {
  return (
    <section className="relative bg-cream border-b border-gray-100 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="text-center md:text-left">
          {eyebrow && (
            <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-4">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] text-brand-green leading-[1.1] mb-5">
            {headline}
          </h1>
          <p className="text-gray-600 text-lg sm:text-xl max-w-xl md:mx-0 mx-auto mb-8 leading-relaxed">
            {subhead}
          </p>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-3 bg-brand-green text-cream px-8 py-4 rounded-full text-base font-display font-semibold shadow-[0_12px_30px_-10px_rgba(45,74,62,0.45)] hover:bg-brand-green/90 hover:shadow-[0_18px_38px_-12px_rgba(45,74,62,0.55)] hover:-translate-y-0.5 transition-all"
          >
            {ctaLabel}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
        <div className="relative aspect-[3/4] max-w-md w-full mx-auto rounded-3xl overflow-hidden shadow-[0_30px_60px_-25px_rgba(45,74,62,0.3)] ring-1 ring-gray-100 bg-white">
          <Image
            src={previewImage}
            alt={previewAlt}
            fill
            priority
            sizes="(max-width: 768px) 90vw, 420px"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
