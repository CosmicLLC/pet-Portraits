import type { ProductType } from "./products"

// Per-product presentation metadata. Each entry maps a SKU (key in
// lib/products.ts) to a hero image, long-form description, highlights,
// and a marketing category. Consumed by:
//   - app/products/page.tsx        (catalog overview)
//   - app/products/[slug]/page.tsx (individual product detail page)

export type ProductCategory =
  | "Digital"
  | "Prints & Canvas"
  | "Home & Lifestyle"
  | "Gifts"
  | "Add-ons"

export interface Presentation {
  key: ProductType
  image: string
  /** Set true when the image is a stylized portrait stand-in (no real
   * product photography yet). The catalog shows a "Product photo coming
   * soon" badge over these tiles so the placeholder isn't misleading. */
  isPlaceholder: boolean
  longDescription: string
  highlights: string[]
  category: ProductCategory
  /** Optional per-style product photos — e.g. the mounted print shown in each
   * art style. Rendered as a labeled thumbnail row beneath the hero image. */
  styleGallery?: { src: string; label: string }[]
}

// The 4 art-style example images, reused as per-style product photos.
const STYLE_GALLERY: { src: string; label: string }[] = [
  { src: "/examples/watercolor.png", label: "Watercolor" },
  { src: "/examples/oil.png", label: "Oil Painting" },
  { src: "/examples/renaissance.png", label: "Renaissance" },
  { src: "/examples/lineart.png", label: "Line Art" },
]

