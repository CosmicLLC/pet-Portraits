import type { Metadata } from "next";
import LandingHeader from "@/components/LandingHeader";
import LandingFooterCTA from "@/components/LandingFooterCTA";
import BreedIdentifierTool from "./BreedIdentifierTool";

// Free top-of-funnel breed identifier. Linkable asset designed to earn
// backlinks from pet bloggers, news roundups, and breed-curious search
// traffic. Per the marketing plan, free tools earn 10-100x more
// backlinks than blog posts. No email gate — the tool's job is to be
// shareable; lead capture happens through the existing site-wide popups.

export const metadata: Metadata = {
  title: "Free Dog Breed Identifier — Upload a Photo, AI Tells You the Breed",
  description:
    "Free AI-powered dog and cat breed identifier. Upload any photo and get an instant breed identification with confidence score, breed personality, and portrait style recommendations. No signup required.",
  keywords: [
    "dog breed identifier",
    "cat breed identifier",
    "free breed identifier",
    "what breed is my dog",
    "ai dog breed identifier",
    "identify dog breed from photo",
    "mixed breed identifier",
  ],
  alternates: { canonical: "/tools/breed-identifier" },
  openGraph: {
    title: "Free Dog Breed Identifier — Upload a Photo, AI Tells You the Breed",
    description:
      "Upload any photo and get an instant breed identification. Free, no signup. Plus see what your pet would look like as a Renaissance portrait.",
    type: "website",
    url: "/tools/breed-identifier",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

export default function BreedIdentifierPage() {
  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Paw Masterpiece Breed Identifier",
    description:
      "Free AI tool that identifies dog and cat breeds from a photo, with confidence scoring and portrait style recommendations.",
    url: `${BASE_URL}/tools/breed-identifier`,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: "Paw Masterpiece",
      url: BASE_URL,
    },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is the breed identifier really free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. No signup, no email required, no payment. Upload a photo, get a breed identification. The tool is funded by the rest of our site — we make pet portraits and hope you'll try a free preview after.",
        },
      },
      {
        "@type": "Question",
        name: "How accurate is the breed identifier?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "For purebred dogs and cats with clear face-forward photos, accuracy is high. For mixed-breed dogs we identify the most likely primary breed plus 1-2 alternatives — confidence is shown with each result. Best results come from photos where the pet's face fills most of the frame in even light.",
        },
      },
      {
        "@type": "Question",
        name: "Does it work for cats?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The tool identifies both dogs and cats. Most TICA-recognized cat breeds are supported.",
        },
      },
      {
        "@type": "Question",
        name: "What happens to my photo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Your photo is sent to our AI vision model for identification and immediately discarded. We do not store, train on, or share uploaded images.",
        },
      },
      {
        "@type": "Question",
        name: "Why does the tool also recommend portrait styles?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Different breeds tend to suit different portrait styles. A regal Cavalier King Charles Spaniel looks made for a Renaissance portrait; a sleek Greyhound shines in minimalist line art. The recommendations are based on patterns we see in our portrait orders.",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }}
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
            Free tool — no signup
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] text-brand-green leading-[1.08] mb-5">
            What breed is your dog or cat?
          </h1>
          <p className="text-gray-700 text-lg sm:text-xl max-w-2xl mx-auto mb-3 leading-relaxed">
            Upload a photo. Our AI identifies the breed in about 5 seconds, names the
            personality, and recommends the portrait style that suits them best.
          </p>
          <p className="text-gray-500 text-sm">
            Works on dogs, cats, and mixed breeds. No email, no signup, no catch.
          </p>
        </div>
      </section>

      {/* Tool */}
      <section className="py-12 sm:py-16">
        <div className="max-w-2xl mx-auto px-4">
          <BreedIdentifierTool />
        </div>
      </section>

      {/* How it works + reassurance */}
      <section className="py-14 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-display text-2xl sm:text-3xl text-brand-green text-center mb-10">
            How the breed identifier works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green font-display font-bold flex items-center justify-center mb-3">
                1
              </div>
              <h3 className="font-display text-lg text-brand-green mb-1.5">Upload a photo</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Any clear photo of your pet&apos;s face. Phone snapshots work great.
                Front-facing or profile, indoor or outdoor — all fine.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green font-display font-bold flex items-center justify-center mb-3">
                2
              </div>
              <h3 className="font-display text-lg text-brand-green mb-1.5">AI identifies the breed</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Our vision model checks the photo against AKC and TICA breed databases
                and returns the most likely match with a confidence score.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green font-display font-bold flex items-center justify-center mb-3">
                3
              </div>
              <h3 className="font-display text-lg text-brand-green mb-1.5">See style recommendations</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Get breed-specific portrait style suggestions, then preview what your
                pet would look like as a watercolor, oil, Renaissance, or line art piece.
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
                q: "Is the breed identifier really free?",
                a: "Yes. No signup, no email required, no payment. Upload a photo, get a breed identification. The tool is funded by the rest of our site — we make pet portraits and hope you'll try a free preview after.",
              },
              {
                q: "How accurate is the breed identifier?",
                a: "For purebred dogs and cats with clear face-forward photos, accuracy is high. For mixed-breed dogs we identify the most likely primary breed plus 1-2 alternatives — confidence is shown with each result. Best results come from photos where the pet's face fills most of the frame in even light.",
              },
              {
                q: "Does it work for cats?",
                a: "Yes. The tool identifies both dogs and cats. Most TICA-recognized cat breeds are supported.",
              },
              {
                q: "What happens to my photo?",
                a: "Your photo is sent to our AI vision model for identification and immediately discarded. We do not store, train on, or share uploaded images.",
              },
              {
                q: "Why does the tool also recommend portrait styles?",
                a: "Different breeds tend to suit different portrait styles. A regal Cavalier King Charles Spaniel looks made for a Renaissance portrait; a sleek Greyhound shines in minimalist line art. The recommendations are based on patterns we see in our portrait orders.",
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
        headline="See your pet as a Renaissance king."
        subhead="The breed identifier was the warm-up. The portrait is the main event. Free preview in about 30 seconds."
        ctaLabel="Preview a Portrait"
      />
    </main>
  );
}
