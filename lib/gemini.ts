import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

let _ai: GoogleGenAI | null = null;
let _wallpaperAI: GoogleGenAI | null = null;

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

// Dedicated wallpaper client with a 75s per-request SDK timeout (vs the
// 180s default). Gemini image generation normally returns in 10-30s;
// 75s is generous headroom for a slow-but-legit call while still
// bounding a dead connection so it can't run toward the Vercel 300s
// function ceiling. Combined with the Promise.race + single retry in
// generateWallpaperPortrait below, this is the "airtight" guarantee:
// the call always resolves with an image OR throws a clean error
// within ~150s worst case, never a silent hang.
function getWallpaperAI(): GoogleGenAI {
  if (!_wallpaperAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    _wallpaperAI = new GoogleGenAI({ apiKey, httpOptions: { timeout: 75_000 } });
  }
  return _wallpaperAI;
}

// Shared no-border / no-signature clause appended to every style prompt.
// Customers reported watercolor and Renaissance occasionally coming back
// with a painted border/mat around the portrait, and watercolor
// occasionally with a fake artist signature scrawled in a bottom corner —
// Gemini picking up on genuine conventions of those art mediums (real
// watercolor paintings are often bordered/mounted; real oil and Renaissance
// portraits are traditionally signed) even though every prompt already said
// not to. This is the single strengthened, explicit instruction repeated
// identically across all 6 styles — including the two (astronaut, dogue)
// that hadn't shown the issue, so the anti-signature rule in particular is
// applied everywhere as prevention, not just where it's already been seen.
const NO_BORDER_NO_SIGNATURE =
  "STRICT REQUIREMENT: absolutely no border, frame, mat, vignette, drop shadow, or any kind of edge decoration anywhere in the image — the artwork must bleed edge-to-edge with nothing framing it. Do NOT place the artwork as a smaller rectangle inset within a larger blank canvas — do NOT leave a plain white, cream, gray, or blank margin/padding strip along any edge, even a thin one. The painted subject and its background must extend to fill all four physical edges of the image with zero margin on any side — check every edge individually (top, bottom, left, right) before finishing. STRICT REQUIREMENT: absolutely no artist signature, monogram, initials, date, or any scrawled/painted mark anywhere in the image, including the corners — the canvas must be completely free of any such marking.";

// A second, distinct failure mode found in live samples 2026-09-02: Gemini
// sometimes doesn't add a border to the painting — it renders the ENTIRE
// output as a photo of a physical framed canvas object (tilted at a
// perspective angle, with a visible canvas-wrap side edge and a cast
// shadow, like a product mockup). "museum quality" / "gallery-worthy"
// language in every prompt likely primes this. Applied to all 6 styles —
// any of them could trigger it, not just the ones observed so far.
const FLAT_2D_ONLY =
  "STRICT REQUIREMENT: the output must be a completely FLAT, two-dimensional image of the artwork itself, viewed perfectly straight-on — NOT a photo or 3D mockup of a physical object. Do NOT depict a stretched canvas, canvas wrap, framed picture hanging on a wall, easel, or any product photography of the artwork as an object. No perspective tilt, no visible canvas or frame edge/side profile, no cast shadow implying a physical object in a room. The image IS the flat artwork, filling the entire frame edge to edge.";

