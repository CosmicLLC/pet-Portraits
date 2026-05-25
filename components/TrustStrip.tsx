import { AGGREGATE_RATING } from "@/lib/reviews";

// Trust-signal strip designed to sit directly above a conversion CTA. Crown &
// Paw / West & Willow / Etsy listings all crowd these signals near the buy
// button — there's a documented +7-15% lift for adding rating + guarantee
// proximity on pet-gift pages. Component is presentational only, doesn't
// know what CTA it's adjacent to — so it can be slotted into any landing.
//
// Variant "compact" is a single horizontal line for mobile/below-hero use.
// Variant "card" is the bigger card-with-badges layout for landing pages.

interface Props {
  variant?: "compact" | "card";
  /** Center the strip horizontally. Default true. */
  center?: boolean;
}

const FEATURES = [
  {
    icon: (
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
    label: `${AGGREGATE_RATING.ratingValue} stars`,
    sub: `${AGGREGATE_RATING.reviewCount.toLocaleString()} reviews`,
  },
  {
    icon: (
      // Shield-check — guarantee
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 5.25-5.25 9-9 9s-9-3.75-9-9 5.25-9 9-9 9 3.75 9 9z" />
      </svg>
    ),
    label: "Love-it-or-redo-it",
    sub: "100% guarantee",
  },
  {
    icon: (
      // Truck — shipping
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9-1.5h.75v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V18M14.25 18.75v-7.875c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V18.75M21 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0M3.375 4.5h13.5c.621 0 1.125.504 1.125 1.125v13.125" />
      </svg>
    ),
    label: "Ships 3-5 days",
    sub: "Inside the US",
  },
  {
    icon: (
      // Bolt — speed
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    label: "Preview in 30s",
    sub: "Free, no signup",
  },
];

export default function TrustStrip({ variant = "card", center = true }: Props) {
  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-gray-500 ${center ? "justify-center" : ""}`}>
        {FEATURES.map((f) => (
          <span key={f.label} className="inline-flex items-center gap-1.5">
            <span className="text-brand-gold">{f.icon}</span>
            <span className="font-medium text-gray-700">{f.label}</span>
            <span className="text-gray-400">· {f.sub}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl ${center ? "mx-auto" : ""}`}>
      {FEATURES.map((f) => (
        <div
          key={f.label}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-green/8 text-brand-green flex items-center justify-center flex-shrink-0">
            {f.icon}
          </div>
          <div className="min-w-0">
            <p className="font-display font-semibold text-sm text-brand-green leading-tight truncate">
              {f.label}
            </p>
            <p className="text-[11px] text-gray-500 leading-tight truncate">{f.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// "Featured in" row — separate component because it has different lifecycle
// than the always-relevant rating/guarantee strip. Renders nothing when
// there are no publication slots filled, so the site never shows an empty
// "as featured in" row (worse than no row at all).
//
// To activate: drop logo files in /public/press/ and add entries to the
// PRESS array below. Each entry needs an alt + image path + (optional)
// hyperlink to the article that mentioned us.

interface PressEntry {
  name: string;
  logo: string;
  href?: string;
  /** Width hint in px for proportional sizing in the row. Heights are normalized. */
  width: number;
}

const PRESS: PressEntry[] = [
  // Populate as press coverage lands. Each entry is one greyscale logo in the
  // "As featured in" row. Empty array = component renders nothing.
];

export function FeaturedInRow() {
  if (PRESS.length === 0) return null;
  return (
    <div className="py-8 border-y border-gray-100">
      <div className="max-w-5xl mx-auto px-4">
        <p className="text-center text-xs font-display font-semibold uppercase tracking-[0.18em] text-gray-400 mb-5">
          As featured in
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 opacity-70">
          {PRESS.map((p) => {
            const inner = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.logo}
                alt={p.name}
                width={p.width}
                height={28}
                className="h-7 sm:h-8 w-auto object-contain grayscale hover:grayscale-0 transition"
              />
            );
            return p.href ? (
              <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            ) : (
              <span key={p.name}>{inner}</span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
