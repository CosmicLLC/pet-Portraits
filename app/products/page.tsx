import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import LandingHeader from "@/components/LandingHeader";
import LandingFooterCTA from "@/components/LandingFooterCTA";
import { PRODUCTS, type ProductType } from "@/lib/products";

const PAGE_TITLE = "All Products — Custom Pet Portraits";
const PAGE_DESCRIPTION =
  "Every way to turn your pet into art — digital download, framed canvas, acrylic prints, gallery sets, phone wallpapers, and more. Starting at $6.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/products" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: "/products",
    images: [{ url: "/examples/watercolor.png", width: 900, height: 1200, alt: "Custom pet portraits" }],
  },
};

// Product presentation data — maps each key in lib/products.ts to a hero
// image, long-form description, and highlights for the products page.
// When the owner adds real product photos, update the `image` field
// here and remove `isPlaceholder: true`.
interface Presentation {
  key: ProductType;
  image: string;
  isPlaceholder: boolean;
  longDescription: string;
  highlights: string[];
  category: "Digital" | "Prints & Canvas" | "Home & Lifestyle" | "Gifts" | "Add-ons";
}

const PRESENTATION: Presentation[] = [
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
    longDescription: "1290×2796 px — sized for iPhone lock screens. Download and long-press to set as wallpaper.",
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
    image: "/examples/lineart.png",
    isPlaceholder: true,
    category: "Prints & Canvas",
    longDescription:
      "11×14 print with a window-matted gallery mount — no frame needed, ready to display or drop into any standard frame for a layered look.",
    highlights: ["Gallery-matted finish", "Fine art paper", "Rigid backing"],
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
];

const CATEGORY_ORDER: Presentation["category"][] = [
  "Digital",
  "Prints & Canvas",
  "Home & Lifestyle",
  "Gifts",
  "Add-ons",
];

export default function ProductsPage() {
  // Group by category so the grid reads as a catalog, not a soup of tiles.
  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: PRESENTATION.filter((p) => p.category === cat),
  })).filter((group) => group.items.length > 0);

  return (
    <main className="min-h-screen bg-cream">
      <LandingHeader />

      {/* Hero */}
      <section className="bg-cream border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-14 sm:py-20 text-center">
          <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-4">
            Everything we make
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-brand-green leading-tight mb-5">
            All products. One portrait.
          </h1>
          <p className="text-gray-700 text-lg max-w-xl mx-auto leading-relaxed">
            Every way to turn your pet into a piece of art — from a $6 digital
            download to a 16×20 framed canvas. Upload once, pick the product
            that fits the moment.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-3 bg-brand-green text-cream px-8 py-4 rounded-full text-base font-display font-semibold hover:bg-brand-green/90 transition-colors"
            >
              Start a Portrait
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Category sections */}
      <div className="max-w-6xl mx-auto px-4 py-14 sm:py-16 space-y-16">
        {byCategory.map(({ category, items }) => (
          <section key={category}>
            <div className="flex items-end justify-between mb-6 sm:mb-8">
              <h2 className="font-display text-2xl sm:text-3xl text-brand-green">{category}</h2>
              <p className="text-xs text-gray-400">{items.length} product{items.length === 1 ? "" : "s"}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((p) => {
                const product = PRODUCTS[p.key];
                if (!product) return null;
                const originalPrice =
                  "originalPrice" in product ? product.originalPrice : undefined;
                return (
                  <article
                    key={p.key}
                    className="bg-white rounded-3xl border border-gray-200 overflow-hidden flex flex-col group hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-[4/3] bg-cream overflow-hidden">
                      <Image
                        src={p.image}
                        alt={product.label}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                      {p.isPlaceholder && (
                        <span className="absolute top-3 left-3 bg-cream/92 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                          Product photo coming soon
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-display text-lg text-brand-green font-semibold mb-1">
                        {product.label}
                      </h3>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="font-display text-xl text-brand-green font-bold">{product.price}</span>
                        {originalPrice && (
                          <span className="text-sm text-gray-400 line-through">{originalPrice}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1">
                        {p.longDescription}
                      </p>
                      <ul className="space-y-1.5 mb-5">
                        {p.highlights.map((h) => (
                          <li key={h} className="flex items-center gap-2 text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5 text-brand-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            {h}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/"
                        className="w-full text-center bg-gray-100 text-brand-green py-2.5 rounded-xl font-display font-semibold text-sm hover:bg-brand-green hover:text-cream transition-colors"
                      >
                        Start a portrait
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <LandingFooterCTA
        headline="Ready to make one?"
        subhead="Upload any photo, pick a style, see your pet rendered in about 30 seconds. Free preview, no signup required."
      />
    </main>
  );
}
