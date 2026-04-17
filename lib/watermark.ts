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
  const wordShadow = renderWord("PREVIEW", pixel, "#000000", 0.35);

  // Tile the word diagonally across the image
  const tileSpacingX = word.width + pixel * 12;
  const tileSpacingY = word.height + pixel * 18;
  const diag = Math.ceil(Math.sqrt(width * width + height * height));
  const cols = Math.ceil(diag / tileSpacingX) + 2;
  const rows = Math.ceil(diag / tileSpacingY) + 2;

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

  const svgOverlay = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
      `<g transform="rotate(-30, ${width / 2}, ${height / 2})">${tiles}</g>` +
    `</svg>`
  );

  return image
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .png()
    .toBuffer();
}
