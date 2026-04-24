import type { Metadata } from "next";
import LandingHeader from "@/components/LandingHeader";
import LandingFooterCTA from "@/components/LandingFooterCTA";
import LeadMagnetForm from "./LeadMagnetForm";

const PAGE_TITLE = "Free Pet Photo Guide — 5 Rules for the Perfect Portrait";
const PAGE_DESCRIPTION =
  "5 rules for the perfect pet portrait photo. Lighting, angle, pet wrangling, what to do with old phone snapshots. Free guide delivered to your inbox in 30 seconds.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/free-photo-guide" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: "/free-photo-guide",
    images: [
      {
        url: "/examples/watercolor.png",
        width: 900,
        height: 1200,
        alt: "Watercolor pet portrait — what a great photo can become",
      },
    ],
  },
};

export default function FreePhotoGuidePage() {
  return (
    <main className="min-h-screen bg-cream">
      <LandingHeader />

      {/* Hero */}
      <section className="bg-cream border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-14 sm:py-20 text-center">
          <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-4">
            Free Guide · Instant Delivery
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-brand-green leading-tight mb-5">
            5 rules for the perfect<br />pet portrait photo.
          </h1>
          <p className="text-gray-700 text-lg max-w-xl mx-auto leading-relaxed">
            You don&apos;t need a DSLR. You don&apos;t need a willing pet. You don&apos;t need a studio. The five rules that turn a phone snapshot into a portrait you&apos;ll actually frame — delivered free in 30 seconds.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-10 sm:py-14">
        <div className="max-w-md mx-auto px-4">
          <LeadMagnetForm />
        </div>
      </section>

      {/* What's inside */}
      <section className="py-14 sm:py-16 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-2xl text-brand-green mb-8 text-center">What&apos;s inside</h2>

          <div className="space-y-7">
            {[
              {
                title: "Daylight, never overhead lights",
                body: "Why afternoon window light flatters every breed and overhead bulbs flatten everything.",
              },
              {
                title: "Eye level, not above",
                body: "The single biggest mistake people make — and why the floor is your best friend.",
              },
              {
                title: "One pet per photo (for now)",
                body: "How to handle multi-pet households without losing an afternoon to chaos.",
              },
              {
                title: "Their face has to be visible",
                body: "Which angles capture personality and which ones leave the artist guessing.",
              },
              {
                title: "Burst mode + a noise they react to",
                body: "The technique pet photographers use that takes 30 seconds and gets you the one perfect frame.",
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

          <p className="mt-10 text-center text-sm text-gray-500">
            Plus a bonus section on what to do when all you have is an old, blurry, or scanned photo —
            because that&apos;s most memorial portrait commissions, and they turn out beautifully.
          </p>
        </div>
      </section>

      <LandingFooterCTA
        headline="Ready to try a portrait?"
        subhead="Upload any photo, pick a style, see your pet rendered in about 30 seconds. Free preview, no signup required."
      />
    </main>
  );
}
