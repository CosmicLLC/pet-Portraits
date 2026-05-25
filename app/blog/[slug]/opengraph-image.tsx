import { ImageResponse } from "next/og";
import { BLOG_POSTS } from "@/lib/blog-posts";

// Dynamic OG card for blog posts. Generated at request time on Vercel's Edge
// runtime — first request after deploy may take ~300ms, subsequent shares
// hit the CDN edge cache. Tech Arion case study cited a ~43% social CTR
// lift from dynamic OG cards vs static fallbacks; this is the cheapest
// per-page conversion lift in the SEO stack.

export const runtime = "edge";
export const alt = "Paw Masterpiece blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: { slug: string };
}

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

export default async function OgImage({ params }: Props) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  const title = post?.title || "Paw Masterpiece";
  const sample = post?.heroImage || "/examples/watercolor.png";

  // Brand palette in inline styles — next/og does not parse Tailwind.
  const cream = "#FAF7F2";
  const green = "#2D4A3E";
  const gold = "#C9A671";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: cream,
          fontFamily: "system-ui",
        }}
      >
        {/* Left — title + brand mark */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 60,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: green,
                color: cream,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              P
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: green,
                letterSpacing: -0.3,
              }}
            >
              Paw Masterpiece
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: gold,
                textTransform: "uppercase",
                letterSpacing: 2.5,
              }}
            >
              From the Blog
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: green,
                lineHeight: 1.08,
                letterSpacing: -1.2,
                maxWidth: 540,
              }}
            >
              {title}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 16,
              color: "#666",
            }}
          >
            <span style={{ color: gold }}>★ 4.9</span>
            <span>·</span>
            <span>487 reviews</span>
            <span>·</span>
            <span>pawmasterpiece.com</span>
          </div>
        </div>

        {/* Right — sample portrait */}
        <div
          style={{
            width: 460,
            display: "flex",
            background: "#fff",
            borderLeft: `1px solid #eee`,
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${BASE_URL}${sample}`}
            alt=""
            width={460}
            height={630}
            style={{ objectFit: "cover", width: 460, height: 630 }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
