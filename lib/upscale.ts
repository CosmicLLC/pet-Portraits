// AI upscaling via Replicate Real-ESRGAN, PLUS exact-ratio cropping and
// exact-pixel resizing to each SKU's real print dimensions.
//
// Runs only on paid orders (called from the Stripe webhook before we submit
// to Prodigi).
//
// WHY THE CROP STEP EXISTS: lib/gemini.ts asks Gemini for aspectRatio "3:4"
// (0.75) via imageConfig, but Gemini's actual output for a "3:4" request is
// 864×1184 (ratio 0.7297) — not a mathematically exact 3:4. Verified live
// 2026-09-01 against a real production generation. That ~2.7% deviation
// used to ride straight through Real-ESRGAN's 4x scale (which preserves
// whatever ratio it's given) and into Prodigi's `fillPrintArea` sizing,
// which cover-crops silently to fit the frame — never fatal, but never
// exactly right either. This file now crops to the SKU's exact ratio
// BEFORE upscaling, so nothing downstream has to guess.
//
// Cost: ~$0.005-0.01 per upscale. Latency: 5-15 seconds.

import { put } from "@vercel/blob";
import sharp from "sharp";
import { printAssetUrl } from "./print-token";
import { getPrintTargetPixels, PRINT_TARGET_DPI, type PrintTargetPixels } from "./products";
import { logEvent } from "./events";

const REPLICATE_MODEL_VERSION =
  // nightmareai/real-esrgan — widely used, clean output, good for illustrations
  "350d32041630ffbe63c8352783a26d94126809164e54085352f8326e53999085";

const MIN_DPI = 250;
const MAX_RATIO_DEVIATION = 0.005; // 0.5%

export function isUpscalerConfigured(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN);
}

type ReplicatePrediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string | null;
  urls?: { get?: string };
};

