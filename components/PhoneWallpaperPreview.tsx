"use client";

interface PhoneWallpaperPreviewProps {
  imageUrl: string;
  /** Visual size of the mockup */
  size?: "sm" | "md" | "lg";
}

const CONFIG = {
  sm: { width: 64,  br: 13, notchW: 20, notchH: 5,  notchTop: 3  },
  md: { width: 110, br: 22, notchW: 34, notchH: 8,  notchTop: 6  },
  lg: { width: 160, br: 32, notchW: 50, notchH: 11, notchTop: 9  },
};

export default function PhoneWallpaperPreview({
  imageUrl,
  size = "md",
}: PhoneWallpaperPreviewProps) {
  const c = CONFIG[size];
  // 9 : 19.5 aspect ratio (iPhone 14 Pro — 1290×2796)
  const height = Math.round(c.width * (19.5 / 9));
  const timeFontSize   = Math.round(c.width * 0.275);
  const dateFontSize   = Math.round(c.width * 0.105);
  const timeTop        = Math.round(height  * 0.22);
  const dateTop        = Math.round(height  * 0.38);

  return (
    <div
      style={{
        position: "relative",
        width:  c.width,
        height,
        borderRadius: c.br,
        overflow: "hidden",
        flexShrink: 0,
        /* three-layer border for realistic frame depth */
        boxShadow: [
          "0 0 0 2px #1c1c1e",
          "0 0 0 3.5px #3a3a3c",
          "0 12px 40px rgba(0,0,0,0.45)",
          "0 2px 8px rgba(0,0,0,0.3)",
        ].join(", "),
        backgroundColor: "#000",
      }}
    >
      {/* Portrait image — cover fill */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Phone wallpaper preview"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          display: "block",
        }}
      />

      {/* Top gradient — fades portrait into dark for lock-screen UI */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom," +
            " rgba(0,0,0,0.72) 0%," +
            " rgba(0,0,0,0.18) 28%," +
            " rgba(0,0,0,0) 45%," +
            " rgba(0,0,0,0) 62%," +
            " rgba(0,0,0,0.38) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Dynamic Island (pill notch) */}
      <div
        style={{
          position: "absolute",
          top: c.notchTop,
          left: "50%",
          transform: "translateX(-50%)",
          width: c.notchW,
          height: c.notchH,
          backgroundColor: "#000",
          borderRadius: c.notchH / 2,
        }}
      />

      {/* Lock screen time */}
      <div
        style={{
          position: "absolute",
          top: timeTop,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#fff",
          fontSize: timeFontSize,
          fontWeight: 200,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
          textShadow: "0 1px 6px rgba(0,0,0,0.6)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        9:41
      </div>

      {/* Lock screen date */}
      <div
        style={{
          position: "absolute",
          top: dateTop,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "rgba(255,255,255,0.88)",
          fontSize: dateFontSize,
          fontWeight: 400,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
          textShadow: "0 1px 4px rgba(0,0,0,0.5)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        Thursday, April 14
      </div>
    </div>
  );
}
