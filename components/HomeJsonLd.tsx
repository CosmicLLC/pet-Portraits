// JSON-LD structured data for the homepage. Gives Google rich-result
// eligibility for Product, AggregateRating, and FAQPage. Kept in a
// dedicated component so it's easy to swap review counts / FAQ entries
// without touching the rest of page.tsx.

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Custom AI Pet Portrait",
  description:
    "A custom fine art portrait of your pet, generated from any photo. Choose watercolor, oil painting, Renaissance, or line art. Instant digital download or shipped as a framed canvas.",
  brand: { "@type": "Brand", name: "Paw Masterpiece" },
  image: [
    `${BASE_URL}/examples/watercolor.png`,
    `${BASE_URL}/examples/oil.png`,
    `${BASE_URL}/examples/renaissance.png`,
    `${BASE_URL}/examples/lineart.png`,
  ],
  offers: [
    {
      "@type": "Offer",
      name: "Digital Download",
      price: "19.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: BASE_URL,
    },
    {
      "@type": "Offer",
      name: "Display Print 11x14",
      price: "15.99",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: BASE_URL,
    },
    {
      "@type": "Offer",
      name: "Mounted Print 11x14",
      price: "33.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: BASE_URL,
    },
    {
      "@type": "Offer",
      name: "Framed Canvas 8x12",
      price: "79.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: BASE_URL,
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "487",
    bestRating: "5",
    worstRating: "1",
  },
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How long does it take to create a pet portrait?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "About 30 seconds. Our AI generates your custom portrait in four artistic styles while you wait — no signup required to preview.",
      },
    },
    {
      "@type": "Question",
      name: "What photo works best for a pet portrait?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A clear, well-lit photo with your pet's face visible works best. Natural daylight, head-and-shoulders framing, and a relatively clean background give the best results. The AI can work with casual snapshots — you don't need a professional photo.",
      },
    },
    {
      "@type": "Question",
      name: "Can I order a canvas or framed print?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. After generating your portrait, you can order an 11x14 display print, an 11x14 mounted print, or an 8x12 framed canvas — all printed and shipped within the United States in 3–5 business days.",
      },
    },
    {
      "@type": "Question",
      name: "What art styles are available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Four styles: watercolor (soft and dreamy), oil painting (rich and classical), Renaissance (royal and regal with robes and gold), and line art (clean and minimalist).",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer refunds if I don't like my portrait?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — we offer a 100% satisfaction guarantee. If you're not happy with your portrait, reply to the confirmation email within 7 days and we'll redo it for free or refund you in full.",
      },
    },
    {
      "@type": "Question",
      name: "Can I create a pet memorial portrait?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Many of our customers use Paw Masterpiece to create heartfelt memorial portraits. Any photo of your pet — no matter how old — can be turned into a lasting piece of art.",
      },
    },
  ],
}

export default function HomeJsonLd() {
  return (
    <>
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
    </>
  )
}
