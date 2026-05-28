import sharp from "sharp";

// Block-letter glyph definitions on a 5x7 grid (1 = pixel filled)
const GLYPHS: Record<string, number[][]> = {
  P: [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
  ],
  R: [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,1,0,0],
    [1,0,0,1,0],
    [1,0,0,0,1],
  ],
  E: [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
  V: [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,0,1,0],
    [0,0,1,0,0],
  ],
  I: [
    [1,1,1,1,1],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [1,1,1,1,1],
  ],
  W: [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,1,0,1],
    [1,0,1,0,1],
    [1,1,0,1,1],
    [1,0,0,0,1],
  ],
};

// Render the word "PREVIEW" as a string of <rect> elements
// pixel = size of each "block" in the 5x7 grid; gap between letters = pixel
function renderWord(word: string, pixel: number, color: string, opacity: number): { svg: string; width: number; height: number } {
  const letterWidth = 5 * pixel;
  const letterGap = pixel;
  const height = 7 * pixel;
  let cursorX = 0;
  let rects = "";
  for (const ch of word) {
    const glyph = GLYPHS[ch];
    if (!glyph) { cursorX += letterWidth + letterGap; continue; }
    for (let row = 0; row < glyph.length; row++) {
      for (let col = 0; col < glyph[row].length; col++) {
        if (glyph[row][col]) {
          rects += `<rect x="${cursorX + col * pixel}" y="${row * pixel}" width="${pixel}" height="${pixel}" fill="${color}" opacity="${opacity}"/>`;
        }
      }
    }
    cursorX += letterWidth + letterGap;
  }
  return { svg: rects, width: cursorX - letterGap, height };
}

export async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 1024;
  const height = metadata.height || 1024;

  // Scale watermark to image — pixel size ~1.2% of min dimension
  const pixel = Math.max(3, Math.round(Math.min(width, height) * 0.012));
  const word = renderWord("PREVIEW", pixel, "#ffffff", 0.55);
  const wordShadow = renderWord("PREVIEW", pixel, "#000000", 0.4);

  // Tile the word diagonally across the image, with a HARD CAP on rows
  // and cols. Diagnostic trace on 2026-05-28 pinpointed this function
  // as the wallpaper-preview pipeline's actual failure point on a
  // 1290×2796 canvas — Sharp/librsvg rasterization scales with both
  // rect count AND output canvas area.
  //
  // MAX_HALF = 3 → loop produces 2*3 × 2*3 = 36 tiles max, each ~196
  // rects × 2 (word + shadow) ≈ 14k rects total. Rendering on a
  // 1290×2796 canvas runs in ~5-10s; on a 1024×1024 portrait it's
  // sub-second. Watermark density on the wallpaper is reduced
  // (~430×930 per tile cell) but still defeats casual crop-out
  // attempts — combined with the larger central stamp below, any
  // crop containing the pet contains the watermark.
  const MAX_HALF = 3;
  const tileSpacingX = word.width + pixel * 8;
  const tileSpacingY = word.height + pixel * 10;
  const diag = Math.ceil(Math.sqrt(width * width + height * height));
  const cols = Math.min(MAX_HALF, Math.ceil(diag / tileSpacingX) + 4);
  const rows = Math.min(MAX_HALF, Math.ceil(diag / tileSpacingY) + 4);

  let tiles = "";
  for (let r = -rows; r < rows; r++) {
    for (let c = -cols; c < cols; c++) {
      const x = c * tileSpacingX + (r % 2 === 0 ? 0 : tileSpacingX / 2);
      const y = r * tileSpacingY;
      // Shadow (offset by 1 pixel) for legibility on light backgrounds
      tiles += `<g transform="translate(${x + pixel},${y + pixel})">${wordShadow.svg}</g>`;
      tiles += `<g transform="translate(${x},${y})">${word.svg}</g>`;
    }
  }

  // Center stamp — larger and bolder than the tile pattern, sits over the
  // pet's face area where any meaningful crop would have to keep it. Acts
  // as a secondary lock: even if someone removes the diagonal grid, the
  // central stamp covers the part of the image with the most ownership
  // value (the pet itself).
  const centerPixel = pixel * 2;
  const centerWord = renderWord("PREVIEW", centerPixel, "#ffffff", 0.65);
  const centerShadow = renderWord("PREVIEW", centerPixel, "#000000", 0.5);
  const centerX = (width - centerWord.width) / 2;
  const centerY = (height - centerWord.height) / 2;

  const svgOverlay = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
      `<g transform="rotate(-30, ${width / 2}, ${height / 2})">${tiles}</g>` +
      `<g transform="translate(${centerX + centerPixel},${centerY + centerPixel})">${centerShadow.svg}</g>` +
      `<g transform="translate(${centerX},${centerY})">${centerWord.svg}</g>` +
    `</svg>`
  );

  return image
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .png()
    .toBuffer();
}
