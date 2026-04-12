import sharp from "sharp";

export async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 1024;
  const height = metadata.height || 1024;

  // Generate SVG with repeating diagonal "PREVIEW" text
  const text = "PREVIEW";
  const fontSize = 48;
  const spacing = 200;
  const rows = Math.ceil((width + height) / spacing) + 2;
  const cols = Math.ceil((width + height) / spacing) + 2;

  let textElements = "";
  for (let row = -rows; row < rows; row++) {
    for (let col = -cols; col < cols; col++) {
      const x = col * spacing;
      const y = row * spacing;
      textElements += `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="bold" fill="white" opacity="0.3" font-family="Arial, sans-serif">${text}</text>`;
    }
  }

  const svgOverlay = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(-45, ${width / 2}, ${height / 2})">
        ${textElements}
      </g>
    </svg>
  `);

  const watermarked = await image
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .png()
    .toBuffer();

  return watermarked;
}
