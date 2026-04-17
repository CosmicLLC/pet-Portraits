import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Paw Masterpiece — Fine Art Portraits of Your Pet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#2D4A3E",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle corner decorations */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 300,
            height: 300,
            background: "rgba(250,247,242,0.04)",
            borderRadius: "0 0 300px 0",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 300,
            height: 300,
            background: "rgba(250,247,242,0.04)",
            borderRadius: "300px 0 0 0",
          }}
        />

        {/* Paw icon */}
        <div
          style={{
            fontSize: 80,
            marginBottom: 24,
            opacity: 0.7,
          }}
        >
          🐾
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 80,
            fontWeight: "bold",
            color: "#FAF7F2",
            letterSpacing: "-2px",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Paw Masterpiece
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: "rgba(250,247,242,0.65)",
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Fine Art Portraits of Your Pet — Ready in Seconds
        </div>

        {/* Bottom badge */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(250,247,242,0.1)",
            borderRadius: 100,
            padding: "10px 24px",
            color: "rgba(250,247,242,0.5)",
            fontSize: 20,
          }}
        >
          Watercolor · Oil Painting · Renaissance · Line Art
        </div>
      </div>
    ),
    { ...size }
  );
}
