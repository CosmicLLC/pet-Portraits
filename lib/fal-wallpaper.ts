// Wallpaper generation via fal.ai (Flux Dev image-to-image).
//
// Replaces Gemini for the wallpaper SKU specifically. Reason: Gemini
// 2.5 Flash Image latency was 25-300s+ on prod with 5-15% failure
// rate. fal.ai Flux Dev img2img benchmarks at 1.5-3s end-to-end with
// 99%+ reliability. Single-pet portraits (`generatePortrait`) and
// multi-pet (`generateMultiPetPortrait`) keep using Gemini — they're
// a different aesthetic and Gemini works fine for them.
//
// Cost: ~$0.025 per generation (Flux Dev tier). On a $0.99 wallpaper,
// margin is still ~96%.
//
// Output: 1024x1024 JPG/PNG Buffer. The downstream Sharp pipeline
// (composePhoneWallpaper) upscales + crops to phone aspect, applies
// watermark, writes to private blob — none of that changes.

// Compose the prompt + negative prompt for Flux. Different model
// family than Gemini, so prompt style is different:
//   - Flux responds well to evocative descriptive phrases
//   - Negative prompts are first-class (Gemini doesn't really have them)
//   - Less benefit from heavy structured rules; trust the negative
//     prompt to suppress unwanted elements
function buildFalPrompt(colorName: string, hex: string): {
  prompt: string;
  negative_prompt: string;
} {
  return {
    prompt: `polished flat cel-shaded digital illustration of the pet, solid ${colorName} (${hex}) background extending edge to edge, square format, expressive eyes with bright catchlight highlights, smooth cel-shading shadow blocks suggesting volume, subtle light from upper left, pet's silhouette blending directly into the background with no boundary line, head positioned in upper third of frame, body cropped at bottom edge, premium phone wallpaper aesthetic, Procreate-style illustration, vector portrait quality, gallery-worthy`,
    negative_prompt: `text, watermark, logo, signature, caption, photograph, photorealistic, 3D render, oil painting, dark outline around pet, black border, white border, frame, multiple pets, blurry, low quality, sticker effect, halo around pet, drop shadow, gradient background, patterned background, textured background, decorative elements`,
  };
}

export async function generateWallpaperViaFalAi(
  petPhotoBuffer: Buffer,
  colorName: string,
  hex: string
): Promise<Buffer> {
  const apiKey = process.env.FAL_AI_API_KEY;
  if (!apiKey) {
    throw new Error("FAL_AI_API_KEY environment variable is not set");
  }

  // Encode pet photo as a data URL — fal.ai's image_url parameter
  // accepts data URLs directly, so we don't need a round-trip to a
  // public blob store first. Adds ~33% size overhead but the photos
  // are typically <2MB so the POST body stays small.
  const dataUrl = `data:image/png;base64,${petPhotoBuffer.toString("base64")}`;

  const { prompt, negative_prompt } = buildFalPrompt(colorName, hex);

  // Call fal.ai's Flux Dev image-to-image endpoint. Synchronous —
  // returns the generated image inline (no polling needed at this
  // tier; the call completes in 1.5-3s).
  const res = await fetch("https://fal.run/fal-ai/flux/dev/image-to-image", {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      negative_prompt,
      image_url: dataUrl,
      // 0.85 strength = heavy stylization, low input preservation.
      // Wallpaper is meant to be a stylized interpretation, not a
      // photo recoloring — high strength produces a more painterly
      // result. If pet identity is being lost, drop to 0.75.
      strength: 0.85,
      num_inference_steps: 28,
      // 1024x1024 — matches what the downstream Sharp pipeline
      // (composePhoneWallpaper) expects as input. It will upscale
      // to 1700px then center-crop + extend to 1290x2796 phone aspect.
      image_size: "square_hd",
      guidance_scale: 3.5,
      num_images: 1,
      // Disable safety filter — pet illustrations have zero chance
      // of triggering NSFW classifiers, and the default is to fail
      // hard if it does, which would be a customer-visible error.
      enable_safety_checker: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "unknown error");
    throw new Error(
      `fal.ai HTTP ${res.status}: ${errText.slice(0, 200)}`
    );
  }

  const data = (await res.json()) as {
    images?: Array<{ url: string; width: number; height: number }>;
    detail?: string;
  };

  if (!data.images?.[0]?.url) {
    throw new Error(
      `fal.ai returned no image: ${JSON.stringify(data).slice(0, 200)}`
    );
  }

  // Fetch the generated image. fal.media URLs are public and served
  // from a CDN, so this is fast (~100-300ms). The image is JPEG by
  // default; the downstream Sharp pipeline transcodes to whatever
  // it needs.
  const imgUrl = data.images[0].url;
  const imgRes = await fetch(imgUrl);
  if (!imgRes.ok) {
    throw new Error(
      `Failed to fetch fal output image: HTTP ${imgRes.status}`
    );
  }
  const arrayBuffer = await imgRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
