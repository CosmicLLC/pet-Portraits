// Wallpaper generation latency diagnostic.
//
// Bypasses Vercel entirely — calls Gemini directly from Node so we see
// true model latency without the 300s function ceiling masking results.
// Two tests:
//
// 1) PROMPT COMPARISON. Same input photo + same model, three prompt
//    variants of increasing terseness. If the long prompt is 5x slower
//    than the short prompt, the prompt is the cost driver.
//
// 2) VARIANCE. Same input, same long prompt, 3 sequential calls. If
//    they're all clustered (e.g. 240-280s), it's deterministic (prompt
//    is the cause). If spread is huge (e.g. 30s, 280s, 60s), it's
//    Gemini's tail latency — not something we can fix in code.
//
// Run with: node scripts/wallpaper-diagnostic.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadEnv() {
  try {
    const text = fs.readFileSync(path.join(ROOT, ".env.local"), "utf-8");
    for (const raw of text.split("\n")) {
      const line = raw.replace(/\r$/, "");
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      const [, key, value] = m;
      if (!process.env[key]) {
        process.env[key] = value.replace(/^["']|["']$/g, "").trim();
      }
    }
  } catch {}
}
loadEnv();

const { GoogleGenAI } = await import("@google/genai");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY missing");
  process.exit(1);
}

// Use a real photo input. watercolor.png is the only one in public/examples
// that's a portrait — it's stylized but Gemini accepts it as input.
const photoPath = path.join(ROOT, "public", "examples", "watercolor.png");
const photoBuffer = fs.readFileSync(photoPath);
const photoBase64 = photoBuffer.toString("base64");
console.log(`Input photo: watercolor.png (${(photoBuffer.length / 1024).toFixed(0)} KB)\n`);

// Prompt variants for the comparison test.
const PROMPT_FULL = `Transform the pet in the photo into a polished cel-shaded digital illustration on a solid Sage Green (#9DAF8E) background, for use as a phone wallpaper.

PET: preserve exact likeness — face shape, fur pattern, eye/nose color, ear shape, markings, any worn accessory (collar/bandana). Anyone who knows this pet must instantly recognize them as this individual, not a generic breed example.

STYLE: smooth flat-color fills with cel-shaded shadow blocks (not blurry gradients, not photoreal hair). Eyes detailed and expressive with catchlight. Subtle light from upper-left. NOT photorealistic, NOT oil painting, NOT 3D.

PET EDGE: silhouette blends directly into the background — NO outline, NO stroke, NO halo, NO edge ring, NO drop shadow. The pet's outer pixels should be the same color as the background. No "sticker" effect.

BACKGROUND: 100% solid Sage Green (hex #9DAF8E), edge to edge, every pixel. No texture, gradient, pattern, border, frame, or decoration. No shadows.

COMPOSITION: pet's head + chest fill the frame. Head sits 12–18% from the top. Body extends OFF the bottom edge (cropped — don't show where it ends). Pet's silhouette is 65–75% of canvas width, centered horizontally, facing camera. Only a thin strip of background above the head; equal margins left and right; nothing below.

OUTPUT: square 1:1. No text, logos, watermarks, or signature anywhere in the image.`;

const PROMPT_MEDIUM = `Transform this pet photo into a polished cel-shaded flat illustration on a solid sage green (#9DAF8E) background. Preserve the pet's face, fur, and markings. Pet centered, head near the top, body cropped at the bottom edge of a square canvas. No outline around the pet. No text.`;

const PROMPT_MINIMAL = `Pet illustration, flat cel-shaded style, solid sage green background, square format.`;

function getAI() {
  return new GoogleGenAI({ apiKey, httpOptions: { timeout: 600_000 } });
}

async function timedCall(prompt, label) {
  const ai = getAI();
  const t0 = Date.now();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: photoBase64 } },
          ],
        },
      ],
      config: { responseModalities: ["IMAGE", "TEXT"] },
    });
    const ms = Date.now() - t0;
    const parts = response.candidates?.[0]?.content?.parts || [];
    const hasImage = parts.some((p) => p.inlineData?.data);
    const imageBytes = parts.find((p) => p.inlineData?.data)?.inlineData.data
      .length;
    return {
      ok: hasImage,
      ms,
      bytes: imageBytes,
      promptChars: prompt.length,
      label,
    };
  } catch (e) {
    return {
      ok: false,
      ms: Date.now() - t0,
      error: e.message?.slice(0, 200),
      promptChars: prompt.length,
      label,
    };
  }
}

function fmt(ms) {
  return (ms / 1000).toFixed(1) + "s";
}

async function main() {
  console.log("═══ TEST 1: PROMPT COMPARISON ═══");
  console.log("Same input photo, same model, 3 prompt sizes:\n");

  const results1 = [];
  for (const [label, prompt] of [
    ["FULL", PROMPT_FULL],
    ["MEDIUM", PROMPT_MEDIUM],
    ["MINIMAL", PROMPT_MINIMAL],
  ]) {
    process.stdout.write(`  ${label.padEnd(8)} (${prompt.length} chars) ... `);
    const r = await timedCall(prompt, label);
    results1.push(r);
    if (r.ok) {
      console.log(
        `✅ ${fmt(r.ms)}  (output: ${((r.bytes * 3) / 4 / 1024).toFixed(0)} KB)`
      );
    } else {
      console.log(`❌ ${fmt(r.ms)}  ${r.error || "no image"}`);
    }
  }

  console.log("\n═══ TEST 2: VARIANCE ═══");
  console.log("Same prompt (FULL), 3 sequential calls — measuring spread:\n");

  const results2 = [];
  for (let i = 1; i <= 3; i++) {
    process.stdout.write(`  Call ${i}/3 ... `);
    const r = await timedCall(PROMPT_FULL, `call_${i}`);
    results2.push(r);
    if (r.ok) {
      console.log(`✅ ${fmt(r.ms)}`);
    } else {
      console.log(`❌ ${fmt(r.ms)}  ${r.error || "no image"}`);
    }
  }

  // Analyze
  console.log("\n═══ ANALYSIS ═══");
  const successful1 = results1.filter((r) => r.ok);
  const successful2 = results2.filter((r) => r.ok);

  if (successful1.length >= 2) {
    const full = results1.find((r) => r.label === "FULL")?.ms || 0;
    const min = results1.find((r) => r.label === "MINIMAL")?.ms || 0;
    const ratio = full / min;
    console.log(`\nPrompt impact: FULL is ${ratio.toFixed(1)}× slower than MINIMAL`);
    if (ratio > 2) {
      console.log("  → STRONG signal that prompt size is the cost driver.");
      console.log("  → Likely fix: simpler prompt + a style reference image.");
    } else {
      console.log("  → Weak signal. Prompt length isn't the dominant cost.");
    }
  }

  if (successful2.length >= 2) {
    const times = successful2.map((r) => r.ms);
    const max = Math.max(...times);
    const min = Math.min(...times);
    const ratio = max / min;
    console.log(`\nVariance: ${fmt(min)} fastest, ${fmt(max)} slowest, ${ratio.toFixed(1)}× spread`);
    if (ratio > 3) {
      console.log("  → HIGH variance — Gemini's tail latency is real.");
      console.log("  → Even a tight prompt will occasionally hit slow calls.");
      console.log("  → Provider swap or fallback chain would help.");
    } else {
      console.log("  → LOW variance — latency is mostly deterministic.");
      console.log("  → Prompt-tuning is the high-leverage fix.");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
