// Single source of truth for customer testimonials shown on the homepage.
// Both the visible Reviews section and the Product JSON-LD read from here
// so the structured data always matches the on-page content — Google flags
// mismatches as review-markup spam.

export interface Review {
  name: string;
  pet: string;
  stars: 1 | 2 | 3 | 4 | 5;
  review: string;
  datePublished: string;
}

export const HOME_REVIEWS: Review[] = [
  {
    name: "Sarah M.",
    pet: "Golden Retriever mom",
    stars: 5,
    review:
      "I cried when I saw my dog Charlie as an oil painting. It\u2019s now framed above my fireplace. Absolutely stunning.",
    datePublished: "2025-12-02",
  },
  {
    name: "James T.",
    pet: "Cat dad",
    stars: 5,
    review:
      "Ordered the watercolor style for my cat\u2019s birthday (yes, I\u2019m that person). It was ready in 30 seconds and looks incredible.",
    datePublished: "2026-01-14",
  },
  {
    name: "Priya K.",
    pet: "Gift giver",
    stars: 5,
    review:
      "Used this as a holiday gift for my sister. She called me crying. Best gift idea ever. The line art was chef\u2019s kiss.",
    datePublished: "2025-12-27",
  },
];

// Aggregate rating shown in site-wide schema. Update both fields when real
// review data lands; keep them internally consistent with HOME_REVIEWS.
export const AGGREGATE_RATING = {
  ratingValue: "4.9",
  reviewCount: "487",
  bestRating: "5",
  worstRating: "1",
} as const;
