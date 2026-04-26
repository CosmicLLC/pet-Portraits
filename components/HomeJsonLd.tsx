// JSON-LD structured data for the homepage. Gives Google rich-result
// eligibility for Product, AggregateRating, Review, and FAQPage. FAQs and
// reviews are pulled from lib/* so the structured data always matches the
// visible on-page content (Google flags mismatches as spam).

import { HOME_FAQS } from "@/lib/faqs";
import { HOME_REVIEWS, AGGREGATE_RATING } from "@/lib/reviews";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Custom Pet Portrait",
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
    ratingValue: AGGREGATE_RATING.ratingValue,
    reviewCount: AGGREGATE_RATING.reviewCount,
    bestRating: AGGREGATE_RATING.bestRating,
    worstRating: AGGREGATE_RATING.worstRating,
  },
  review: HOME_REVIEWS.map((r) => ({
    "@type": "Review",
    author: { "@type": "Person", name: r.name },
    datePublished: r.datePublished,
    reviewBody: r.review,
    reviewRating: {
      "@type": "Rating",
      ratingValue: String(r.stars),
      bestRating: "5",
      worstRating: "1",
    },
  })),
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HOME_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

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
  );
}
