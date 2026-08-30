import Link from "next/link";
import Image from "next/image";

interface Props {
  styleName: string;
  beforePhotoUrl: string;
  afterPortraitUrl: string;
  petName?: string;
  /** e.g. Watercolor: "Soft, hand-painted feel" / Line Art: "Clean, minimalist linework" */
  styleFeatureLine: string;
  /** Style key used to deep-link the creator with this style pre-selected, e.g. "watercolor" -> /start?style=watercolor */
  styleKey: string;
}

// A/B test hero for the style landing pages — currently gated to Watercolor
// and Line Art only (see app/styles/[slug]/page.tsx). Oil Painting and
// Renaissance keep the existing <LandingHero />. Top-of-funnel: calm,
// no countdown/urgency UI, just the before/after proof + a clear CTA.
export default function StyleHeroShowcase({
  styleName,
  beforePhotoUrl,
  afterPortraitUrl,
  petName,
  styleFeatureLine,
  styleKey,
}: Props) {
  const possessive = petName ? `${petName}'s` : "your pet's";

  return (
    <section className="relative bg-cream border-b border-gray-100 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="font-display text-4xl sm:text-5xl text-brand-green leading-[1.1] mb-5">
            See {possessive} portrait in 30 seconds
          </h1>
          <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
            Pay only if you love it. No commitment, no waiting days for a preview.
          </p>
        </div>

        {/* Before / after pair — stacked on mobile (photo first), side by
            side on desktop. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 items-center max-w-3xl mx-auto">
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_20px_45px_-20px_rgba(45,74,62,0.25)] ring-1 ring-gray-100 bg-white">
            <Image
              src={beforePhotoUrl}
              alt={`Real pet photo before its ${styleName.toLowerCase()} portrait`}
              fill
              sizes="(max-width: 768px) 90vw, 420px"
              className="object-cover"
            />
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-brand-green text-[11px] font-display font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
              Before
            </span>
          </div>

          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_30px_60px_-25px_rgba(45,74,62,0.3)] ring-1 ring-gray-100 bg-white">
            <Image
              src={afterPortraitUrl}
              alt={`Finished ${styleName.toLowerCase()} pet portrait`}
              fill
              sizes="(max-width: 768px) 90vw, 420px"
              className="object-cover"
            />
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-brand-green text-[11px] font-display font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
              After
            </span>
            {/* Pet-name overlay preview — same visual treatment as the
                server-side compositePetName() applied to real orders
                (bottom-third scrim + centered cream serif text), just as a
                CSS overlay here since this is a static marketing image. */}
            {petName && (
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 via-black/25 to-transparent flex items-end justify-center pb-5">
                <span className="font-display text-2xl sm:text-3xl font-semibold text-cream tracking-wide drop-shadow">
                  {petName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Feature-label strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-gray-600 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-4 h-4 text-brand-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            30-second preview
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-4 h-4 text-brand-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 5.25-5.25 9-9 9s-9-3.75-9-9 5.25-9 9-9 9 3.75 9 9z" />
            </svg>
            Pay only if you love it
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-4 h-4 text-brand-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            {styleFeatureLine}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-4 h-4 text-brand-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9-1.5h.75v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V18M14.25 18.75v-7.875c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V18.75M21 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0M3.375 4.5h13.5c.621 0 1.125.504 1.125 1.125v13.125" />
            </svg>
            Ships in 5–7 days
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-4 h-4 text-brand-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 .358-.29.648-.648.648h-1.152m-9.75 0H3.75m6.75 0V6.75A2.25 2.25 0 0113.5 4.5h1.5c1.036 0 2.117.63 2.658 1.639l1.594 3.15" />
            </svg>
            Free shipping
          </span>
        </div>

        {/* CTA — top-of-funnel, deliberately calm: no countdown/urgency here. */}
        <div className="mt-9 text-center">
          <Link
            href={`/start?style=${styleKey}`}
            className="inline-flex items-center gap-3 bg-brand-green text-cream px-8 py-4 rounded-full text-base font-display font-semibold shadow-[0_12px_30px_-10px_rgba(45,74,62,0.45)] hover:bg-brand-green/90 hover:shadow-[0_18px_38px_-12px_rgba(45,74,62,0.55)] hover:-translate-y-0.5 transition-all"
          >
            Try {styleName} free
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
