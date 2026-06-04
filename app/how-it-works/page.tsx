import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import LandingHeader from "@/components/LandingHeader";
import LandingFooterCTA from "@/components/LandingFooterCTA";
import { AGGREGATE_RATING } from "@/lib/reviews";

// Standalone "How It Works" page — distinct from the inline section on /,
// designed to capture commercial-investigation traffic ("how do AI pet
// portraits work", "are AI pet portraits any good", "ai pet portrait
// review") and pre-empt the three biggest purchase anxieties:
//   1. Will this actually look like MY pet?
//   2. What if the result is bad?
//   3. Is this just a Crown & Paw clone with a different price tag?

const PAGE_TITLE = "How It Works — AI Pet Portraits in 30 Seconds | Paw Masterpiece";
const PAGE_DESCRIPTION =
  "Three steps: upload a photo, pick a style, get a portrait in 30 seconds. See exactly what kind of photo works, what each style looks like, and what to do if the first version isn't right.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: "/how-it-works",
    images: [{ url: "/examples/watercolor.png", width: 900, height: 1200, alt: "Pet portrait generation example" }],
  },
};

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

const FAQS = [
  {
    q: "How does AI pet portrait generation actually work?",
    a: "We use a fine-tuned image model trained specifically on pet portraiture. You upload a photo, the model analyzes the pet's face, fur color, breed shape, and pose, and generates a brand-new portrait in your chosen style. It's not a filter — it's a re-imagining of your pet as if a human artist had painted them. The full-resolution output is print-ready up to 24×36 inches.",
  },
  {
    q: "What kind of photo gives the best result?",
    a: "A clear, well-lit photo of your pet from the front, with their face fully visible, gives the strongest result. Natural lighting beats flash. A close-up beats a distant shot. A simple background helps — but isn't required, we crop and stylize automatically. Phone photos work great; no professional camera needed.",
  },
  {
    q: "What if the photo I have is blurry or old?",
    a: "Send it anyway. We work with whatever you have, including older photos from before everything went digital, blurry phone snapshots, or photos with other people in them. If we think a different photo would turn out noticeably better, we'll tell you gently. For memorial portraits especially, we work with the photo that matters most to you.",
  },
  {
    q: "What if the first version doesn't look like my pet?",
    a: "We redo it free. Reply to the confirmation email with what's off — wrong expression, different pose, more focus on the face, change the background — and we generate a new version. Unlimited revisions, no questions, no time limit, no extra cost.",
  },
  {
    q: "How is this different from Crown & Paw or West & Willow?",
    a: "Those services use human artists with 1–7 day turnaround and pricing starting around $79 for a digital file. We use AI for the heavy lift, which is what lets us deliver in 30 seconds at $6 for a digital download. The trade-off is honesty: ours is AI-assisted with curated styles; theirs is hand-finished. If you want a fully hand-painted portrait and can wait a week, choose them. If you want a preview right now and a framed print in 3–5 days, choose us.",
  },
  {
    q: "Is the watermarked preview really free? What's the catch?",
    a: "No catch. The preview is genuinely free, with no signup or credit card required. The watermark stays until you purchase. We do this so you can see exactly what you'd get before paying anything. If you don't love it, walk away — costs you nothing.",
  },
  {
    q: "Can I get a high-resolution file for printing at a print shop?",
    a: "Yes — the digital download ($6) is a full-resolution PNG suitable for printing at any size up to about 24×36 inches. Many customers print it at their local print shop, on canvas through a third-party, or directly on metal or acrylic. We also offer framed prints, mounted prints, and display prints shipped to your door if you'd rather not deal with printing.",
  },
  {
    q: "What if I want a custom style that isn't in your library?",
    a: "We currently offer four styles: Watercolor, Oil Painting, Renaissance, and Line Art. Custom style requests are something we're piloting — email cosmic.company.llc@gmail.com with a reference image and we'll let you know if it's something we can do for you.",
  },
];

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "AI Pet Portrait — Paw Masterpiece",
  description: PAGE_DESCRIPTION,
  brand: { "@type": "Brand", name: "Paw Masterpiece" },
  image: [
    `${BASE_URL}/examples/watercolor.png`,
    `${BASE_URL}/examples/oil.png`,
    `${BASE_URL}/examples/renaissance.png`,
    `${BASE_URL}/examples/lineart.png`,
  ],
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "6.00",
    highPrice: "89.00",
    offerCount: "5",
    availability: "https://schema.org/InStock",
    url: `${BASE_URL}/how-it-works`,
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: AGGREGATE_RATING.ratingValue,
    reviewCount: AGGREGATE_RATING.reviewCount,
    bestRating: AGGREGATE_RATING.bestRating,
    worstRating: AGGREGATE_RATING.worstRating,
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
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
    { "@type": "ListItem", position: 2, name: "How It Works", item: `${BASE_URL}/how-it-works` },
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to make an AI pet portrait",
  description: "Three steps to a custom pet portrait in 30 seconds.",
  totalTime: "PT30S",
  estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "6" },
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Upload a photo of your pet",
      text: "Pick any clear photo of your pet — phone snapshots work fine. Front-facing with the face visible gives the strongest result.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Choose your style",
      text: "Watercolor, Oil Painting, Renaissance, or Line Art. Preview the same photo in any style free before you commit.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Download or order a print",
      text: "Get the digital download for $6, an 8×10 framed print for $79 (ships in 3–5 days inside the US), or add the digital file to any print at checkout.",
    },
  ],
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />

      <LandingHeader />

      {/* Hero */}
      <section className="bg-cream border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-14 sm:py-20 text-center">
          <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-4">
            How It Works
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] text-brand-green leading-[1.08] mb-5">
            A real portrait of your pet, in 30 seconds.
          </h1>
          <p className="text-gray-700 text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            Three steps. No signup. No credit card to preview. If the first version
            doesn&apos;t look like your pet, we redo it free — unlimited revisions.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-3 bg-brand-green text-cream px-8 py-4 rounded-full text-base font-display font-semibold shadow-[0_12px_30px_-10px_rgba(45,74,62,0.45)] hover:bg-brand-green/90 hover:shadow-[0_18px_38px_-12px_rgba(45,74,62,0.55)] hover:-translate-y-0.5 transition-all uppercase tracking-wider"
          >
            Try It Free
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="text-gray-500 text-xs mt-4">
            ★ {AGGREGATE_RATING.ratingValue} · {AGGREGATE_RATING.reviewCount} reviews · Free preview · No signup required
          </p>
        </div>
      </section>

      {/* The three steps — long-form */}
      <section className="py-16 sm:py-20 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 space-y-12">
          {[
            {
              n: "01",
              title: "Upload a photo of your pet.",
              body:
                "Drag in a photo from your phone, your camera roll, or your desktop. JPG, PNG, or WebP up to 10MB. Front-facing photos with the face clearly visible give the strongest result, but we work with what you have — including older photos, slightly blurry ones, or shots with other things in the frame. We crop and stylize automatically.",
              note: "Tip: natural daylight beats flash. A close-up beats a distant shot.",
              icon: (
                <svg className="w-7 h-7 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              ),
            },
            {
              n: "02",
              title: "Pick your style.",
              body:
                "Four styles, each with a distinct personality. Watercolor is soft and dreamy — the most-gifted style for moms. Oil painting feels like a real heirloom portrait. Renaissance is playful and unexpected — your dog as royalty. Line art is clean and modern. You can preview the same photo in any style free before you commit.",
              note: "Not sure? Generate your first preview, then re-roll in a different style. It's free.",
              icon: (
                <svg className="w-7 h-7 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
              ),
            },
            {
              n: "03",
              title: "Download or order a print.",
              body:
                "Once you love the preview, choose how to take it home: the digital download is a full-resolution PNG ($6) suitable for printing anywhere up to 24×36 inches. The 8×10 framed print ($79) ships from our US print partner in 3–5 business days, ready to hang. Add the full-resolution digital file to any print at checkout. If something is off in the first version, reply to your confirmation email and we redo it free, unlimited revisions.",
              note: "Best value: add the digital file to any print at checkout — the on-screen copy plus a piece for the wall.",
              icon: (
                <svg className="w-7 h-7 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              ),
            },
          ].map((step) => (
            <div key={step.n} className="flex gap-6 sm:gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-2">
                  {step.icon}
                </div>
                <p className="text-xs font-display font-bold text-brand-gold text-center tracking-widest">{step.n}</p>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-2xl sm:text-3xl text-brand-green mb-3">{step.title}</h2>
                <p className="text-gray-700 leading-relaxed text-lg mb-3">{step.body}</p>
                <p className="text-sm text-brand-gold/90 font-medium italic">{step.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What kind of photo works */}
      <section className="py-16 sm:py-20 bg-cream border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-3">What kind of photo works?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              The single biggest factor in how the portrait turns out. Here&apos;s what to send.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-brand-green/20">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-green mb-3">Send this</p>
              <ul className="space-y-2.5 text-gray-700">
                <li className="flex gap-2"><span className="text-brand-green flex-shrink-0">✓</span> Clear face, eyes visible</li>
                <li className="flex gap-2"><span className="text-brand-green flex-shrink-0">✓</span> Front-facing or slight angle</li>
                <li className="flex gap-2"><span className="text-brand-green flex-shrink-0">✓</span> Natural daylight</li>
                <li className="flex gap-2"><span className="text-brand-green flex-shrink-0">✓</span> Pet is the main subject</li>
                <li className="flex gap-2"><span className="text-brand-green flex-shrink-0">✓</span> Close-up beats wide shot</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Avoid if you can</p>
              <ul className="space-y-2.5 text-gray-700">
                <li className="flex gap-2"><span className="text-gray-400 flex-shrink-0">✗</span> Heavy flash glare on the eyes</li>
                <li className="flex gap-2"><span className="text-gray-400 flex-shrink-0">✗</span> Pet asleep or facing away</li>
                <li className="flex gap-2"><span className="text-gray-400 flex-shrink-0">✗</span> Tiny pet in a wide landscape shot</li>
                <li className="flex gap-2"><span className="text-gray-400 flex-shrink-0">✗</span> Multiple pets in one photo (upload separately)</li>
                <li className="flex gap-2"><span className="text-gray-400 flex-shrink-0">✗</span> Heavy filters already applied</li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link href="/free-photo-guide" className="text-sm font-display font-semibold text-brand-green hover:text-brand-green/70 underline underline-offset-4">
              See the full photo guide →
            </Link>
          </div>
        </div>
      </section>

      {/* Style preview grid */}
      <section className="py-16 sm:py-20 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-3">Four styles, one upload.</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              You can preview the same photo in any style free. See which one feels like your pet.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: "Watercolor", tagline: "Soft & dreamy", slug: "watercolor-pet-portrait", src: "/examples/watercolor.png" },
              { name: "Oil Painting", tagline: "Rich & classic", slug: "oil-painting-pet-portrait", src: "/examples/oil.png" },
              { name: "Renaissance", tagline: "Royal & regal", slug: "renaissance-pet-portrait", src: "/examples/renaissance.png" },
              { name: "Line Art", tagline: "Clean & modern", slug: "line-art-pet-portrait", src: "/examples/lineart.png" },
            ].map((s) => (
              <Link
                key={s.name}
                href={`/styles/${s.slug}`}
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] shadow-sm ring-1 ring-gray-100 block"
              >
                <Image
                  src={s.src}
                  alt={`${s.name} pet portrait example`}
                  fill
                  sizes="(max-width: 640px) 45vw, 22vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/55 to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-left text-white">
                  <p className="font-display font-bold text-xl leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">{s.name}</p>
                  <p className="text-sm mt-0.5 opacity-95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">{s.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 bg-cream border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-10 text-center">
            Common questions
          </h2>
          <div className="space-y-6">
            {FAQS.map((f) => (
              <div key={f.q}>
                <h3 className="font-display text-lg font-semibold text-gray-800 mb-2">{f.q}</h3>
                <p className="text-gray-600 leading-relaxed text-[15px]">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooterCTA
        headline="Ready when you are."
        subhead="Preview free in 30 seconds. No signup. No credit card. If you don't love it, you don't pay."
        ctaLabel="Try It Free"
      />
    </main>
  );
}
