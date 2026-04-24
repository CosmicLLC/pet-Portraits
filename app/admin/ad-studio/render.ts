// Canvas rendering for the Ad Studio. Same layout math as public/ads/
// compose.html — pulled out so we can run it against any canvas with any
// copy/image. Pure functions: hand in a canvas + inputs, it draws; no
// side effects, no DOM queries.

import { BRAND, type AdCopy } from "./presets";

export type FormatId = "1x1" | "4x5" | "9x16" | "16x9" | "2x3";

export interface FormatSpec {
  id: FormatId;
  label: string;
  // Meta's recommended upload dimensions for this placement
  W: number;
  H: number;
  // Cream band at top (headline + subhead)
  topBandH: number;
  // Photograph band height — the hero visual
  photoH: number;
  // Cream band at bottom (CTA + URL)
  bottomBandH: number;
  // Type-system layout numbers — each tuned per aspect ratio to keep
  // headlines legible at every placement without word-wrap surprises.
  headlinePadTop: number;
  headlineSize: number;
  subheadSize: number;
  subheadGap: number;
  ctaBtnW: number;
  ctaBtnH: number;
  ctaPadTop: number;
  ctaSize: number;
  urlSize: number;
  urlGap: number;
  badgeH: number;
  badgeFontSize: number;
  badgePadX: number;
}

export const FORMATS: FormatSpec[] = [
  {
    id: "1x1",
    label: "Meta feed (1:1)",
    W: 1080,
    H: 1080,
    topBandH: 280,
    photoH: 540,
    bottomBandH: 260,
    headlinePadTop: 36,
    headlineSize: 58,
    subheadSize: 22,
    subheadGap: 14,
    ctaBtnW: 520,
    ctaBtnH: 72,
    ctaPadTop: 50,
    ctaSize: 22,
    urlSize: 16,
    urlGap: 22,
    badgeH: 36,
    badgeFontSize: 15,
    badgePadX: 16,
  },
  {
    id: "4x5",
    label: "Meta feed vertical (4:5)",
    W: 1080,
    H: 1350,
    topBandH: 320,
    photoH: 700,
    bottomBandH: 330,
    headlinePadTop: 50,
    headlineSize: 62,
    subheadSize: 24,
    subheadGap: 18,
    ctaBtnW: 580,
    ctaBtnH: 80,
    ctaPadTop: 70,
    ctaSize: 24,
    urlSize: 18,
    urlGap: 28,
    badgeH: 40,
    badgeFontSize: 17,
    badgePadX: 18,
  },
  {
    id: "9x16",
    label: "Reels / Stories / TikTok (9:16)",
    W: 1080,
    H: 1920,
    topBandH: 460,
    photoH: 980,
    bottomBandH: 480,
    headlinePadTop: 110,
    headlineSize: 72,
    subheadSize: 28,
    subheadGap: 28,
    ctaBtnW: 680,
    ctaBtnH: 92,
    ctaPadTop: 120,
    ctaSize: 28,
    urlSize: 20,
    urlGap: 32,
    badgeH: 46,
    badgeFontSize: 19,
    badgePadX: 22,
  },
  {
    id: "16x9",
    label: "Landscape / desktop feed (16:9)",
    W: 1200,
    H: 628,
    topBandH: 150,
    photoH: 340,
    bottomBandH: 138,
    headlinePadTop: 24,
    headlineSize: 42,
    subheadSize: 18,
    subheadGap: 8,
    ctaBtnW: 380,
    ctaBtnH: 54,
    ctaPadTop: 30,
    ctaSize: 18,
    urlSize: 13,
    urlGap: 14,
    badgeH: 30,
    badgeFontSize: 13,
    badgePadX: 14,
  },
  {
    id: "2x3",
    label: "Pinterest pin (2:3)",
    W: 1000,
    H: 1500,
    topBandH: 340,
    photoH: 800,
    bottomBandH: 360,
    headlinePadTop: 60,
    headlineSize: 60,
    subheadSize: 22,
    subheadGap: 18,
    ctaBtnW: 560,
    ctaBtnH: 78,
    ctaPadTop: 80,
    ctaSize: 22,
    urlSize: 16,
    urlGap: 28,
    badgeH: 40,
    badgeFontSize: 17,
    badgePadX: 18,
  },
];

