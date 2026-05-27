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

function wallpaperPrompt(colorName: string, hex: string): string {
  return `The image is a pet photo. Transform the pet into a polished digital illustration phone wallpaper on a completely solid ${colorName} (${hex}) background.

LIKENESS — preserve exactly:
- The pet's specific face shape, fur color pattern, ear shape and angle, eye color, nose color, muzzle markings, and breed character must be unmistakable
- Anyone who knows this pet must instantly recognize THIS specific individual — not a generic example of its breed
- Do NOT "average" toward typical breed appearance; preserve the individual's quirks
- Preserve any accessory the pet is wearing (collar, bandana, bowtie, harness, name tag) and render it in the same illustration style

STYLE — polished flat digital illustration (think Procreate / vector portrait, the look used in premium Etsy pet wallpaper listings):
- Smooth flat color fills with cel-shading: defined shadow shapes (not soft blurry gradients) showing where light falls on fur
- Light direction: subtle, from upper-left
- Eyes are the focal point — render them with full detail, catchlight highlights, defined iris pattern, expressive
- Nose: painterly with a single highlight reflection, dimensional
- Fur rendered as flat blocks of color with darker shadow blocks suggesting volume — not photoreal hair-by-hair, but more refined than basic flat shapes
- Whiskers (on cats) drawn as fine lines
- Tongues (if mouth is open) painterly with highlight
- Clean digital illustration edges — slightly soft, not vector-sharp, not photoreal
- NOT photorealistic, NOT an oil painting, NOT 3D-rendered, NO black line art outlines around the pet

PET EDGE — critical, this is failing in current output:
- The pet's silhouette must blend DIRECTLY into the background color with NO visible boundary line
- NO outline, NO stroke, NO border, NO halo, NO edge highlight, NO drop shadow, NO contrasting rim of any color around the pet
- NO "sticker" or "cut-out" effect — the pet must NOT look like a separate object pasted onto the background
- The pet's outer edge pixels should be the same color as the background pixels immediately outside them, with only a soft 1-2 pixel anti-alias transition — never a distinct contrasting line
- If you would normally add a thin outline for definition, DO NOT — let the shading inside the pet's silhouette carry the form

BACKGROUND — strict, no exceptions:
- 100% solid uniform ${colorName} (hex ${hex}) field, edge to edge, every single pixel
- NO texture, NO gradient, NO pattern, NO border, NO frame
- NO shadow under or behind or around the pet
- NO other elements, no text, no logos, no decorative shapes
- The background color must extend cleanly to all four edges

COMPOSITION — this is the most important section, follow precisely (the image becomes a phone wallpaper where the pet must DOMINATE the screen, much larger than a centered portrait):
- Subject: pet's head, neck, and upper chest fill the frame — render as if zoomed in close, pet appearing to emerge from below the bottom edge of the screen
- The pet's body extends OFF THE BOTTOM EDGE of the canvas — chest/shoulders bleed past the bottom edge so the viewer cannot see where the body ends
- The pet's silhouette occupies 65-75% of the canvas WIDTH — the pet is LARGE, filling most of the frame from edge to edge (the rendering pipeline upscales and center-crops, so this becomes ~80% of the final phone wallpaper width)
- The pet's head + visible body fills 80-90% of the canvas vertically
- Top of the pet's head sits approximately 12-18% down from the top edge of the canvas — head is high, close to the top
- Pet's EYES sit roughly 35-45% down from the top edge (just above the vertical midline)
- Pet's NOSE aligned with the horizontal center axis — perfectly centered left-to-right
- Pet faces the camera directly, head straight forward or with at most a 10-15° tilt
- ONLY 12-18% of the canvas (top strip, above the pet's head) is empty background — this is the only background showing
- NO empty background below the pet — the body extends to and past the bottom edge
- Equal background margins on the LEFT and RIGHT of the pet's silhouette
- Symmetrical breathing room left and right

OUTPUT:
- Square 1:1 aspect ratio, high resolution
- No text, no watermarks, no logos, no signature, no border anywhere in the image`;
}

export async function generateWallpaperPortrait(
  petPhotoBuffer: Buffer,
  colorName: string,
  hex: string
): Promise<Buffer> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: wallpaperPrompt(colorName, hex) },
    {
      inlineData: {
        mimeType: "image/png",
        data: petPhotoBuffer.toString("base64"),
      },
    },
  ];

  // Optional style reference image — included if references/wallpaper.jpg
  // exists. Anchors the aesthetic more reliably than text alone. Falls
  // through to text-only if the reference isn't shipped yet.
  const refPath = path.join(process.cwd(), "references", "wallpaper.jpg");
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

  const responseParts = response.candidates?.[0]?.content?.parts;
  if (!responseParts) throw new Error("No response from Gemini");

  for (const part of responseParts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, "base64");
    }
  }

  throw new Error("No image data in Gemini response");
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
