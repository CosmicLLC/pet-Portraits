import sharp from "sharp";

// Composites the pet's name onto the bottom third of a generated portrait —
// watercolor and line-art styles only (see PET_NAME_OVERLAY_STYLES in
// app/page.tsx and the style check in app/api/generate/route.ts). Unlike
// lib/watermark.ts's custom block-letter glyphs (built because "PREVIEW" is
// one fixed word), a pet's name is arbitrary text, so this uses a real SVG
// <text> element and lets librsvg/fontconfig shape it — same
// render-SVG-then-Sharp-composite pattern as the watermark, just with text
// instead of pixel rects. If a font ever fails to rasterize in the
// serverless runtime, text silently draws with fontconfig's default
// fallback rather than throwing — verified visually against the bundled
// Sharp binary before shipping.

// Escape the 5 XML-significant characters. Pet names are free text (any
// customer's chosen name), so this is load-bearing against SVG injection —
// without it a name containing e.g. `<` could break the document structure.
function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Rough average glyph-width factor for a serif display face at a given
// font size — used only to decide whether the name needs to shrink to
// fit, not for exact layout (SVG text-anchor="middle" handles the rest).
const AVG_CHAR_WIDTH_RATIO = 0.56;

export async function compositePetName(
  imageBuffer: Buffer,
  petName: string
): Promise<Buffer> {
  const trimmed = petName.trim();
  if (!trimmed) return imageBuffer;

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

  // Font size targets ~9% of image height, scaled down if the name is
  // long enough that it would overflow 85% of the image width.
  const targetFontSize = height * 0.09;
  const estimatedWidth = trimmed.length * targetFontSize * AVG_CHAR_WIDTH_RATIO;
  const maxWidth = width * 0.85;
  const fontSize =
    estimatedWidth > maxWidth
      ? Math.max(height * 0.04, targetFontSize * (maxWidth / estimatedWidth))
      : targetFontSize;

  const textX = width / 2;
  // Baseline sits in the lower half of the scrim band, leaving room for
  // the ascenders/descenders of the chosen font.
  const textY = bandY + bandHeight * 0.68;
  const escaped = escapeXml(trimmed);

  const svgOverlay = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
      `<defs>` +
      `<linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0%" stop-color="#000000" stop-opacity="0"/>` +
      `<stop offset="55%" stop-color="#000000" stop-opacity="0.45"/>` +
      `<stop offset="100%" stop-color="#000000" stop-opacity="0.55"/>` +
      `</linearGradient>` +
      `</defs>` +
      `<rect x="0" y="${bandY}" width="${width}" height="${bandHeight}" fill="url(#scrim)"/>` +
      `<text x="${textX}" y="${textY}" text-anchor="middle" ` +
      `font-family="Georgia, 'Times New Roman', serif" ` +
      `font-size="${fontSize}" font-weight="600" fill="#FAF7F2" ` +
      `style="letter-spacing:0.02em">${escaped}</text>` +
      `</svg>`
  );

  return image
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .png()
    .toBuffer();
}
