import { NextResponse } from "next/server";

// Google Merchant Center product feed for free Google Shopping tab listings
// + paid Performance Max / Shopping ads.
//
// One Shopping product per style × per-SKU combo would give ~25 entries,
// but Google's algorithm prefers fewer, well-categorized listings over many
// thin ones. We surface 8 flagship products: 4 styles × 2 tiers (Digital +
// Framed Print). Each links to /start?style={key} for the zero-
// scroll buying experience — same page Pinterest funnels into.
//
// Submit at: https://merchants.google.com → Products → Feeds → Add primary
// feed → "Scheduled fetch" → URL = https://pawmasterpiece.com/api/feed/
// google-shopping.xml → daily fetch frequency.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

// Google Product Category: "Home & Garden > Decor > Artwork > Posters,
// Prints, & Visual Artwork" — taxonomy ID 500050. Used as a fallback;
// Google auto-categorizes from title + description if this is missing.
const GOOGLE_PRODUCT_CATEGORY = "500050";

interface FeedProduct {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  price: string; // e.g. "79.00 USD"
  availability: "in_stock" | "out_of_stock" | "preorder";
  condition: "new";
  brand: string;
  mpn: string;
  productType: string;
  customLabel0?: string; // segmentation label for Performance Max
}

function buildProducts(): FeedProduct[] {
  const styles = [
    {
      key: "watercolor",
      name: "Watercolor",
      image: "/examples/watercolor.png",
      blurb:
        "Soft, hand-painted watercolor portrait of your pet — gentle washes, paper texture, gallery-quality. Made from your photo in 30 seconds, preview free before buying.",
    },
    {
      key: "oil",
      name: "Oil Painting",
      image: "/examples/oil.png",
      blurb:
        "Classical oil painting portrait of your pet — rich impasto brushwork, museum-quality finish. Made from your photo, preview free before buying.",
    },
    {
      key: "renaissance",
      name: "Renaissance",
      image: "/examples/renaissance.png",
      blurb:
        "Renaissance-style royal pet portrait — your pet in ornate Tudor robes and gold-trimmed regalia, rendered in 17th-century oil painting style.",
    },
    {
      key: "lineart",
      name: "Line Art",
      image: "/examples/lineart.png",
      blurb:
        "Minimalist line art portrait of your pet — continuous-line drawing technique, clean modern aesthetic. Perfect for contemporary interiors.",
    },
  ];

  const products: FeedProduct[] = [];
  for (const s of styles) {
    // Tier 1: Framed print (flagship physical product)
    products.push({
      id: `${s.key}-framed-print-8x10`,
      title: `Custom ${s.name} Pet Portrait — Framed Print 8×10`,
      description: `${s.blurb} Framed print, 8×10, ships in 3-5 business days inside the US. Love-it-or-redo-it guarantee. Includes the full-resolution digital file at no extra charge.`,
      link: `${BASE_URL}/start?style=${s.key}&utm_source=google_shopping&utm_medium=cpc`,
      imageLink: `${BASE_URL}${s.image}`,
      price: "79.00 USD",
      availability: "in_stock",
      condition: "new",
      brand: "Paw Masterpiece",
      mpn: `PM-${s.key.toUpperCase()}-FRAMED-PRINT-8X10`,
      productType: "Home & Garden > Decor > Artwork > Pet Portraits",
      customLabel0: "framed-print",
    });

    // Tier 2: Digital download (impulse-priced for cold buyers)
    products.push({
      id: `${s.key}-digital-download`,
      title: `Custom ${s.name} Pet Portrait — Digital Download`,
      description: `${s.blurb} Full-resolution digital file, delivered by email in about 30 seconds. Print at home or any photo lab. Same artwork as our framed print, no shipping wait.`,
      link: `${BASE_URL}/start?style=${s.key}&utm_source=google_shopping&utm_medium=cpc`,
      imageLink: `${BASE_URL}${s.image}`,
      price: "6.00 USD",
      availability: "in_stock",
      condition: "new",
      brand: "Paw Masterpiece",
      mpn: `PM-${s.key.toUpperCase()}-DIGITAL`,
      productType: "Home & Garden > Decor > Artwork > Pet Portraits",
      customLabel0: "digital",
    });
  }

  return products;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderItem(p: FeedProduct): string {
  return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <title>${escapeXml(p.title)}</title>
      <description>${escapeXml(p.description)}</description>
      <link>${escapeXml(p.link)}</link>
      <g:image_link>${escapeXml(p.imageLink)}</g:image_link>
      <g:availability>${p.availability}</g:availability>
      <g:price>${escapeXml(p.price)}</g:price>
      <g:condition>${p.condition}</g:condition>
      <g:brand>${escapeXml(p.brand)}</g:brand>
      <g:mpn>${escapeXml(p.mpn)}</g:mpn>
      <g:identifier_exists>FALSE</g:identifier_exists>
      <g:google_product_category>${GOOGLE_PRODUCT_CATEGORY}</g:google_product_category>
      <g:product_type>${escapeXml(p.productType)}</g:product_type>
      <g:custom_label_0>${escapeXml(p.customLabel0 || "")}</g:custom_label_0>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 USD</g:price>
      </g:shipping>
    </item>`;
}

export async function GET() {
  const products = buildProducts();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Paw Masterpiece</title>
    <link>${BASE_URL}</link>
    <description>Custom pet portrait art studio. Watercolor, oil painting, Renaissance, and line art portraits made from your pet's photo. Digital downloads from $6 and framed prints from $79, shipping inside the United States.</description>
${products.map(renderItem).join("\n")}
  </channel>
</rss>
`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Google fetches once a day; cache at the edge for 6h is fine, the
      // product set rarely changes. Force revalidation via ?nocache=1 in
      // dev if needed.
      "Cache-Control": "public, max-age=21600, s-maxage=21600",
    },
  });
}
