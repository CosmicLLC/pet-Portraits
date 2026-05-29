import sharp from "sharp";

// Phone wallpaper composition. Takes a background-removed subject cutout
// (transparent PNG of just the pet, from lib/bg-removal.ts) and composites
// it onto a perfectly uniform solid-color phone-aspect canvas.
//
// This REPLACES the old "upscale square + extend top with a sampled color"
// approach, which produced a visible horizontal seam: the Gemini square's
// rendered background never exactly matched the flat extension color, so
// the junction showed a step (plus a watermark-texture discontinuity).
// Building the background ourselves at the exact requested hex makes a
// seam structurally impossible — the entire canvas is one uniform color.

// iPhone 14 Pro / Pro Max — the most common modern phone aspect.
export const WALLPAPER_W = 1290;
export const WALLPAPER_H = 2796;

// How much of the canvas height the pet should fill (bottom-anchored).
// 0.68 = pet dominates the lower ~2/3, solid color fills the upper third
// where the lock-screen clock lives. Tunable after visual QA.
const SUBJECT_HEIGHT_FRACTION = 0.68;

/**
 * Compose a phone-aspect wallpaper: solid `hex` background with the
 * isolated `subjectCutout` (transparent PNG) bottom-anchored and
 * horizontally centered. If the subject is wider than the canvas after
 * scaling, the sides are center-cropped (keeps the head centered).
 */
export async function composePhoneWallpaper(
  subjectCutout: Buffer,
  hex: string
): Promise<Buffer> {
  // 1) Trim the transparent padding so we have a tight bounding box of
  //    just the pet — lets us control framing precisely regardless of
  //    where Gemini placed the subject in its 1024² frame.
  const trimmed = await sharp(subjectCutout)
    .trim({ threshold: 10 })
    .toBuffer();
  const meta = await sharp(trimmed).metadata();
  const subjW = meta.width || 1024;
  const subjH = meta.height || 1024;

  // 2) Scale the subject to fill SUBJECT_HEIGHT_FRACTION of the canvas
  //    height. Width follows aspect ratio.
  const targetH = Math.round(WALLPAPER_H * SUBJECT_HEIGHT_FRACTION);
  const scaledW = Math.round((subjW * targetH) / subjH);
  let subject = await sharp(trimmed)
    .resize(scaledW, targetH, { fit: "fill" })
    .png()
    .toBuffer();

  // 3) If the scaled subject is WIDER than the canvas, center-crop the
  //    horizontal overflow HERE. This is load-bearing: Sharp's composite()
  //    requires the overlay to be the same size or SMALLER than the base —
  //    it CANNOT accept an oversized input or a negative offset. The old
  //    code passed a negative `left` expecting Sharp to crop the overflow,
  //    but Sharp instead throws "Image to composite must have same
  //    dimensions or smaller". That threw for ANY cutout wider than the
  //    canvas (spread ears, sitting/turned poses) → the intermittent prod
  //    500s. Explicitly extracting the centered 1290px-wide slice makes the
  //    composite input always fit, while preserving the intended framing
  //    (subject fills the height, sides cropped symmetrically).
  let left: number;
  if (scaledW > WALLPAPER_W) {
    subject = await sharp(subject)
      .extract({
        left: Math.floor((scaledW - WALLPAPER_W) / 2),
        top: 0,
        width: WALLPAPER_W,
        height: targetH,
      })
      .toBuffer();
    left = 0;
  } else {
    left = Math.round((WALLPAPER_W - scaledW) / 2);
  }
  // Bottom-anchor: `top` places the subject's bottom flush with the canvas
  // bottom → head lands ~32% down, body fills to the edge.
  const top = WALLPAPER_H - targetH;

  // 4) Build the uniform solid-color canvas at the EXACT requested hex
  //    and composite the subject onto it. One flat color, no seam.
  return sharp({
    create: {
      width: WALLPAPER_W,
      height: WALLPAPER_H,
      channels: 4,
      background: hex,
    },
  })
    .composite([{ input: subject, top, left }])
    .jpeg({ quality: 92 })
    .toBuffer();
}
