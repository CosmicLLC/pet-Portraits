import { ImageResponse } from "next/og";
import { styleBySlug } from "@/lib/seo-data";

// Per-style OG card. Same brand template as the blog OG cards — left column
// holds title/eyebrow/brand mark, right column shows the sample portrait so
// the share preview reads as a real product card on social.

export const runtime = "edge";
export const alt = "Pet portrait style example";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: { slug: string };
}

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

export default async function OgImage({ params }: Props) {
  const style = styleBySlug(params.slug);
  const title = style ? `${style.fullName} from Photo` : "Custom Pet Portraits";
  const eyebrow = style ? `Custom ${style.shortName} Pet Portraits` : "Custom Pet Portraits";
  const sample = style?.image || "/examples/watercolor.png";

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
              {eyebrow}
            </div>
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: green,
                lineHeight: 1.05,
                letterSpacing: -1.5,
                maxWidth: 540,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 22,
                color: "#444",
                lineHeight: 1.4,
                maxWidth: 540,
              }}
            >
              30-second preview. Free to try. Framed canvas ships 3-5 days.
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

        <div
          style={{
            width: 460,
            display: "flex",
            background: "#fff",
            borderLeft: `1px solid #eee`,
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