export const STYLE_PROMPTS: Record<string, string> = {
  watercolor: `The first image is a pet photo. The second image is a watercolor style reference. Transform the pet from the first image into a fine art watercolor portrait matching the aesthetic, color palette, and brushwork style of the second image. Preserve the pet's exact likeness, facial features, fur color, and markings. Style: loose expressive brushstrokes, soft wet-on-wet blending, delicate ink outlines, pastel and muted tones, white watercolor paper texture background. Composition: centered subject, generous white space around the pet, head and shoulders framing. Print quality: high detail in face and eyes, gallery-worthy illustration, no text, no watermarks. IMPORTANT: output ONLY the portrait itself — do NOT paint any frame, border, box, mat, or edge treatment around it; just the pet on plain watercolor paper with soft open white space to the edges. ${NO_BORDER_NO_SIGNATURE} ${FLAT_2D_ONLY} PORTRAIT orientation, taller than wide (3:4). Keep the complete composition inside the canvas with even margins — never crop the subject.`,

  oil: `The first image is a pet photo. The second image is an oil painting style reference. Transform the pet from the first image into a classical fine art oil painting portrait matching the aesthetic of the second image. Preserve the pet's exact likeness, facial features, fur color, and markings. Style: rich impasto brushwork, Flemish portrait tradition, warm dramatic lighting from one side, deep jewel-toned or dark neutral background, museum quality finish. Composition: centered subject, formal portrait framing, head and chest visible. Print quality: highly detailed fur texture, luminous eyes, gallery-worthy illustration, no text, no watermarks. ${NO_BORDER_NO_SIGNATURE} ${FLAT_2D_ONLY} CRITICAL — this classical oil-painting style is especially prone to a mistake: do NOT add a small painted signature, initials, or cursive scrawl in the bottom corner (a convention of real classical oil paintings) — check the bottom-left AND bottom-right corners specifically and leave them as plain unmarked background/shadow, nothing painted there at all. PORTRAIT orientation, taller than wide (3:4). The COMPLETE composition must be fully inside the canvas with even margins on all sides — never crop the subject, and if the pet wears any robe or fabric, keep it entirely within the image (do not let it run off any edge).`,

  renaissance: `The first image is a pet photo. The second image is a Renaissance portrait style reference. Transform the pet from the first image into a Renaissance royal court portrait matching the aesthetic of the second image. Preserve the pet's exact likeness, facial features, fur color, and markings. Style: 16th-century Flemish oil painting, the pet wearing an ornate velvet robe or jeweled collar, gold leaf accents ON THE ROBE AND JEWELRY ONLY, rich burgundy or forest green draped fabric background. Composition: formal noble pose, centered, head and upper body, dignified regal expression. Print quality: museum-quality detail, highly realistic painting style, no text, no watermarks. IMPORTANT: output ONLY the portrait itself — do NOT paint any frame, border, gilded edge, mat, or framed-canvas effect around it; the painted scene fills the entire image edge to edge. ${NO_BORDER_NO_SIGNATURE} ${FLAT_2D_ONLY} CRITICAL — this style is especially prone to a mistake: do NOT extend the robe's gold leaf, filigree, or ornamental trim into a decorative strip or pattern running along the outer edges of the image — any gold ornamentation must stay ON the pet's robe/collar/jewelry, never form a border-like band along the top, bottom, left, or right edge of the canvas. The only things touching the image's outer edges should be the plain draped background fabric or the pet/robe itself, never a distinct decorative trim pattern. PORTRAIT orientation, taller than wide (3:4). Keep the complete composition inside the canvas with even margins — never crop the subject, and if the pet wears a robe or collar keep it fully within the image.`,

  lineart: `The first image is a pet photo. The second image is a line art style reference. Transform the pet from the first image into a minimalist fine line art portrait matching the aesthetic of the second image. Preserve the pet's exact likeness, facial features, fur texture, and markings. Style: precise graphite pencil linework, continuous line drawing technique, cross-hatching for depth and shadow, clean white background, no filled color areas, monochrome. Composition: centered subject, head and shoulders, elegant negative space. Print quality: crisp architectural drawing precision, frameable wall art quality, no text, no watermarks. ${NO_BORDER_NO_SIGNATURE} ${FLAT_2D_ONLY} PORTRAIT orientation, taller than wide (3:4). The COMPLETE composition must be fully inside the canvas with even margins on all sides — never crop the subject.`,

  // ── Themed concept styles (Crown & Paw-style "costume" themes, added 2026-06-06).
  // These are concept/costume themes rather than art mediums. No reference image
  // exists yet (references/ is empty → text-only generation, same as the others).
  astronaut: `The first image is a pet photo. Transform the pet from the first image into a heroic astronaut portrait. Preserve the pet's exact likeness, facial features, fur color, and markings. Style: the pet wearing a realistic white spacesuit with a silver zip, embroidered mission patches, and an open helmet collar, set against a deep navy starfield background with soft cinematic rim lighting, polished semi-realistic digital painting. Composition: centered subject, head and chest, confident heroic pose. Print quality: crisp detail in the face and eyes, gallery-worthy illustration, no text, no watermarks. IMPORTANT: output ONLY the portrait itself — do NOT paint any frame, border, or mat around it; the scene fills the image edge to edge. ${NO_BORDER_NO_SIGNATURE} ${FLAT_2D_ONLY} PORTRAIT orientation, taller than wide (3:4). Keep the complete composition inside the canvas with even margins — never crop the subject.`,

  dogue: `The first image is a pet photo. Transform the pet from the first image into a high-fashion magazine cover portrait. Preserve the pet's exact likeness, facial features, fur color, and markings. Style: the pet styled as a fashion model wearing a chic black beret and a brown leather jacket, shot studio-style against a muted sage-green seamless background, glossy high-end editorial aesthetic with soft directional lighting. Render a bold serif magazine masthead reading "DOGUE" in large red capital letters across the very top, as a parody of a fashion magazine cover. Composition: centered, head and shoulders, the pet gazing confidently at the camera, masthead spanning the top edge. Print quality: crisp, glossy, editorial; no text other than the DOGUE masthead, no watermarks. ${NO_BORDER_NO_SIGNATURE} ${FLAT_2D_ONLY} PORTRAIT orientation, taller than wide (3:4). Keep the masthead and the subject fully inside the canvas with even margins — never crop them.`,
};

