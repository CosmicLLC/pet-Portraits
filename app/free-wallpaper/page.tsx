import type { Metadata } from "next";
import LandingHeader from "@/components/LandingHeader";
import LandingFooterCTA from "@/components/LandingFooterCTA";
import WallpaperFlow from "./WallpaperFlow";

const PAGE_TITLE = "Free Phone Wallpaper of Your Pet — Custom Lock Screen Art";
const PAGE_DESCRIPTION =
  "Free custom phone wallpaper of your dog or cat. Upload a photo, pick a style, your wallpaper renders in 30 seconds. Optimized for iPhone lock screens.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/free-wallpaper" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: "/free-wallpaper",
    images: [
      {
        url: "/examples/watercolor.png",
        width: 900,
        height: 1200,
        alt: "Custom watercolor pet portrait — free phone wallpaper",
      },
    ],
  },
};

export default function FreeWallpaperPage() {
  return (
    <main className="min-h-screen bg-cream">
      <LandingHeader />

      <section className="bg-cream border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-14 sm:py-20 text-center">
          <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-4">
            Free · Instant Delivery
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-brand-green leading-tight mb-5">
            A custom phone wallpaper<br />of your pet — free.
          </h1>
          <p className="text-gray-700 text-lg max-w-xl mx-auto leading-relaxed">
            Upload a photo, pick a style, watch it render in about 30 seconds. iPhone-optimized, ready to download. No credit card. No catch.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="max-w-3xl mx-auto px-4">
          <WallpaperFlow />
        </div>
      </section>

      {/* What you get */}
      <section className="py-14 sm:py-16 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-2xl text-brand-green mb-8 text-center">
            What you get
          </h2>

          <div className="space-y-6">
            {[
              {
                title: "Custom phone wallpaper",
                body: "Your pet rendered in watercolor, oil, Renaissance, or line art — sized for your iPhone lock screen. Yours to keep.",
              },
              {
                title: "Watermarked preview",
                body: "Your free version has a small \"Paw Masterpiece\" watermark. Looks great on a lock screen. The unwatermarked file is part of any paid order.",
              },
              {
                title: "No payment required",
                body: "We just need your email — that's the deal. We send occasional notes about new styles and seasonal launches; unsubscribe anytime.",
              },
              {
                title: "Same engine as our paid portraits",
                body: "Same generation pipeline that produces the framed canvas prints we ship every day. The art quality is real, not a teaser.",
              },
            ].map((item, i) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-display font-semibold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-display text-lg text-brand-green mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooterCTA
        headline="Want it on your wall, too?"
        subhead="Order a framed canvas of the same portrait — ships in 3–5 days. Through May 10, every order includes a FREE 11×14 display print automatically."
        ctaLabel="See Canvas Options"
      />
    </main>
  );
}
