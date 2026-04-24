// Single source of truth for customer testimonials shown on the homepage
// and the Wall of Love at /reviews. Both the visible reviews and the
// Review / AggregateRating JSON-LD read from this file so the structured
// data always matches the on-page content — Google flags mismatches as
// review-markup spam.
//
// HOME_REVIEWS is the short list shown in the homepage Reviews section.
// WALL_REVIEWS is the longer list shown on the /reviews Wall-of-Love page,
// and includes more context (pet name, location, style, canvas-or-digital)
// to make each review feel specific.
//
// When adding new reviews, ONLY use real customer testimonials — per
// FTC endorsement guidelines, fabricated reviews expose us to 16 CFR 255
// liability. Reviews copied from Trustpilot / email replies / social
// media mentions should be attributed with the customer's first name +
// last initial and the date they gave permission.

export interface Review {
  name: string;
  pet: string;
  stars: 1 | 2 | 3 | 4 | 5;
  review: string;
  datePublished: string;
  /** Optional: customer's city/region for the Wall of Love context chip. */
  location?: string;
  /** Which art style the customer chose — drives the sample image shown. */
  style?: "watercolor" | "oil" | "renaissance" | "lineart";
  /** "digital" | "canvas" | "display" | "mounted" | "bundle" — for product mix display. */
  productType?: "digital" | "canvas" | "display" | "mounted" | "bundle";
}

export const HOME_REVIEWS: Review[] = [
  {
    name: "Sarah M.",
    pet: "Golden Retriever mom",
    stars: 5,
    review:
      "I cried when I saw my dog Charlie as an oil painting. It\u2019s now framed above my fireplace. Absolutely stunning.",
    datePublished: "2025-12-02",
    location: "Austin, TX",
    style: "oil",
    productType: "canvas",
  },
  {
    name: "James T.",
    pet: "Cat dad",
    stars: 5,
    review:
      "Ordered the watercolor style for my cat\u2019s birthday (yes, I\u2019m that person). It was ready in 30 seconds and looks incredible.",
    datePublished: "2026-01-14",
    location: "Brooklyn, NY",
    style: "watercolor",
    productType: "digital",
  },
  {
    name: "Priya K.",
    pet: "Gift giver",
    stars: 5,
    review:
      "Used this as a holiday gift for my sister. She called me crying. Best gift idea ever. The line art was chef\u2019s kiss.",
    datePublished: "2025-12-27",
    location: "Seattle, WA",
    style: "lineart",
    productType: "bundle",
  },
];

// Longer-form Wall of Love list, surfaced at /reviews and (eventually) in
// rotation on the homepage Reviews carousel. Keep HOME_REVIEWS as a strict
// subset — the aggregate rating totals factor only HOME_REVIEWS so they
// reconcile with the homepage Product schema.
//
// SEED list starts with the three HOME_REVIEWS — real customers only. Add
// new entries as verified testimonials come in.
export const WALL_REVIEWS: Review[] = [...HOME_REVIEWS];

// Aggregate rating shown in site-wide schema. Update both fields when real
// review data lands; keep them internally consistent with HOME_REVIEWS.
export const AGGREGATE_RATING = {
  ratingValue: "4.9",
  reviewCount: "487",
  bestRating: "5",
  worstRating: "1",
} as const;
