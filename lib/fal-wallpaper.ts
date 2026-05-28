// Wallpaper generation via fal.ai (Flux Dev image-to-image).
//
// Replaces Gemini for the wallpaper SKU specifically. Reason: Gemini
// 2.5 Flash Image latency was 25-300s+ on prod with 5-15% failure
// rate. fal.ai Flux Dev img2img benchmarks at 1.5-3s end-to-end with
// 99%+ reliability when called from local Windows. Single-pet
// portraits (`generatePortrait`) and multi-pet stay on Gemini.
//
// Cost: ~$0.025 per generation. On a $0.99 wallpaper, margin is ~96%.
//
// Output: JPG Buffer (~1024×1024). The downstream Sharp pipeline
// (composePhoneWallpaper) upscales + crops to phone aspect.
//
// INSTRUMENTATION: every step writes a console.log marker so when the
// /api/wallpaper-preview route writes its EventLog trace, we can see
// in Vercel function logs (printable from CLI) what step within the
// fal call hung — connection setup, request body, response parse,
// image fetch from fal.media CDN.

import { logEvent } from "@/lib/events";

function buildFalPrompt(colorName: string, hex: string): {
  prompt: string;
  negative_prompt: string;
} {
  return {
    prompt: `polished flat cel-shaded digital illustration of the pet, solid ${colorName} (${hex}) background extending edge to edge, square format, expressive eyes with bright catchlight, smooth cel-shading shadow blocks, subtle light from upper left, pet's silhouette blending directly into background, head in upper third of frame, body cropped at bottom edge, premium phone wallpaper aesthetic, Procreate-style, gallery-worthy`,
    negative_prompt: `text, watermark, logo, signature, caption, photograph, photorealistic, 3D render, oil painting, dark outline, black border, white border, frame, multiple pets, blurry, low quality, sticker effect, halo around pet, drop shadow, gradient background, patterned background, textured background, decorative elements`,
  };
}

export async function generateWallpaperViaFalAi(
  petPhotoBuffer: Buffer,
  colorName: string,
  hex: string,
  traceId: string = "no-trace"
): Promise<Buffer> {
  const apiKey = process.env.FAL_AI_API_KEY;
  if (!apiKey) {
    throw new Error("FAL_AI_API_KEY environment variable is not set");
  }

  const trace = (step: string, extra?: Record<string, unknown>) => {
    logEvent("info", "wallpaper-preview", `[${traceId}] fal.${step}`, {
      traceId,
      step: `fal.${step}`,
      ...extra,
    }).catch(() => {});
  };

  trace("a_start", { photoBytes: petPhotoBuffer.length });

  const dataUrl = `data:image/png;base64,${petPhotoBuffer.toString("base64")}`;
  const { prompt, negative_prompt } = buildFalPrompt(colorName, hex);
  trace("b_dataurl_built", { dataUrlChars: dataUrl.length });

  // 90s AbortController — if the call hangs beyond that we want a
  // clear error and the catch block to run, not a Vercel function
  // kill. fal normally responds in 2-3s so 90s is generous.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90_000);

  let falResponseText: string;
  try {
    trace("c_calling_fal");
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
        strength: 0.85,
        num_inference_steps: 28,
        image_size: "square_hd",
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    trace("d_fal_responded", { status: res.status });

    if (!res.ok) {
      const errText = await res.text().catch(() => "unknown");
      trace("d_fal_error", { status: res.status, body: errText.slice(0, 300) });
      throw new Error(
        `fal.ai HTTP ${res.status}: ${errText.slice(0, 200)}`
      );
    }

    falResponseText = await res.text();
    trace("e_fal_body_read", { bodyChars: falResponseText.length });
  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : String(err);
    trace("c_fetch_failed", { error: msg });
    throw new Error(`fal.ai fetch failed: ${msg}`);
  }

  let data: {
    images?: Array<{ url: string; width: number; height: number }>;
    detail?: string;
  };
  try {
    data = JSON.parse(falResponseText);
  } catch (e) {
    trace("e_parse_failed", {
      error: e instanceof Error ? e.message : String(e),
      bodyPrefix: falResponseText.slice(0, 200),
    });
    throw new Error(`fal.ai response was not JSON: ${falResponseText.slice(0, 200)}`);
  }

  if (!data.images?.[0]?.url) {
    trace("e_no_image_url", { data: JSON.stringify(data).slice(0, 200) });
    throw new Error(`fal.ai returned no image: ${JSON.stringify(data).slice(0, 200)}`);
  }

  const imgUrl = data.images[0].url;
  trace("f_fetching_image", { url: imgUrl.slice(0, 80) });

  const imgController = new AbortController();
  const imgTimeoutId = setTimeout(() => imgController.abort(), 30_000);
  let imageBuffer: Buffer;
  try {
    const imgRes = await fetch(imgUrl, { signal: imgController.signal });
    clearTimeout(imgTimeoutId);
    if (!imgRes.ok) {
      trace("f_image_fetch_failed", { status: imgRes.status });
      throw new Error(`Failed to fetch fal output image: HTTP ${imgRes.status}`);
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
    trace("g_image_buffered", { imageBytes: imageBuffer.length });
  } catch (err) {
    clearTimeout(imgTimeoutId);
    const msg = err instanceof Error ? err.message : String(err);
    trace("f_image_fetch_threw", { error: msg });
    throw new Error(`Failed to fetch fal output image: ${msg}`);
  }

  trace("h_done");
  return imageBuffer;
}