export const STYLE_KEYS = ["watercolor", "oil", "renaissance", "lineart", "astronaut", "dogue"] as const;

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

// Wallpaper prompt for Gemini. Gemini follows compositional + color
// instructions (solid background, head framing, edge-to-edge fill)
// far better than Flux img2img, which just re-paints the source photo
// and keeps its original background. That's why we're on Gemini for
// this SKU despite the speed difference.
function wallpaperPrompt(colorName: string, hex: string): string {
  return `Transform the pet in the photo into a polished cel-shaded digital illustration on a solid ${colorName} (${hex}) background, for use as a phone wallpaper.

PET: preserve exact likeness — face shape, fur pattern, eye/nose color, ear shape, markings, any worn accessory (collar/bandana). Anyone who knows this pet must instantly recognize them as this individual.

STYLE: smooth flat-color fills with cel-shaded shadow blocks (not blurry gradients, not photoreal hair). Eyes detailed and expressive with catchlight. Subtle light from upper-left. NOT photorealistic, NOT oil painting, NOT 3D.

BACKGROUND — CRITICAL: replace the ENTIRE background with 100% solid ${colorName} (hex ${hex}), edge to edge, every pixel. Completely remove the original photo's background (grass, room, outdoors — all of it). No texture, gradient, pattern, border, frame, or decoration. The pet must be cut out and placed on the pure solid color.

PET EDGE: the pet's silhouette blends directly into the solid background — NO outline, NO stroke, NO halo, NO edge ring, NO drop shadow. No "sticker" effect.

COMPOSITION: the pet's head + chest fill the frame. Head sits 12-18% from the top. Body extends OFF the bottom edge (cropped). Pet's silhouette is 65-75% of canvas width, centered horizontally, facing camera. Only a thin strip of solid background above the head; equal margins left and right; nothing below.

OUTPUT: square 1:1. No text, logos, watermarks, or signature anywhere.`;
}

