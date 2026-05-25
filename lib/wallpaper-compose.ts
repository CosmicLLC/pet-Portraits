import sharp from "sharp";

// Phone wallpaper composition. Takes a square minimalist portrait (typically
// 1024×1024 from Gemini) and extends it to a 9:19.5 phone-aspect canvas by
// padding top and bottom with the SAME background color that's already in
// the portrait. Edge-samples the corner pixel rather than using the user's
// requested hex so any color drift from Gemini is matched seamlessly.

// iPhone 14 Pro / Pro Max — the most common modern phone aspect.
export const WALLPAPER_W = 1290;
export const WALLPAPER_H = 2796;

/**
 * Compose a phone-aspect wallpaper from a square minimalist portrait. The
 * pet stays centered horizontally and gets vertical padding above and below
 * filled with the portrait's edge color (which should match the requested
 * background — but we sample it to handle Gemini's slight color drift).
 */
export async function composePhoneWallpaper(squareBuffer: Buffer): Promise<Buffer> {
  // Sample a small block from the top-left corner of the portrait — that's
  // background area, so it's the cleanest sample of the actual rendered
  // background color. Use 8×8 + resize-to-1 to average out compression noise.
  const sample = await sharp(squareBuffer)
    .extract({ left: 4, top: 4, width: 16, height: 16 })
    .resize(1, 1)
    .raw()
    .toBuffer();
  const r = sample[0];
  const g = sample[1];
  const b = sample[2];

  // Up-scale the source square LARGER than the phone width before placing
  // it. The Gemini source is 1024×1024 and gets scaled to a 1700-pixel
  // square — wider than the 1290 phone width, which means the sides get
  // cropped (mostly empty background per the wallpaper prompt) while the
  // pet appears much bigger in the final composition. Result: pet fills
  // the bottom ~61% of the phone (1700/2796) instead of the bottom 46%
  // (1290/2796) that a width-fit would give. Matches the Etsy-style
  // pet-wallpaper reference where the pet dominates the lower 2/3 of the
  // screen.
  //
  // The prompt asks Gemini to keep the pet's silhouette to 65-75% of the
  // source-square width, which works out to roughly 75-85% of the final
  // phone width after this scale-and-crop — within the 80% range visible
  // in premium reference wallpapers.
  const SOURCE_TARGET = 1700;
  const upscaled = await sharp(squareBuffer)
    .resize(SOURCE_TARGET, SOURCE_TARGET, { fit: "cover", position: "center" })
    .toBuffer();

  // Center-crop horizontally to the phone width. Trims (SOURCE_TARGET -
  // WALLPAPER_W) / 2 = 205px off each side — all background.
  const horizontalCrop = Math.floor((SOURCE_TARGET - WALLPAPER_W) / 2);
  const cropped = await sharp(upscaled)
    .extract({
      left: horizontalCrop,
      top: 0,
      width: WALLPAPER_W,
      height: SOURCE_TARGET,
    })
    .toBuffer();

  // Extend upward to reach 2796px phone height. The cropped block sits
  // flush at the bottom (matching the prompt's "pet body extends off the
  // bottom edge"), all the padding goes above the pet's head where the
  // lock screen clock + home screen icons live.
  return sharp(cropped)
    .extend({
      top: WALLPAPER_H - SOURCE_TARGET,
      bottom: 0,
      left: 0,
      right: 0,
      background: { r, g, b, alpha: 1 },
    })
    .jpeg({ quality: 92 })
    .toBuffer();
}
