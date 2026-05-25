import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Generates a 1000×1500 Pinterest pin server-side via next/og. Admin-only —
// gated on session.user.role === "admin" so we don't expose a free PNG-
// generation endpoint to the internet. Use from /admin/pinterest-pins.
//
// Why server-side: consistent typography with our existing OG cards, no
// Canvas/font pain on the client, and a fresh PNG download per render.

export const runtime = "nodejs"; // needs the next-auth session lookup
export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

const STYLE_IMAGES: Record<string, string> = {
  watercolor: "/examples/watercolor.png",
  oil: "/examples/oil.png",
  renaissance: "/examples/renaissance.png",
  lineart: "/examples/lineart.png",
};

interface PinSpec {
  title: string;
  /** Eyebrow text — shows above the title in gold caps. */
  eyebrow?: string;
  /** Style key — controls the background sample image. */
  style: keyof typeof STYLE_IMAGES;
  /** Tagline below the title. */
  tagline?: string;
  /** Layout — "overlay" (text over image) or "split" (text top, image bottom). */
  layout?: "overlay" | "split";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const spec: PinSpec = {
    title: sp.get("title") || "Custom Pet Portraits in 30 Seconds",
    eyebrow: sp.get("eyebrow") || "Paw Masterpiece",
    style: (sp.get("style") as PinSpec["style"]) || "watercolor",
    tagline: sp.get("tagline") || "Preview free · Watercolor, Oil, Renaissance, Line Art",
    layout: (sp.get("layout") as PinSpec["layout"]) || "overlay",
  };
  const sampleUrl = `${BASE_URL}${STYLE_IMAGES[spec.style] || STYLE_IMAGES.watercolor}`;

  const cream = "#FAF7F2";
  const green = "#2D4A3E";
  const gold = "#C9A671";

  return new ImageResponse(
    spec.layout === "split" ? (
      <SplitLayout spec={spec} sampleUrl={sampleUrl} cream={cream} green={green} gold={gold} />
    ) : (
      <OverlayLayout spec={spec} sampleUrl={sampleUrl} cream={cream} green={green} gold={gold} />
    ),
    { width: 1000, height: 1500 }
  );
}

function OverlayLayout({
  spec,
  sampleUrl,
  cream,
  green,
  gold,
}: {
  spec: PinSpec;
  sampleUrl: string;
  cream: string;
  green: string;
  gold: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: cream,
      }}
    >
      {/* Full-bleed sample image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sampleUrl}
        alt=""
        width={1000}
        height={1500}
        style={{ objectFit: "cover", position: "absolute", inset: 0 }}
      />
      {/* Dark vignette so text stays legible regardless of which sample is in use */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(45,74,62,0.0) 0%, rgba(45,74,62,0.0) 35%, rgba(45,74,62,0.55) 70%, rgba(45,74,62,0.85) 100%)",
        }}
      />

      {/* Text plate */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 64,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: gold,
            textTransform: "uppercase",
            letterSpacing: 3.5,
          }}
        >
          {spec.eyebrow}
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: cream,
            lineHeight: 1.05,
            letterSpacing: -1.6,
          }}
        >
          {spec.title}
        </div>
        {spec.tagline ? (
          <div
            style={{
              fontSize: 24,
              color: "rgba(250,247,242,0.85)",
              lineHeight: 1.35,
            }}
          >
            {spec.tagline}
          </div>
        ) : null}
        <div
          style={{
            marginTop: 24,
            fontSize: 18,
            color: cream,
            fontWeight: 600,
            opacity: 0.9,
          }}
        >
          pawmasterpiece.com
        </div>
      </div>
    </div>
  );
}

function SplitLayout({
  spec,
  sampleUrl,
  cream,
  green,
  gold,
}: {
  spec: PinSpec;
  sampleUrl: string;
  cream: string;
  green: string;
  gold: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: cream,
      }}
    >
      <div
        style={{
          height: 540,
          padding: "60px 60px 30px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: gold,
            textTransform: "uppercase",
            letterSpacing: 3.5,
          }}
        >
          {spec.eyebrow}
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            color: green,
            lineHeight: 1.05,
            letterSpacing: -1.6,
          }}
        >
          {spec.title}
        </div>
        {spec.tagline ? (
          <div style={{ fontSize: 24, color: "#444", lineHeight: 1.4 }}>
            {spec.tagline}
          </div>
        ) : null}
      </div>
      <div style={{ flex: 1, display: "flex", background: "#fff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sampleUrl}
          alt=""
          width={1000}
          height={960}
          style={{ objectFit: "cover", width: 1000, height: 960 }}
        />
      </div>
    </div>
  );
}
