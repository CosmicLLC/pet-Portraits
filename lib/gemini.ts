import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    _ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 180000 } });
  }
  return _ai;
}

export const STYLE_PROMPTS: Record<string, string> = {
  watercolor: `The first image is a pet photo. The second image is a watercolor style reference. Transform the pet from the first image into a fine art watercolor portrait matching the aesthetic, color palette, and brushwork style of the second image. Preserve the pet's exact likeness, facial features, fur color, and markings. Style: loose expressive brushstrokes, soft wet-on-wet blending, delicate ink outlines, pastel and muted tones, white watercolor paper texture background. Composition: centered subject, generous white space around the pet, head and shoulders framing. Print quality: high detail in face and eyes, gallery-worthy illustration, no text, no watermarks, square format.`,

  oil: `The first image is a pet photo. The second image is an oil painting style reference. Transform the pet from the first image into a classical fine art oil painting portrait matching the aesthetic of the second image. Preserve the pet's exact likeness, facial features, fur color, and markings. Style: rich impasto brushwork, Flemish portrait tradition, warm dramatic lighting from one side, deep jewel-toned or dark neutral background, museum quality finish. Composition: centered subject, formal portrait framing, head and chest visible. Print quality: highly detailed fur texture, luminous eyes, gallery-worthy illustration, no text, no watermarks, square format.`,

  renaissance: `The first image is a pet photo. The second image is a Renaissance portrait style reference. Transform the pet from the first image into a Renaissance royal court portrait matching the aesthetic of the second image. Preserve the pet's exact likeness, facial features, fur color, and markings. Style: 16th-century Flemish oil painting, the pet wearing an ornate velvet robe or jeweled collar, gold leaf accents, rich burgundy or forest green draped fabric background with subtle ornate frame elements at edges. Composition: formal noble pose, centered, head and upper body, dignified regal expression. Print quality: museum-quality detail, highly realistic painting style, no text, no watermarks, square format.`,

  lineart: `The first image is a pet photo. The second image is a line art style reference. Transform the pet from the first image into a minimalist fine line art portrait matching the aesthetic of the second image. Preserve the pet's exact likeness, facial features, fur texture, and markings. Style: precise graphite pencil linework, continuous line drawing technique, cross-hatching for depth and shadow, clean white background, no filled color areas, monochrome. Composition: centered subject, head and shoulders, elegant negative space. Print quality: crisp architectural drawing precision, frameable wall art quality, no text, no watermarks, square format.`,
};

export const STYLE_KEYS = ["watercolor", "oil", "renaissance", "lineart"] as const;

export type StyleKey = (typeof STYLE_KEYS)[number];

// ─── Phone wallpaper generation ─────────────────────────────────────────────
// Standalone $0.99 SKU — minimalist flat illustration on a solid color the
// user picks from the curated palette. Distinct from the 4 portrait styles
// (those produce ornate gallery-style art). Wallpaper aesthetic favors
// negative space, simple shapes, and a strict single-color background that
// can extend cleanly to phone aspect ratio without seams.

export const WALLPAPER_PALETTE = [
  { name: "Sage Green", hex: "#9DAF8E" },
  { name: "Dusty Rose", hex: "#D4A5A5" },
  { name: "Warm Cream", hex: "#F5E6D3" },
  { name: "Deep Navy", hex: "#2C3E50" },
  { name: "Terracotta", hex: "#C77B58" },
  { name: "Soft Butter", hex: "#F2E2A8" },
  { name: "Slate Blue", hex: "#7B97AF" },
  { name: "Blush", hex: "#F0CCD0" },
  { name: "Forest", hex: "#3A5A40" },
  { name: "Charcoal", hex: "#3A3A3A" },
] as const;

export type WallpaperColorHex = (typeof WALLPAPER_PALETTE)[number]["hex"];

export function isValidWallpaperHex(hex: string): hex is WallpaperColorHex {
  return WALLPAPER_PALETTE.some((c) => c.hex.toLowerCase() === hex.toLowerCase());
}

// Gemini-based wallpaperPrompt() removed when wallpaper generation
// was switched to fal.ai (see generateWallpaperPortrait below). The
// Flux-tuned prompt now lives in lib/fal-wallpaper.ts buildFalPrompt.
// Git history (commit 2f61b1e through the swap commit) has the full
// Gemini-era prompt if we ever need to fall back.

// Wallpaper generation is delegated to fal.ai (Flux Dev img2img).
// Reason: Gemini 2.5 Flash Image had 25-300s+ latency with 5-15%
// failure rate on prod. fal.ai benchmarks at 1.5-3s end-to-end with
// 99%+ reliability for this exact aesthetic (flat illustration on
// solid background). Single-pet and multi-pet portrait generation
// stays on Gemini below — different aesthetic, different model.
//
// The legacy Gemini-based wallpaper code (prompt + Sharp orchestration)
// lives in lib/fal-wallpaper.ts under buildFalPrompt with Flux-tuned
// language. The wallpaperPrompt() function above is preserved (dead
// for now) in case we ever need to fall back to Gemini.
export async function generateWallpaperPortrait(
  petPhotoBuffer: Buffer,
  colorName: string,
  hex: string
): Promise<Buffer> {
  const { generateWallpaperViaFalAi } = await import("./fal-wallpaper");
  return generateWallpaperViaFalAi(petPhotoBuffer, colorName, hex);
}

