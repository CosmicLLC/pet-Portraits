// AI upscaling via Replicate Real-ESRGAN.
// Runs only on paid orders (called from the Stripe webhook before we submit
// to Prodigi). Takes Gemini's 1024x1024 output → 4x upscale → ~4096x4096
// print-ready asset. Stored in Vercel Blob so Prodigi can fetch a stable URL.
//
// Cost: ~$0.005-0.01 per upscale. Latency: 5-15 seconds.

import { put } from "@vercel/blob";
import { printAssetUrl } from "./print-token";

const REPLICATE_MODEL_VERSION =
  // nightmareai/real-esrgan — widely used, clean output, good for illustrations
  "350d32041630ffbe63c8352783a26d94126809164e54085352f8326e53999085";

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

async function createPrediction(imageUrl: string): Promise<ReplicatePrediction> {
  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait", // return the final result if it completes within ~60s
    },
    body: JSON.stringify({
      version: REPLICATE_MODEL_VERSION,
      input: { image: imageUrl, scale: 4, face_enhance: false },
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

// Upscales the portrait at sourceUrl (which MUST be a publicly-fetchable URL —
// Replicate fetches it anonymously, so pass the /api/print-asset proxy URL, not
// a raw private blob URL) and stores the 4x result in Blob. Returns a PUBLIC
// proxy URL Prodigi can fetch. imageId namespaces the stored asset; baseUrl is
// the site origin used to build the proxy URL.
export async function upscaleForPrint(
  sourceUrl: string,
  imageId: string,
  baseUrl: string
): Promise<string> {
  if (!isUpscalerConfigured()) throw new Error("REPLICATE_API_TOKEN not set");

  let prediction = await createPrediction(sourceUrl);

  // If the server returned before completion (despite Prefer: wait), poll.
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

  // Download the upscaled image and re-host in Vercel Blob so the URL is stable
  // and under our control (Replicate output URLs expire after an hour).
  const imgRes = await fetch(outputUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch upscaled image (${imgRes.status})`);
  const buf = Buffer.from(await imgRes.arrayBuffer());

  // Store PRIVATE (the store is private-only; access:"public" 500s). Prodigi
  // can't fetch a private blob URL directly (403), so we hand it the
  // /api/print-asset proxy URL instead, which streams this blob server-side.
  await put(`print-ready/${imageId}.png`, buf, {
    access: "private",
    addRandomSuffix: true,
    contentType: "image/png",
  });

  return printAssetUrl(`print-ready/${imageId}`, baseUrl);
}