// `imageInput` may be a URL or a data: URI — Replicate accepts both for
// image-typed inputs. We pass a data URI for the (small, already-cropped)
// source so there's no need to re-upload it to blob storage just to get a
// fetchable URL.
async function createPrediction(imageInput: string): Promise<ReplicatePrediction> {
  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait", // return the final result if it completes within ~60s
    },
    body: JSON.stringify({
      version: REPLICATE_MODEL_VERSION,
      input: { image: imageInput, scale: 4, face_enhance: false },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Replicate create failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return (await res.json()) as ReplicatePrediction;
}

async function pollPrediction(getUrl: string, deadlineMs: number): Promise<ReplicatePrediction> {
  while (Date.now() < deadlineMs) {
    const res = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` },
    });
    if (!res.ok) throw new Error(`Replicate poll failed (${res.status})`);
    const pred = (await res.json()) as ReplicatePrediction;
    if (pred.status === "succeeded" || pred.status === "failed" || pred.status === "canceled") {
      return pred;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Replicate poll timed out");
}

interface CropResult {
  buffer: Buffer<ArrayBufferLike>;
  width: number;
  height: number;
  croppedPx: number;
  axis: "height" | "width" | "none";
}

// Crops the source image to exactly match targetRatio, trimming only the
// dimension that's in excess. For every SKU this repo currently sells, the
// Gemini "3:4" source (864×1184, ratio 0.7297) is narrower/taller than the
// print target ratio, so in practice this only ever trims height — and it
// anchors that crop to the TOP, protecting the pet's head, which every style
// prompt in lib/gemini.ts explicitly composes high in frame ("head and
// shoulders", "head and chest"). If a future SKU ever needs a target ratio
// narrower than the source, this also handles cropping width — centered,
// since there's no head-position bias left-to-right.
export async function cropToRatio(buffer: Buffer<ArrayBufferLike>, targetRatio: number): Promise<CropResult> {
  const meta = await sharp(buffer).metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  if (!width || !height) throw new Error("Could not read source image dimensions");
  const sourceRatio = width / height;

  if (Math.abs(sourceRatio - targetRatio) / targetRatio < 0.001) {
    return { buffer, width, height, croppedPx: 0, axis: "none" };
  }

  if (sourceRatio < targetRatio) {
    // Source is relatively taller/narrower than target — crop height,
    // anchored to the top (protects the head).
    const newHeight = Math.round(width / targetRatio);
    const cropped = await sharp(buffer)
      .extract({ left: 0, top: 0, width, height: newHeight })
      .toBuffer();
    return { buffer: cropped, width, height: newHeight, croppedPx: height - newHeight, axis: "height" };
  }

  // Source is relatively wider than target — crop width, centered.
  const newWidth = Math.round(height * targetRatio);
  const left = Math.round((width - newWidth) / 2);
  const cropped = await sharp(buffer)
    .extract({ left, top: 0, width: newWidth, height })
    .toBuffer();
  return { buffer: cropped, width: newWidth, height, croppedPx: width - newWidth, axis: "width" };
}

// Upscales the portrait at sourceUrl (which MUST be a publicly-fetchable URL —
// Replicate fetches it anonymously, so pass the /api/print-asset proxy URL, not
// a raw private blob URL) and stores the print-ready result in Blob. Returns a
// PUBLIC proxy URL Prodigi can fetch. imageId namespaces the stored asset;
// baseUrl is the site origin used to build the proxy URL.
//
// productType drives the crop-to-exact-ratio + resize-to-exact-pixel-target
// behavior (see getPrintTargetPixels in lib/products.ts). When productType
// has no registered print spec, this falls back to the old behavior
// (AI-upscale only, no ratio correction) and logs a warning — see the
// PRINT_SPECS comment in lib/products.ts for which SKUs that applies to.
//
// A ratio or DPI assertion failure THROWS (does not silently fall back) —
// unlike a Replicate/AI-upscale failure, which is caught internally and
// degrades to a Sharp-only resize. The caller (the webhook's physical-
// fulfillment block) does not catch this specific throw path silently; it
// propagates to the outer try/catch, which marks the order prodigiStatus
// "Failed" and logs it rather than submitting a bad asset to Prodigi.
export async function upscaleForPrint(
  sourceUrl: string,
  imageId: string,
  baseUrl: string,
  productType?: string
): Promise<string> {
  if (!isUpscalerConfigured()) throw new Error("REPLICATE_API_TOKEN not set");

  const srcRes = await fetch(sourceUrl);
  if (!srcRes.ok) throw new Error(`Failed to fetch source image (${srcRes.status})`);
  const srcBuffer: Buffer<ArrayBufferLike> = Buffer.from(await srcRes.arrayBuffer());

  const spec = productType ? getPrintTargetPixels(productType) : null;
  if (productType && !spec) {
    await logEvent("warning", "webhook", "No print target spec for productType — shipping without ratio correction", {
      imageId,
      productType,
    });
  }

  let toUpscale: Buffer<ArrayBufferLike> = srcBuffer;
  if (spec) {
    const cropResult = await cropToRatio(srcBuffer, spec.ratio);
    toUpscale = cropResult.buffer;
    if (cropResult.croppedPx > 0) {
      console.log(
        `Cropped print asset for ${imageId} (${productType}): trimmed ${cropResult.croppedPx}px off ${cropResult.axis} to hit ratio ${spec.ratio.toFixed(4)}`
      );
    }
  }

  // AI super-resolution pass — best-effort quality enhancement, NOT
  // correctness-critical. A Replicate failure here degrades to a
  // Sharp-only resize of the (already correctly-cropped) source rather
  // than aborting the whole print — the ratio/DPI assertion below still
  // runs against whichever buffer we end up with.
  let upscaledBuffer: Buffer<ArrayBufferLike> | null = null;
  try {
    const dataUri = `data:image/png;base64,${toUpscale.toString("base64")}`;
    let prediction = await createPrediction(dataUri);
    if (prediction.status !== "succeeded" && prediction.status !== "failed") {
      const getUrl = prediction.urls?.get;
      if (!getUrl) throw new Error("Replicate response missing poll URL");
      const deadline = Date.now() + 55_000;
      prediction = await pollPrediction(getUrl, deadline);
    }
    if (prediction.status !== "succeeded") {
      throw new Error(`Upscale failed: ${prediction.error || prediction.status}`);
    }
    const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    if (!outputUrl) throw new Error("Upscale returned no output URL");
    // Replicate output URLs expire after an hour — fetch now, re-host below.
    const imgRes = await fetch(outputUrl);
    if (!imgRes.ok) throw new Error(`Failed to fetch upscaled image (${imgRes.status})`);
    upscaledBuffer = Buffer.from(await imgRes.arrayBuffer());
  } catch (aiErr) {
    console.error("AI upscale failed, continuing with cropped-only source:", aiErr);
    await logEvent("warning", "webhook", "AI upscale failed, using cropped (non-AI-upscaled) source", {
      imageId,
      productType,
      error: aiErr instanceof Error ? aiErr.message : String(aiErr),
    });
  }

  let finalBuffer: Buffer<ArrayBufferLike> = upscaledBuffer ?? toUpscale;

  // Final precision resize to the SKU's exact target pixel dimensions.
  // The 4x AI upscale (when it succeeds) gets us most of the way but
  // essentially never lands on the literal pixel count Prodigi wants at
  // 300dpi, so finish with an ordinary Sharp resize. No further cropping
  // here — ratio is already exact from cropToRatio() above, so a plain
  // "fill" resize can't distort it.
  if (spec) {
    finalBuffer = await sharp(finalBuffer).resize(spec.width, spec.height, { fit: "fill" }).png().toBuffer();
    await assertPrintQuality(finalBuffer, spec, imageId, productType);
  }

  await put(`print-ready/${imageId}.png`, finalBuffer, {
    access: "private",
    addRandomSuffix: true,
    contentType: "image/png",
  });

  return printAssetUrl(`print-ready/${imageId}`, baseUrl);
}

// Pre-submit assertion — the last checkpoint before an asset reaches
// Prodigi. Deliberately throws (does not log-and-continue) on violation:
// a bad print asset shipped to a paying customer is worse than a delayed
// order an admin has to manually retry.
async function assertPrintQuality(
  buffer: Buffer<ArrayBufferLike>,
  spec: PrintTargetPixels,
  imageId: string,
  productType?: string
): Promise<void> {
  const meta = await sharp(buffer).metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  const ratio = width / height;
  const ratioDeviation = Math.abs(ratio - spec.ratio) / spec.ratio;
  const dpi = width / spec.widthIn;

  if (ratioDeviation > MAX_RATIO_DEVIATION || dpi < MIN_DPI) {
    const msg =
      `Print asset failed pre-submit quality check for ${productType} (imageId ${imageId}): ` +
      `${width}x${height}, ratio ${ratio.toFixed(4)} (target ${spec.ratio.toFixed(4)}, ` +
      `deviation ${(ratioDeviation * 100).toFixed(2)}%), ${dpi.toFixed(0)}dpi (min ${MIN_DPI}, target ${PRINT_TARGET_DPI})`;
    await logEvent("error", "webhook", msg, {
      imageId,
      productType,
      width,
      height,
      ratio,
      targetRatio: spec.ratio,
      ratioDeviation,
      dpi,
    });
    throw new Error(msg);
  }
}