export async function generatePortrait(
  petPhotoBuffer: Buffer,
  style: StyleKey
): Promise<Buffer> {
  const prompt = STYLE_PROMPTS[style];
  if (!prompt) throw new Error(`Unknown style: ${style}`);

  const refFilename = style === "oil" ? "oil-painting" : style === "lineart" ? "line-art" : style;
  const refPath = path.join(process.cwd(), "references", `${refFilename}.jpg`);

  // Build the parts array: prompt text + pet photo + optional reference image
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: prompt },
    {
      inlineData: {
        mimeType: "image/png",
        data: petPhotoBuffer.toString("base64"),
      },
    },
  ];

  if (fs.existsSync(refPath)) {
    const refBuffer = fs.readFileSync(refPath);
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: refBuffer.toString("base64"),
      },
    });
  }

  const response = await getAI().models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  });

  // Extract the generated image from the response
  const responseParts = response.candidates?.[0]?.content?.parts;
  if (!responseParts) throw new Error("No response from Gemini");

  for (const part of responseParts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, "base64");
    }
  }

  throw new Error("No image data in Gemini response");
}

// ─── Breed identification (free top-of-funnel tool) ────────────────────────
// Used by /tools/breed-identifier — accepts a pet photo, returns a structured
// breed guess via Gemini Flash (text model, no image generation). Much cheaper
// than the portrait pipeline. Designed to be backlink-friendly: free, fast,
// shareable, with a soft funnel into the portrait creator.

export interface BreedIdentification {
  species: "dog" | "cat" | "unknown";
  primaryBreed: string;
  primaryConfidence: "high" | "medium" | "low";
  /** ~2 sentences about the breed — personality + visual traits. */
  description: string;
  /** Suggested portrait styles for this breed, ordered by best fit. */
  recommendedStyles: StyleKey[];
  /** Alternative breed guesses if the primary is uncertain. Empty if confident. */
  alternatives: { breed: string; why: string }[];
  /** Friendly fact about the breed people remember. */
  funFact: string;
}

const BREED_ID_SYSTEM = `You are an expert canine and feline visual identifier with knowledge of all AKC and TICA-recognized breeds plus common mixed-breed appearance patterns. Given a photo of a pet, you produce a single structured JSON object with the breed identification. Be specific where possible, gentle where uncertain. If the image is not a dog or cat, return species: "unknown".

For mixed-breed dogs, name the most likely primary breed (e.g. "Labrador Mix") and include up to 2 alternatives.

For recommendedStyles, pick from: watercolor, oil, renaissance, lineart. Match the breed's energy:
- Renaissance suits regal/dignified breeds (Pugs, Cavaliers, Persians, anything noble-looking)
- Oil painting suits classic/traditional breeds (Labs, Goldens, German Shepherds)
- Watercolor suits soft/sweet breeds (small dogs, kittens, gentle expressions)
- Lineart suits sleek/modern breeds (Greyhounds, Sphynx, minimalist dogs)

Never invent breeds. Never speculate about the pet's name, owner, or health. Description should be visual + temperamental, ~2 sentences, factual.`;

export async function identifyBreed(
  photoBuffer: Buffer,
  mimeType: string
): Promise<BreedIdentification> {
  const response = await getAI().models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: BREED_ID_SYSTEM },
          {
            inlineData: {
              mimeType,
              data: photoBuffer.toString("base64"),
            },
          },
          {
            text: `Return ONLY a JSON object with this exact shape (no markdown, no commentary):
{
  "species": "dog" | "cat" | "unknown",
  "primaryBreed": string,
  "primaryConfidence": "high" | "medium" | "low",
  "description": string,
  "recommendedStyles": ["watercolor" | "oil" | "renaissance" | "lineart", ...],
  "alternatives": [{ "breed": string, "why": string }, ...],
  "funFact": string
}`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.candidates?.[0]?.content?.parts
    ?.map((p) => ("text" in p ? p.text : ""))
    .join("")
    .trim();
  if (!text) throw new Error("Empty breed-identification response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Sometimes the model wraps in ```json — strip and retry.
    const cleaned = text.replace(/^```json\s*|```\s*$/g, "").trim();
    parsed = JSON.parse(cleaned);
  }
  // Light validation — fall back to safe defaults for anything missing
  const p = parsed as Partial<BreedIdentification>;
  const valid: BreedIdentification = {
    species: p.species === "dog" || p.species === "cat" ? p.species : "unknown",
    primaryBreed: typeof p.primaryBreed === "string" ? p.primaryBreed : "Unknown",
    primaryConfidence:
      p.primaryConfidence === "high" || p.primaryConfidence === "medium" || p.primaryConfidence === "low"
        ? p.primaryConfidence
        : "low",
    description: typeof p.description === "string" ? p.description : "",
    recommendedStyles: Array.isArray(p.recommendedStyles)
      ? (p.recommendedStyles.filter((s) => STYLE_KEYS.includes(s as StyleKey)) as StyleKey[])
      : ["oil", "watercolor", "renaissance"],
    alternatives: Array.isArray(p.alternatives) ? p.alternatives.slice(0, 3) : [],
    funFact: typeof p.funFact === "string" ? p.funFact : "",
  };
  return valid;
}
