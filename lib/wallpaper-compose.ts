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

  // Resize the square to fill the wallpaper width (1290 wide → 1290×1290).
  // Then extend ONLY upward to reach the target 2796 height — the pet's
  // chest crop (anchored to the bottom edge in the Gemini prompt) ends up
  // flush with the bottom of the phone wallpaper. All ~1506px of padding
  // goes above the pet's head, where the lock-screen clock + home-screen
  // icons sit, leaving the pet unobscured in the lower half of the screen.
  const resized = await sharp(squareBuffer)
    .resize(WALLPAPER_W, WALLPAPER_W, { fit: "cover", position: "center" })
    .toBuffer();

  return sharp(resized)
    .extend({
      top: WALLPAPER_H - WALLPAPER_W,
      bottom: 0,
      left: 0,
      right: 0,
      background: { r, g, b, alpha: 1 },
    })
    .jpeg({ quality: 92 })
    .toBuffer();
}
