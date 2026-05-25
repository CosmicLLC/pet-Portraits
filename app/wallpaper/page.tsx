import type { Metadata } from "next";
import LandingHeader from "@/components/LandingHeader";
import LandingFooterCTA from "@/components/LandingFooterCTA";
import WallpaperStudio from "./WallpaperStudio";
import { WALLPAPER_PALETTE } from "@/lib/gemini";

// $0.99 phone wallpaper SKU. Impulse-priced tripwire that converts cold
// traffic into payment-data buyers + filters genuine intent. Distinct from
// the existing /free-wallpaper lead-magnet (which captures email for a
// watermarked download). Distinct from the $5 add-on (which composites a
// portrait into a phone aspect on the back of a portrait sale).

export const metadata: Metadata = {
  title: "Custom Phone Wallpaper of Your Pet — $0.99 | Paw Masterpiece",
  description:
    "Turn your pet's photo into a custom phone wallpaper — minimalist illustration on the color of your choice. Pick from 10 hand-picked aesthetic backgrounds. Preview free, download for $0.99.",
  keywords: [
    "pet phone wallpaper",
    "custom dog wallpaper",
    "cat phone wallpaper",
    "personalized pet wallpaper",
    "minimalist pet wallpaper",
    "iphone pet wallpaper",
    "android pet wallpaper",
  ],
  alternates: { canonical: "/wallpaper" },
  openGraph: {
    title: "Custom Phone Wallpaper of Your Pet — $0.99",
    description:
      "Minimalist illustrated wallpaper of your pet in the color you pick. Preview free in 30 seconds, download for $0.99.",
    type: "website",
    url: "/wallpaper",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

export default function WallpaperPage() {
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Custom Pet Phone Wallpaper",
    description:
      "A minimalist phone wallpaper of your pet on a hand-picked solid color background. Delivered as a high-resolution 1290×2796 JPG, optimized for modern iPhone and Android screens.",
    brand: { "@type": "Brand", name: "Paw Masterpiece" },
    image: `${BASE_URL}/og-image.jpg`,
    offers: {
      "@type": "Offer",
      price: "0.99",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${BASE_URL}/wallpaper`,
    },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What do I get for $0.99?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A high-resolution 1290×2796 phone wallpaper JPG of your pet, rendered as a minimalist illustration on the solid background color you pick. Delivered by email within minutes of purchase, no watermark, yours to keep.",
        },
      },
      {
        "@type": "Question",
        name: "What phones is the wallpaper sized for?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "1290×2796 — the resolution of iPhone 14 Pro / Pro Max / 15 Pro / 16 Pro. The same file works perfectly on any modern phone; your device will auto-fit or crop slightly for non-Pro models.",
        },
      },
      {
        "@type": "Question",
        name: "Can I see what it looks like before I pay?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Upload a photo, pick a color, and we generate a watermarked preview in about 30 seconds. You only pay if you love it.",
        },
      },
      {
        "@type": "Question",
        name: "Why a flat illustration instead of a photo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Phone wallpapers look best with simple shapes and bold negative space — your icons and widgets sit on top of the wallpaper, so a busy photo competes with them. A clean minimalist illustration on a single color reads as intentional design and lets the rest of your home screen breathe.",
        },
      },
      {
        "@type": "Question",
        name: "Can I get a different style (oil painting, Renaissance, etc.)?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Those styles are available on our portrait creator at the home page. The wallpaper studio is intentionally focused on the minimalist look — it's the style that works best as a phone background.",
        },
      },
    ],
  };

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

      <LandingHeader />

      {/* Hero */}
      <section className="bg-cream border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-14 sm:py-20 text-center">
          <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-4">
            Phone wallpaper studio
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] text-brand-green leading-[1.08] mb-5">
            Your pet on your home screen.
          </h1>
          <p className="text-gray-700 text-lg sm:text-xl max-w-2xl mx-auto mb-3 leading-relaxed">
            A clean, minimalist illustration of your pet on a hand-picked color
            background — sized perfectly for your phone, ready in about 30 seconds.
          </p>
          <p className="text-gray-500 text-sm">
            Free preview · <strong className="text-brand-green">$0.99 to download</strong> · No subscription
          </p>
        </div>
      </section>

      {/* Studio */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <WallpaperStudio palette={WALLPAPER_PALETTE.slice()} />
        </div>
      </section>

      {/* Three-step */}
      <section className="py-14 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-display text-2xl sm:text-3xl text-brand-green text-center mb-10">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green font-display font-bold flex items-center justify-center mb-3">
                1
              </div>
              <h3 className="font-display text-lg text-brand-green mb-1.5">Upload a photo</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Any clear photo of your pet&apos;s face. Phone snapshots work — the AI handles
                cropping and background removal for you.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green font-display font-bold flex items-center justify-center mb-3">
                2
              </div>
              <h3 className="font-display text-lg text-brand-green mb-1.5">Pick a color</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Choose from 10 hand-picked backgrounds — sage, dusty rose, deep navy,
                terracotta, and more. All curated to look right on a phone.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green font-display font-bold flex items-center justify-center mb-3">
                3
              </div>
              <h3 className="font-display text-lg text-brand-green mb-1.5">Download for $0.99</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Preview is free and watermarked. Pay $0.99 once and get the full-resolution
                1290×2796 wallpaper emailed to you within minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 bg-cream border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-2xl sm:text-3xl text-brand-green text-center mb-10">
            Common questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "What do I get for $0.99?",
                a: "A high-resolution 1290×2796 phone wallpaper JPG of your pet, rendered as a minimalist illustration on the solid background color you pick. Delivered by email within minutes of purchase, no watermark, yours to keep.",
              },
              {
                q: "What phones is the wallpaper sized for?",
                a: "1290×2796 — the resolution of iPhone 14 Pro / Pro Max / 15 Pro / 16 Pro. The same file works perfectly on any modern phone; your device will auto-fit or crop slightly for non-Pro models.",
              },
              {
                q: "Can I see what it looks like before I pay?",
                a: "Yes. Upload a photo, pick a color, and we generate a watermarked preview in about 30 seconds. You only pay if you love it.",
              },
              {
                q: "Why a flat illustration instead of a photo?",
                a: "Phone wallpapers look best with simple shapes and bold negative space — your icons and widgets sit on top of the wallpaper, so a busy photo competes with them. A clean minimalist illustration on a single color reads as intentional design and lets the rest of your home screen breathe.",
              },
              {
                q: "Can I get a different style (oil painting, Renaissance, etc.)?",
                a: "Those styles are available on our portrait creator at the home page. The wallpaper studio is intentionally focused on the minimalist look — it's the style that works best as a phone background.",
              },
            ].map((f) => (
              <div key={f.q}>
                <h3 className="font-display text-base font-semibold text-gray-800 mb-1.5">
                  {f.q}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooterCTA
        headline="Want the full gallery treatment?"
        subhead="Watercolor, oil painting, Renaissance, line art — see your pet in any of our 4 portrait styles. Free preview, no signup."
        ctaLabel="See Portrait Styles"
      />
    </main>
  );
}
