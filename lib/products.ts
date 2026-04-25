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
    price: "$5",
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
  canvas: {
    label: "Framed Canvas Print 8×12",
    price: "$79",
    description: "Gallery-quality framed canvas, shipped to your door",
  },
  bundle: {
    label: "Complete Bundle",
    price: "$89",
    originalPrice: "$98",
    description: "Digital download + framed canvas print",
  },
  // ─── 2026-04-24 expansion ─────────────────────────────────────────
  // Higher-AOV canvas tier for statement-piece buyers. Same Prodigi
  // fulfillment pattern as the 8×12 with a different SKU.
  canvas_16x20: {
    label: "Framed Canvas 16×20",
    price: "$149",
    description: "Statement-piece framed canvas, 16×20 — above the mantel",
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
  "bundle",
  "canvas_16x20",
  "gallery_set",
  "acrylic",
  "metal",
  "cards",
  "phone_case",
  "prism",
  "mug",
  "pillow",
]);

export function isPhysicalProduct(type: string): boolean {
  return PHYSICAL_PRODUCT_TYPES.has(type);
}