export function getFormat(id: FormatId): FormatSpec {
  const f = FORMATS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown format: ${id}`);
  return f;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lineHeight));
  return lines.length;
}

export interface RenderOptions {
  /** When true, clear canvas before drawing. Default true. */
  clear?: boolean;
  /** Show a placeholder rect in the photo band when no image is loaded. */
  placeholder?: boolean;
}

/**
 * Draw the full ad onto a canvas at canvas.width × canvas.height pixels.
 * The canvas should be sized to match the format before calling.
 */
export function drawAd(
  canvas: HTMLCanvasElement,
  format: FormatSpec,
  copy: AdCopy,
  baseImage: HTMLImageElement | null,
  opts: RenderOptions = {},
) {
  const { clear = true, placeholder = true } = opts;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  if (clear) {
    ctx.fillStyle = BRAND.cream;
    ctx.fillRect(0, 0, W, H);
  }

  // Photo band
  const photoY = format.topBandH;
  const photoH = format.photoH;

  if (baseImage && baseImage.complete && baseImage.naturalWidth > 0) {
    const bandRatio = W / photoH;
    const imgRatio = baseImage.naturalWidth / baseImage.naturalHeight;
    let sx: number, sy: number, sw: number, sh: number;
    if (imgRatio > bandRatio) {
      sh = baseImage.naturalHeight;
      sw = baseImage.naturalHeight * bandRatio;
      sx = (baseImage.naturalWidth - sw) / 2;
      sy = 0;
    } else {
      sw = baseImage.naturalWidth;
      sh = baseImage.naturalWidth / bandRatio;
      sx = 0;
      sy = (baseImage.naturalHeight - sh) / 2;
    }
    ctx.drawImage(baseImage, sx, sy, sw, sh, 0, photoY, W, photoH);
  } else if (placeholder) {
    // Soft placeholder so the layout reads when no image is loaded yet.
    ctx.fillStyle = "#E5E0D8";
    ctx.fillRect(0, photoY, W, photoH);
    ctx.fillStyle = "#B5AFA6";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `500 ${Math.round(format.subheadSize * 1.3)}px "DM Sans", sans-serif`;
    ctx.fillText("Upload a base image →", W / 2, photoY + photoH / 2);
  }

  // Headline (multi-line, \n separated)
  ctx.fillStyle = BRAND.green;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `800 ${format.headlineSize}px "Playfair Display", serif`;

  const hlLines = copy.headline.split("\n");
  const lineH = format.headlineSize * 1.08;
  const headlineStartY = format.headlinePadTop;
  hlLines.forEach((line, i) => {
    ctx.fillText(line, W / 2, headlineStartY + i * lineH);
  });

  // Subhead
  ctx.fillStyle = BRAND.muted;
  ctx.font = `500 ${format.subheadSize}px "DM Sans", sans-serif`;
  const subheadY =
    headlineStartY + hlLines.length * lineH + format.subheadGap;
  wrapLine(ctx, copy.subhead, W / 2, subheadY, W * 0.86, format.subheadSize * 1.4);

  // Bottom band: CTA pill + URL
  const bottomY = H - format.bottomBandH;
  const btnW = Math.min(format.ctaBtnW, W - 80);
  const btnH = format.ctaBtnH;
  const btnX = (W - btnW) / 2;
  const btnY = bottomY + format.ctaPadTop;

  ctx.fillStyle = BRAND.green;
  roundRect(ctx, btnX, btnY, btnW, btnH, btnH / 2);
  ctx.fill();

  ctx.fillStyle = BRAND.cream;
  ctx.font = `700 ${format.ctaSize}px "DM Sans", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(copy.cta, W / 2, btnY + btnH / 2);

  ctx.fillStyle = BRAND.muted;
  ctx.font = `500 ${format.urlSize}px "DM Sans", sans-serif`;
  ctx.textBaseline = "top";
  ctx.fillText(copy.url, W / 2, btnY + btnH + format.urlGap);

  // Badge pill over photo, bottom-left
  if (copy.badge) {
    const badgeY = photoY + photoH - format.badgeH - 24;
    const badgeX = 24;
    ctx.font = `600 ${format.badgeFontSize}px "DM Sans", sans-serif`;
    const metrics = ctx.measureText(copy.badge);
    const badgeW = metrics.width + format.badgePadX * 2;

    ctx.fillStyle = "rgba(250, 247, 242, 0.92)";
    roundRect(ctx, badgeX, badgeY, badgeW, format.badgeH, format.badgeH / 2);
    ctx.fill();

    ctx.fillStyle = BRAND.green;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(copy.badge, badgeX + format.badgePadX, badgeY + format.badgeH / 2);
  }
}
