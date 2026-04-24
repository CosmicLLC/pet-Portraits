import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import LandingHeader from "@/components/LandingHeader";
import { AGGREGATE_RATING } from "@/lib/reviews";

// Tone discipline: memorial customers are grieving. Ad copy elsewhere uses
// "loved," "honor," "keep them close" — never "death," "lost," "passed."
// Copy on this page follows the same rules. No countdown timer, no discount
// stack, no urgency — just reassurance and a soft path forward.

const PAGE_TITLE = "Pet Memorial Portraits from Photo — Honor Their Memory";
const PAGE_DESCRIPTION =
  "A gentle way to keep your pet close. Turn any photo — recent, old, or from your phone — into a hand-finished memorial portrait. Unlimited revisions. No rush. No risk.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/memorial" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: "/memorial",
    images: [
      { url: "/examples/watercolor.png", width: 900, height: 1200, alt: "Pet memorial watercolor portrait example" },
    ],
  },
};

const MEMORIAL_FAQS = [
  {
    q: "What if my only photo isn't very good?",
    a: "That's the most common photo we see. A blurry phone picture, a photo with other people in it, an older photo from before everything went digital — our artists work with whatever you have. If we think a different photo would turn out better, we'll tell you gently. If not, we'll do everything possible with the photo that matters most to you.",
  },
  {
    q: "Can I include more than one pet in the portrait?",
    a: "Yes. Many families commission portraits that include every pet they've loved, even if the photos were taken years apart. Upload one photo of each pet and we'll compose them together in a single piece.",
  },
  {
    q: "I'm gifting this to someone who's grieving. How should I handle it?",
    a: "We recommend including a handwritten note with the delivery — we'll leave the shipment unbranded if you ask. Many gifters tell the recipient in person when the portrait arrives, or place it somewhere meaningful and let it speak for itself. There's no wrong way.",
  },
  {
    q: "What style tends to suit memorial portraits best?",
    a: "Most memorial customers choose watercolor or oil painting — both styles feel timeless and soft, which tends to feel right for a keepsake. That said, if your pet had a playful personality, the renaissance or line art styles can be a beautiful way to celebrate who they were. Preview all four free before you commit.",
  },
  {
    q: "How long do I have? Is there any pressure?",
    a: "None. Your portrait preview never expires in a way that costs you anything — you can start, come back in a week, a month, a year, whenever you're ready. We do not run countdown timers or fake-scarcity discounts on memorial orders.",
  },
  {
    q: "What if the first version doesn't feel right?",
    a: "We offer unlimited revisions and a 100% satisfaction guarantee. If the portrait doesn't capture the pet you remember, we redo it — no questions, no extra cost, no time limit.",
  },
  {
    q: "Can I order a physical keepsake, not just a digital file?",
    a: "Yes. We offer gallery-quality framed canvas prints (8×12), fine art display prints (11×14), and mounted gallery prints (11×14), all printed in the United States. Many families order two — one for their home and one for another family member.",
  },
];

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Pet Memorial Portrait",
  description:
    "A hand-finished memorial portrait of your pet from any photo. Watercolor, oil painting, Renaissance, or line art. Unlimited revisions, 100% satisfaction guarantee.",
  brand: { "@type": "Brand", name: "Paw Masterpiece" },
  image: [
    `${BASE_URL}/examples/watercolor.png`,
    `${BASE_URL}/examples/oil.png`,
  ],
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "19.00",
    highPrice: "89.00",
    offerCount: "5",
    availability: "https://schema.org/InStock",
    url: `${BASE_URL}/memorial`,
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
  mainEntity: MEMORIAL_FAQS.map((f) => ({
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
    { "@type": "ListItem", position: 2, name: "Memorial Portraits", item: `${BASE_URL}/memorial` },
  ],
};

export default function MemorialPage() {
  return (
    <main className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <LandingHeader />

      {/* Hero — softer than the main home hero. No countdown, no "Buy Now." */}
      <section className="relative bg-cream border-b border-gray-100 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-4">
              Pet Memorial Portraits
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] text-brand-green leading-[1.15] mb-6">
              A gentle way to keep them close.
            </h1>
            <p className="text-gray-700 text-lg sm:text-xl max-w-xl md:mx-0 mx-auto mb-3 leading-relaxed">
              Turn any photo — recent, old, or from your phone — into a hand-finished portrait that honors who they were.
            </p>
            <p className="text-gray-500 text-base max-w-xl md:mx-0 mx-auto mb-8 leading-relaxed">
              Unlimited revisions. No time limit. If it isn&apos;t right, we redo it for free.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-3 bg-brand-green text-cream px-8 py-4 rounded-full text-base font-display font-semibold shadow-[0_12px_30px_-10px_rgba(45,74,62,0.45)] hover:bg-brand-green/90 hover:shadow-[0_18px_38px_-12px_rgba(45,74,62,0.55)] hover:-translate-y-0.5 transition-all"
            >
              Begin Your Portrait
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <p className="text-gray-400 text-sm mt-6">
              Free to preview. No account required. Take as long as you need.
            </p>
          </div>
          <div className="relative aspect-[3/4] max-w-md w-full mx-auto rounded-3xl overflow-hidden shadow-[0_30px_60px_-25px_rgba(45,74,62,0.3)] ring-1 ring-gray-100 bg-white">
            <Image
              src="/examples/watercolor.png"
              alt="Watercolor pet memorial portrait example"
              fill
              priority
              sizes="(max-width: 768px) 90vw, 420px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Reassurance block — addresses the top objections memorial customers
          have, without asking them to think about money or deadlines. */}
      <section className="py-16 sm:py-20 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 space-y-10">
          <div>
            <h2 className="font-display text-3xl text-brand-green mb-4">
              Any photo is the right photo.
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              An old printed photo you scanned on your phone. A blurry snapshot from last year. A picture with other people or other pets in it. Whatever photo matters to you is the right one to send — our artists work around lighting, angle, and clarity to bring out the pet you remember. If we think another photo would serve better, we&apos;ll say so gently. If not, we&apos;ll do everything possible with the one you chose.
            </p>
          </div>

          <div>
            <h2 className="font-display text-3xl text-brand-green mb-4">
              Preview free. Purchase when you&apos;re ready.
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              Start your portrait whenever you want — today, next week, next month. There&apos;s no countdown, no lapse, nothing that disappears. You&apos;ll see a preview in about 30 seconds and you can leave the page and come back to finish later. When you purchase, the full-resolution file is yours forever.
            </p>
          </div>

          <div>
            <h2 className="font-display text-3xl text-brand-green mb-4">
              Unlimited revisions. Always.
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              If the portrait doesn&apos;t feel like them, reply to the confirmation email and we&apos;ll redo it. There&apos;s no revision count and no clock. Most families find the first version is right; some need two or three. Either way, the guarantee doesn&apos;t expire.
            </p>
          </div>
        </div>
      </section>

      {/* Style guidance — tells grieving customers which styles tend to
          feel right without dictating. No hard upsell. */}
      <section className="py-16 sm:py-20 bg-cream border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-3">
              Choose the style that feels right
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Watercolor and oil painting tend to suit memorial portraits best — both styles feel soft and timeless. Renaissance works beautifully for pets with big personalities. Line art is clean and minimalist. Preview all four free.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { name: "Watercolor", tag: "Soft & dreamy", src: "/examples/watercolor.png", note: "Most requested" },
              { name: "Oil Painting", tag: "Rich & timeless", src: "/examples/oil.png", note: "Gallery-style" },
              { name: "Renaissance", tag: "Regal & playful", src: "/examples/renaissance.png", note: "Big personality" },
              { name: "Line Art", tag: "Clean & modern", src: "/examples/lineart.png", note: "Minimalist" },
            ].map((s) => (
              <div
                key={s.name}
                className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-sm ring-1 ring-gray-100"
              >
                <Image
                  src={s.src}
                  alt={`${s.name} memorial pet portrait example`}
                  fill
                  sizes="(max-width: 640px) 45vw, 22vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="font-display font-bold text-lg drop-shadow">{s.name}</p>
                  <p className="text-[11px] opacity-90">{s.tag}</p>
                  <p className="text-[10px] uppercase tracking-widest text-brand-gold mt-1">{s.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process — three steps, framed around care rather than speed. */}
      <section className="py-16 sm:py-20 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-3">How it works</h2>
            <p className="text-gray-500">Three simple steps. Take as much time as you need.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                title: "Upload any photo",
                desc: "Phone picture, old scan, or a snapshot with people in it. Whatever photo matters to you.",
              },
              {
                title: "Preview four styles free",
                desc: "See your portrait in about 30 seconds. Come back later if you need to.",
              },
              {
                title: "Receive your keepsake",
                desc: "Instant digital download, or a framed canvas or gallery print shipped to your home.",
              },
            ].map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-brand-green/10 flex items-center justify-center font-display text-base font-semibold text-brand-green">
                  {i + 1}
                </div>
                <h3 className="font-display text-lg text-brand-green mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar — uses aggregate rating (real) without specific testimonials
          that would feel exploitative on a memorial page. */}
      <section className="py-12 bg-cream border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-5 h-5 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="font-display text-lg text-brand-green">
            {AGGREGATE_RATING.ratingValue} out of 5 · {AGGREGATE_RATING.reviewCount} reviews
          </p>
          <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto leading-relaxed">
            Thousands of families have used Paw Masterpiece to honor a pet they loved. Every portrait comes with our no-time-limit satisfaction guarantee.
          </p>
        </div>
      </section>

      {/* FAQ — memorial-specific. Renders the same content that's in the
          FAQPage JSON-LD so Google's structured data checker passes. */}
      <section className="py-16 sm:py-20 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-10 text-center">
            Common questions
          </h2>
          <div className="space-y-6">
            {MEMORIAL_FAQS.map((f) => (
              <div key={f.q}>
                <h3 className="font-display text-lg font-semibold text-gray-800 mb-2">{f.q}</h3>
                <p className="text-gray-600 leading-relaxed text-[15px]">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Soft closing CTA — gentler than the generic LandingFooterCTA. */}
      <section className="bg-brand-green text-cream py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl sm:text-4xl mb-4">
            When you&apos;re ready, we&apos;re here.
          </h2>
          <p className="text-cream/80 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Start your portrait whenever the time feels right. Preview free in about 30 seconds. If it isn&apos;t right, we redo it for free — always.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-3 bg-cream text-brand-green px-8 py-4 rounded-full text-base font-display font-semibold hover:bg-white hover:-translate-y-0.5 transition-all shadow-xl"
          >
            Begin Your Portrait
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="text-cream/60 text-xs mt-6">
            100% satisfaction guarantee · Unlimited revisions · No time limit · Ships to the United States
          </p>
        </div>
      </section>
    </main>
  );
}