// ─── Shared image-generation core ──────────────────────────────────────────
// Used by ALL Gemini image flows: wallpaper, single-pet portrait, multi-pet
// portrait. gemini-2.5-flash-image is STOCHASTIC — ~1 in 5 calls it returns a
// text-only/empty response with no image part even for a perfectly valid
// prompt (measured live 2026-05-28). The old single-shot callers treated that
// as terminal, so ~22% of PAID-INTENT generations 500'd ("use a clearer photo"
// on a perfectly good photo). This core:
//   1) bounds each call with getWallpaperAI()'s 75s client + an 80s race, so
//      it can never run toward the 300s Vercel ceiling;
//   2) retries up to 3x on a stochastic empty generation (or a transient
//      network/5xx error) — driving user-facing failures ~22% -> ~1% (0.22^3);
//   3) keeps a genuine safety/policy block terminal (re-rolling can't help).
type GeminiImagePart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export async function generateGeminiImage(
  parts: GeminiImagePart[],
  label: string,
  aspectRatio?: string
): Promise<Buffer> {
  const aiClient = getWallpaperAI();
  const MAX_ATTEMPTS = 3;
  let lastErr: Error | null = null;

  // When an aspect ratio is requested (e.g. "3:4" for portrait prints), pass it
  // via imageConfig so Gemini FRAMES the full composition at that ratio instead
  // of generating a square it would otherwise crop (which cut off renaissance
  // frames / subject edges). Wallpaper passes none (square → composed later).
  const config = aspectRatio
    ? { responseModalities: ["IMAGE", "TEXT"], imageConfig: { aspectRatio } }
    : { responseModalities: ["IMAGE", "TEXT"] };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // Hard 80s ceiling via Promise.race — belt to the SDK timeout's
      // suspenders. The losing branch's request is abandoned but won't block.
      const response = await Promise.race([
        aiClient.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: [{ role: "user", parts }],
          config,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Gemini ${label} call exceeded 80s`)),
            80_000
          )
        ),
      ]);

      const candidate = response.candidates?.[0];
      const responseParts = candidate?.content?.parts;
      if (responseParts) {
        for (const part of responseParts) {
          if (part.inlineData?.data) {
            return Buffer.from(part.inlineData.data, "base64");
          }
        }
      }
      // No image. Distinguish a HARD safety/policy block (terminal — re-rolling
      // can't help) from a STOCHASTIC empty generation (re-rolling the same
      // request almost always succeeds).
      const blockReason = response.promptFeedback?.blockReason;
      const finishReason = candidate?.finishReason;
      const hardBlock =
        blockReason ||
        (finishReason &&
          /SAFETY|PROHIBITED|BLOCK|RECITATION/i.test(String(finishReason)));
      if (hardBlock) {
        throw new Error(
          `Gemini blocked the image (reason: ${blockReason || finishReason})`
        );
      }
      throw new Error("No image data in Gemini response (empty generation)");
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      const msg = lastErr.message.toLowerCase();
      const isTransient =
        msg.includes("fetch failed") ||
        msg.includes("timeout") ||
        msg.includes("exceeded 80s") ||
        msg.includes("network") ||
        msg.includes("econn") ||
        msg.includes("etimedout") ||
        msg.includes("503") ||
        msg.includes("unavailable") ||
        msg.includes("500") ||
        msg.includes("empty generation");
      const terminal = msg.includes("gemini blocked the image");
      if (terminal || !isTransient || attempt >= MAX_ATTEMPTS) {
        throw lastErr;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw lastErr ?? new Error(`Gemini ${label} generation failed`);
}

// Wallpaper generation — builds the prompt + parts, delegates to the shared
// generateGeminiImage core for retry/timeout/hard-block handling.
export async function generateWallpaperPortrait(
  petPhotoBuffer: Buffer,
  colorName: string,
  hex: string
): Promise<Buffer> {
  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [
    { text: wallpaperPrompt(colorName, hex) },
    {
      inlineData: {
        mimeType: "image/png",
        data: petPhotoBuffer.toString("base64"),
      },
    },
  ];

  // Optional style reference image — anchors the aesthetic if present.
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

  return generateGeminiImage(parts, "wallpaper");
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

  // Delegate to the shared core: bounded timeout + 3x retry on stochastic
  // empty generations (the ~22% no-image whiff), terminal on real safety
  // blocks. Previously this was a single unguarded call, so ~1 in 5 paid
  // portrait generations failed with "use a clearer photo" on a good photo.
  return generateGeminiImage(parts, `portrait:${style}`, "3:4");
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
