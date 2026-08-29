import sharp from "sharp";
import { GLYPHS, GLYPH_RENDER_SIZE, SPACE_ADVANCE } from "@/lib/pet-name-glyphs";

// Composites the pet's name onto the bottom third of a generated portrait —
// watercolor and line-art styles only (see PET_NAME_OVERLAY_STYLES in
// app/page.tsx and the style check in app/api/generate/route.ts).
//
// This does NOT use SVG <text> or any font/text-shaping engine at request
// time. Two earlier attempts both worked in local dev and both rendered as
// invisible tofu boxes in prod: first with font-family="Georgia, serif"
// (relying on a system font Vercel's serverless runtime doesn't have), then
// with the font embedded as a base64 @font-face data URI (Vercel's bundled
// Sharp/librsvg has no text-shaping support at all, embedded font or not —
// confirmed live). See lib/pet-name-glyphs.ts for the fix: every supported
// character is pre-rendered to a bitmap ahead of time, and this file just
// positions + composites those bitmaps with Sharp — pure raster image
// compositing, which is already proven to work identically everywhere
// (it's exactly how the pet's own photo gets composited).

const SUPPORTED = new Set(Object.keys(GLYPHS));

interface PlacedGlyph {
  base64: string;
  scaledLeft: number;
  scaledTop: number;
  scaledWidth: number;
  scaledHeight: number;
}

export async function compositePetName(
  imageBuffer: Buffer,
  petName: string
): Promise<Buffer> {
  const trimmed = petName.trim();
  if (!trimmed) return imageBuffer;

  // Drop any character we don't have a glyph for (emoji, non-Latin script,
  // etc.) rather than fail — a name that partially renders beats a 500.
  const chars = trimmed.split("").filter((c) => c === " " || SUPPORTED.has(c));
  if (chars.length === 0) return imageBuffer;

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 1024;
  const height = metadata.height || 1024;

  // Scrim band — bottom third of the image, gradient fading in from the
  // top edge of the band so it blends into the artwork rather than
  // showing a hard line. Same top-transparent-to-bottom-opaque gradient
  // approach used for the wallpaper composite in app/api/webhook/route.ts.
  const bandHeight = height / 3;
  const bandY = height - bandHeight;
  const scrimSvg = Buffer.from(
    `<svg width="${width}" height="${bandHeight}" xmlns="http://www.w3.org/2000/svg">` +
      `<defs><linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0%" stop-color="#000000" stop-opacity="0"/>` +
      `<stop offset="55%" stop-color="#000000" stop-opacity="0.45"/>` +
      `<stop offset="100%" stop-color="#000000" stop-opacity="0.55"/>` +
      `</linearGradient></defs>` +
      `<rect x="0" y="0" width="${width}" height="${bandHeight}" fill="url(#scrim)"/>` +
      `</svg>`
  );

  // Walk the name at native (GLYPH_RENDER_SIZE) scale to get total advance
  // width and each glyph's cursor position, before any scaling.
  let cursorX = 0;
  const layout: { ch: string; x: number }[] = [];
  for (const ch of chars) {
    if (ch === " ") {
      cursorX += SPACE_ADVANCE;
      continue;
    }
    const glyph = GLYPHS[ch];
    layout.push({ ch, x: cursorX + glyph.leftBearing });
    cursorX += glyph.advance;
  }
  const nativeWidth = cursorX;

  // Font size targets ~9% of image height, scaled down if the name is
  // long enough that it would overflow 85% of the image width.
  const targetFontSize = height * 0.09;
  let scale = targetFontSize / GLYPH_RENDER_SIZE;
  const maxWidth = width * 0.85;
  if (nativeWidth * scale > maxWidth) {
    const minFontSize = height * 0.04;
    scale = Math.max(minFontSize / GLYPH_RENDER_SIZE, maxWidth / nativeWidth);
  }

  const scaledTotalWidth = nativeWidth * scale;
  const startX = (width - scaledTotalWidth) / 2;
  // Baseline sits in the lower half of the scrim band, leaving room for
  // ascenders/descenders.
  const baselineY = bandY + bandHeight * 0.68;

  const placed: PlacedGlyph[] = layout.map(({ ch, x }) => {
    const glyph = GLYPHS[ch];
    const scaledWidth = Math.max(1, Math.round(glyph.width * scale));
    const scaledHeight = Math.max(1, Math.round(glyph.height * scale));
    return {
      base64: glyph.base64,
      scaledLeft: Math.round(startX + x * scale),
      scaledTop: Math.round(baselineY - glyph.topFromBaseline * scale),
      scaledWidth,
      scaledHeight,
    };
  });

  // Resize every glyph bitmap in parallel, then composite scrim + all
  // glyphs in one pass. Color is already baked into each glyph bitmap as
  // brand cream (#FAF7F2) at generation time — see
  // scripts/generate-pet-name-glyphs.mjs. (An earlier version rendered
  // black glyphs and tried sharp().tint() to recolor at request time, but
  // tint() preserves luminance, so a fully-opaque black pixel stayed black
  // no matter the tint color.)
  const glyphBuffers = await Promise.all(
    placed.map((p) =>
      sharp(Buffer.from(p.base64, "base64"))
        .resize(p.scaledWidth, p.scaledHeight)
        .png()
        .toBuffer()
    )
  );

  return image
    .composite([
      { input: scrimSvg, top: Math.round(bandY), left: 0 },
      ...glyphBuffers.map((buf, i) => ({
        input: buf,
        top: placed[i].scaledTop,
        left: placed[i].scaledLeft,
      })),
    ])
    .png()
    .toBuffer();
}
