// Product catalog. Each entry is one SKU we can sell. Physical products
// (anything that ships) flow through Prodigi. Non-physical products
// (digital, wallpaper, multi-pet upgrade) skip shipping collection.
//
// To light up a new product: set its Stripe price ID env var (and Prodigi
// SKU env var for physicals). ProductSelector auto-hides anything whose
// Stripe price ID is missing — so you can scaffold + release one at a
// time without editing this file.

export const PRODUCTS = {
  digital: {
    label: "Digital Download",
    price: "$6",
    description: "Full-res PNG, instant email delivery",
  },
  wallpaper: {
    label: "Phone Wallpaper",
    price: "$0.99",
    description: "Optimized for mobile screens",
  },
  display: {
    label: "Display Print 11×14",
    price: "$15.99",
    description: "Fine art print on backing board, bagged ready to frame",
  },
  mounted: {
    label: "Mounted Print 11×14",
    price: "$33",
    description: "Gallery-matted fine art print — window mount + backing",
  },
  // Flagship framed line. Three sizes; each also sold unframed as a poster
  // (poster_* keys below). NOTE: key is historically "canvas" — it now backs
  // the 8×10 *framed print*, kept as-is so the bundle, post-purchase upsell,
  // and live Stripe price (STRIPE_CANVAS_PRICE_ID) keep working untouched.
  canvas: {
    label: "Framed Print 8×10",
    price: "$79",
    description: "Framed fine-art print, ready to hang — shipped to your door",
  },
  framed_12x16: {
    label: "Framed Print 12×16",
    price: "$99",
    description: "Larger framed fine-art print, 12×16 — ready to hang",
  },
  framed_18x24: {
    label: "Framed Print 18×24",
    price: "$149",
    description: "Statement-size framed fine-art print, 18×24 — above the mantel",
  },
  // Same three prints, sold unframed (poster only).
  poster_8x10: {
    label: "Poster 8×10",
    price: "$45",
    description: "Unframed fine-art poster print, 8×10",
  },
  poster_12x16: {
    label: "Poster 12×16",
    price: "$54",
    description: "Unframed fine-art poster print, 12×16",
  },
  poster_18x24: {
    label: "Poster 18×24",
    price: "$67",
    description: "Unframed fine-art poster print, 18×24",
  },
  bundle: {
    label: "Complete Bundle",
    price: "$79",
    originalPrice: "$85",
    description: "Framed print + digital download free",
  },
  // Non-physical add-on for portraits with 2+ pets composed into one
  // piece. Extra prompt/attention surcharge; no separate fulfillment.
  multipet: {
    label: "Multi-Pet Upgrade",
    price: "$20",
    description: "Include 2+ pets in one portrait — composed together",
  },
  // Four-style gallery set: same pet, all four styles as 11×14 prints,
  // shipped as a bundle. Christmas flagship.
  gallery_set: {
    label: "Gallery Set — 4 Styles",
    price: "$99",
    description: "One pet, all four styles, shipped as a 4-print gallery set",
  },
  // Modern premium tier — Prodigi ACR-* family. Flat photographic acrylic.
  acrylic: {
    label: "Acrylic Print 11×14",
    price: "$149",
    description: "Vibrant photo acrylic print — premium gallery finish",
  },
  // Aluminum metal print — durable, modern, kitchen/office aesthetic.
  metal: {
    label: "Metal Print 11×14",
    price: "$129",
    description: "Aluminum metal print — modern, durable, indoor/outdoor",
  },
  // Greeting cards — 10-pack with the portrait printed on the front.
  // Bulk Christmas-card mailing play.
  cards: {
    label: "Greeting Cards (10-pack)",
    price: "$24",
    description: "10 premium greeting cards with your portrait + envelopes",
  },
  // iPhone case with the portrait printed on the back.
  phone_case: {
    label: "Phone Case",
    price: "$34",
    description: "Custom iPhone case with your portrait — protective & slim",
  },
  // Acrylic prism / photo block — standalone desktop piece.
  prism: {
    label: "Acrylic Prism",
    price: "$69",
    description: "Acrylic photo block — desk-sized standalone piece",
  },
  // Ceramic mug with the portrait wrapped around.
  mug: {
    label: "Mug",
    price: "$24",
    description: "11oz ceramic mug with your portrait — dishwasher safe",
  },
  // Square throw pillow with the portrait.
  pillow: {
    label: "Pillow",
    price: "$39",
    description: "18×18 square throw pillow with your portrait, includes insert",
  },
  // ──────────────────────────────────────────────────────────────────
} as const;

export type ProductType = keyof typeof PRODUCTS;

// Physical products shipped via Prodigi (require a US shipping address).
// Anything with a physical fulfillment goes here. Digital, wallpaper, and
// multipet skip the shipping collection step at checkout.
const PHYSICAL_PRODUCT_TYPES = new Set<string>([
  "display",
  "mounted",
  "canvas",
  "framed_12x16",
  "framed_18x24",
  "poster_8x10",
  "poster_12x16",
  "poster_18x24",
  "bundle",
  "gallery_set",
  "acrylic",
  "metal",
  "cards",
  "phone_case",
  "prism",
  "mug",
  "pillow",
  // Post-purchase upsell: a discounted 8×10 framed print (its own Stripe
  // price ID, defaults to the canvas price). MUST be physical — otherwise
  // checkout skips shipping collection and the webhook never prints it, so
  // the customer pays ~$59 and gets nothing. Fulfilled identically to canvas.
  "canvas_upsell",
]);

export function isPhysicalProduct(type: string): boolean {
  return PHYSICAL_PRODUCT_TYPES.has(type);
}

// Server-safe price lookup in cents, parsed from the catalog price string.
// Used by the checkout route to compute the merchandise subtotal for the
// free-shipping threshold. Returns 0 for unknown keys (e.g. canvas_upsell,
// which prices via its own Stripe price ID, not this catalog).
export function productPriceCents(type: string): number {
  const price = (PRODUCTS as Record<string, { price?: string }>)[type]?.price;
  if (!price) return 0;
  const n = parseFloat(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