export const PRODUCT_PRESENTATION: Presentation[] = [
  // ── Digital ───────────────────────────────────────────────────────
  {
    key: "digital",
    image: "/examples/watercolor.png",
    isPlaceholder: false,
    category: "Digital",
    longDescription:
      "Full-resolution PNG emailed to you in 30 seconds. Print at any size, at any shop. Yours forever.",
    highlights: ["Instant email delivery", "Lifetime access", "Print-ready 300 DPI"],
  },
  {
    key: "wallpaper",
    image: "/examples/oil.png",
    isPlaceholder: true,
    category: "Digital",
    longDescription:
      "1290×2796 px — sized for iPhone lock screens. Download and long-press to set as wallpaper.",
    highlights: ["iPhone-optimized", "Instant download", "Gradient-ready for lock screen UI"],
  },
  // ── Prints & Canvas ───────────────────────────────────────────────
  {
    key: "display",
    image: "/examples/renaissance.png",
    isPlaceholder: true,
    category: "Prints & Canvas",
    longDescription:
      "11×14 fine-art print on cotton paper, backed with rigid board, shipped in a protective sleeve. Ready to slide into any standard 11×14 frame.",
    highlights: ["Fine art paper", "Rigid backing board", "US shipping 3–5 days"],
  },
  {
    key: "mounted",
    image: "/examples/watercolor.png",
    isPlaceholder: true,
    category: "Prints & Canvas",
    longDescription:
      "11×14 print with a window-matted gallery mount — no frame needed, ready to display or drop into any standard frame for a layered look. Available in all four art styles.",
    highlights: ["Gallery-matted finish", "Fine art paper", "Rigid backing"],
    styleGallery: STYLE_GALLERY,
  },
  {
    key: "canvas",
    image: "/examples/watercolor.png",
    isPlaceholder: true,
    category: "Prints & Canvas",
    longDescription:
      "8×12 framed canvas print. Gallery-quality canvas wrapped on a solid wood stretcher, finished in a premium black frame. Ready to hang.",
    highlights: ["Premium black frame", "8×12 framed canvas", "Ships in 3–5 days"],
  },
  {
    key: "canvas_16x20",
    image: "/examples/oil.png",
    isPlaceholder: true,
    category: "Prints & Canvas",
    longDescription:
      "The statement piece. 16×20 framed canvas, proportioned for above-the-mantel display. Gallery-quality print, premium frame, ships fully assembled.",
    highlights: ["Statement size", "16×20 framed canvas", "Above-the-mantel ready"],
  },
  {
    key: "acrylic",
    image: "/examples/renaissance.png",
    isPlaceholder: true,
    category: "Prints & Canvas",
    longDescription:
      "11×14 photographic acrylic print — vibrant colors pop through the clear acrylic face, with a premium gallery finish. Minimalist, modern, durable.",
    highlights: ["Crystal-clear acrylic", "Deep color saturation", "Gallery finish"],
  },
  {
    key: "metal",
    image: "/examples/lineart.png",
    isPlaceholder: true,
    category: "Prints & Canvas",
    longDescription:
      "11×14 aluminum metal print. Modern aesthetic, durable finish, indoor or covered-outdoor safe. Feels premium, weighs almost nothing.",
    highlights: ["Aluminum metal", "Indoor/outdoor safe", "Modern finish"],
  },
  // ── Home & Lifestyle ──────────────────────────────────────────────
  {
    key: "prism",
    image: "/examples/watercolor.png",
    isPlaceholder: true,
    category: "Home & Lifestyle",
    longDescription:
      "Standalone acrylic photo block — desk-sized, free-standing, catches light beautifully. Great for a nightstand, bookshelf, or office desk.",
    highlights: ["Free-standing", "Desk-sized", "Premium acrylic"],
  },
  {
    key: "phone_case",
    image: "/examples/oil.png",
    isPlaceholder: true,
    category: "Home & Lifestyle",
    longDescription:
      "Custom iPhone case — your portrait printed on the back, slim snap-fit body, protective but not bulky. Compatible with most recent iPhone models.",
    highlights: ["Printed back", "Slim & protective", "Multiple iPhone sizes"],
  },
  {
    key: "pillow",
    image: "/examples/renaissance.png",
    isPlaceholder: true,
    category: "Home & Lifestyle",
    longDescription:
      "18×18 square throw pillow with your portrait printed on a durable cover. Insert included. Zip-off washable cover for cleanup after pet cuddles.",
    highlights: ["18×18 square", "Insert included", "Washable cover"],
  },
  {
    key: "mug",
    image: "/examples/lineart.png",
    isPlaceholder: true,
    category: "Home & Lifestyle",
    longDescription:
      "11oz ceramic mug with your pet's portrait wrapped around it. Dishwasher and microwave safe. Sturdy, glossy, and ready for daily use.",
    highlights: ["11oz ceramic", "Dishwasher safe", "Full-wrap print"],
  },
  // ── Gifts ─────────────────────────────────────────────────────────
  {
    key: "cards",
    image: "/examples/watercolor.png",
    isPlaceholder: true,
    category: "Gifts",
    longDescription:
      "10-pack of premium greeting cards featuring your pet's portrait on the front. Blank inside. Envelopes included. Perfect for holiday card season.",
    highlights: ["10 cards + envelopes", "Premium cardstock", "Blank inside"],
  },
  {
    key: "bundle",
    image: "/examples/oil.png",
    isPlaceholder: false,
    category: "Gifts",
    longDescription:
      "8×12 framed canvas plus the full-resolution digital file — same price as canvas alone, the digital comes free. Most customers' choice.",
    highlights: ["Canvas + digital", "Best value", "Digital included FREE"],
  },
  // ── Add-ons ───────────────────────────────────────────────────────
  {
    key: "multipet",
    image: "/examples/renaissance.png",
    isPlaceholder: true,
    category: "Add-ons",
    longDescription:
      "Include 2+ pets composed together in a single portrait. Works across all styles and products. Upload a separate photo of each pet.",
    highlights: ["2+ pets in one piece", "Compatible with any style", "Family portrait ready"],
  },
]

export const CATEGORY_ORDER: ProductCategory[] = [
  "Digital",
  "Prints & Canvas",
  "Home & Lifestyle",
  "Gifts",
  "Add-ons",
]

export function presentationBySlug(slug: string): Presentation | undefined {
  return PRODUCT_PRESENTATION.find((p) => p.key === slug)
}

export const PRODUCT_SLUGS: ProductType[] = PRODUCT_PRESENTATION.map((p) => p.key)
