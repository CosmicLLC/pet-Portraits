import fs from "fs";
import path from "path";
import { STYLE_PROMPTS, generateGeminiImage, type StyleKey } from "./gemini";

// Multi-pet portrait generation — a PARALLEL pipeline to lib/gemini.ts
// `generatePortrait()`. Single-pet generation is untouched; this file
// is only imported by /api/generate-multi and the multi-pet flow.
//
// Design goals:
//  - Reuse the carefully-tuned per-style prompt language verbatim from
//    STYLE_PROMPTS, so the artistic fidelity of each style carries over.
//  - Add a multi-pet HEADER (composition guidance, group framing) and a
//    naming SUFFIX (only when names provided) — the rest of the prompt
//    matches single-pet behavior so an oil-painting 3-pet portrait
//    looks like an oil-painting single-pet portrait, just with 3 pets.
//  - Accept 2–4 pets (validated at the route layer too).
//  - Send all N pet photos + the style reference to Gemini in a single
//    multimodal call — Gemini 2.5 Flash Image supports multi-image
//    inputs natively.

export const MIN_PETS = 2;
export const MAX_PETS = 4;

// Strip everything except letters (ASCII + extended Latin), spaces,
// hyphens, and apostrophes. Avoids the /u flag (which the project's
// tsconfig target doesn't accept) by listing the ranges manually.
// Covers common accented names (Léa, Müller, Renée) — not arbitrary
// unicode scripts, but the name appears in the Gemini prompt so we
// want to be conservative anyway. Caps at 32 chars.
export function sanitizePetName(name: string): string {
  return name
    .normalize("NFC")
    .replace(/[^A-Za-zÀ-ɏ\s'\-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32);
}

// Compose the multi-pet prompt. The leading header tells Gemini we are
// rendering a group portrait of N specific individuals; the inline
// STYLE_PROMPTS[style] keeps every single-pet artistic instruction
// (brushwork, lighting, framing nouns) intact. Then a name-rendering
// suffix is appended only when names were supplied.
export function buildMultiPetPrompt(
  style: StyleKey,
  petCount: number,
  petNames: string[]
): string {
  const baseStylePrompt = STYLE_PROMPTS[style];
  if (!baseStylePrompt) throw new Error(`Unknown style: ${style}`);

  // The single-pet prompts start with "The first image is a pet photo.
  // The second image is a <style> reference." — we don't want that wording
  // for multi-pet (the indexing is different). Strip the leading sentence
  // so the rest of the carefully-tuned style description carries over.
  const styleBody = baseStylePrompt.replace(
    /^The first image is a pet photo\. The second image is a [^.]+\.\s*/,
    ""
  );

  const cleanNames = petNames.slice(0, petCount).map(sanitizePetName);
  const hasNames = cleanNames.some((n) => n.length > 0);

  const namedList = cleanNames
    .map((n, i) => (n ? `Pet ${i + 1} is named "${n}"` : `Pet ${i + 1} (no name)`))
    .join("; ");

  const header = `You are creating a GROUP PORTRAIT of ${petCount} pets that belong to the same family. The first ${petCount} images are photos of those ${petCount} different pets, in order. The image after that (if present) is a style reference for the artistic finish.

COMPOSITION — non-negotiable:
- Render all ${petCount} pets together in ONE unified scene. The output is a SINGLE image, not a collage, not a grid, not separate panels.
- Pose the pets as if they are sitting for a real group portrait — natural overlapping arrangement, similar visual weight, none cropped out.
- Each individual pet must be recognizable: preserve each pet's exact facial features, fur color, ear shape, markings, eye color, breed character from its source photo. Do not blend pets into a single composite animal. Do not duplicate one pet across the canvas.
- Arrange the pets in a single row or balanced cluster, all at approximately equal distance from the camera, all facing the viewer (camera) directly or with at most a 15° head turn.
- Center the group horizontally. Equal background margins on the left and right of the outermost pet.
- Pet identity reference: ${namedList}.

ARTISTIC STYLE — apply the same aesthetic to every pet equally so the portrait reads as one cohesive piece:
${styleBody}`;

  const nameInstruction = hasNames
    ? `

NAMEPLATE / TITLE — render the pets' names integrated into the artwork:
- Below each pet, render their name as elegant typography that matches the artistic style of the portrait (${nameTypographyFor(style)}).
- Names must be readable, well-spaced, and NOT overlap the pets themselves.
- Only render names that were provided — leave space blank where a name was omitted.
- Do not invent additional words, captions, dates, or signatures. Only the names listed above.
- Names to render in order, left to right: ${cleanNames.map((n) => (n ? `"${n}"` : "(blank)")).join(", ")}.`
    : `

NO TEXT — do not render any text, names, captions, dates, signatures, or watermarks in the image.`;

  return header + nameInstruction;
}

// Per-style typography hint, kept inline so each style's name placard
// matches its artistic vocabulary instead of all looking the same.
function nameTypographyFor(style: StyleKey): string {
  switch (style) {
    case "watercolor":
      return "soft hand-lettered script in muted ink, as if brushed onto the watercolor paper";
    case "oil":
      return "classical serif type rendered as if painted with the same oil pigments";
    case "renaissance":
      return "ornate Roman capitals in gold leaf or rich umber, period-appropriate Renaissance lettering";
    case "lineart":
      return "minimalist thin sans-serif in the same graphite tone as the linework";
    default:
      return "clean, modern lettering that complements the artwork";
  }
}

export async function generateMultiPetPortrait(
  petPhotoBuffers: Buffer[],
  style: StyleKey,
  petNames: string[]
): Promise<Buffer> {
  if (petPhotoBuffers.length < MIN_PETS || petPhotoBuffers.length > MAX_PETS) {
    throw new Error(
      `Multi-pet generation requires ${MIN_PETS}–${MAX_PETS} pets, got ${petPhotoBuffers.length}`
    );
  }

  const prompt = buildMultiPetPrompt(style, petPhotoBuffers.length, petNames);

  // Build the multimodal parts: text prompt + N pet photos + optional style ref.
  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [{ text: prompt }];

  for (const buf of petPhotoBuffers) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: buf.toString("base64"),
      },
    });
  }

  // Same style reference image lookup pattern as single-pet — keeps the
  // aesthetic anchor consistent between the two pipelines.
  const refFilename =
    style === "oil" ? "oil-painting" : style === "lineart" ? "line-art" : style;
  const refPath = path.join(process.cwd(), "references", `${refFilename}.jpg`);
  if (fs.existsSync(refPath)) {
    const refBuffer = fs.readFileSync(refPath);
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: refBuffer.toString("base64"),
      },
    });
  }

  // Same shared core as single-pet + wallpaper: bounded 80s/attempt timeout +
  // 3x retry on stochastic empty generations, terminal on real safety blocks.
  // Multi-pet sends N photos so a no-image whiff is at least as likely; the
  // old single unguarded call meant ~1 in 5 multi-pet orders failed outright.
  return generateGeminiImage(parts, `multi-pet:${style}`, "3:4");
}

// ─── ImageId encoding ─────────────────────────────────────────────────
// Single-pet imageId = raw UUID (legacy, unchanged).
// Multi-pet imageId = "multi<N>_<uuid>" where N ∈ {2,3,4}.
// Parsing is centralized here so checkout / download / webhook can all
// decode petCount from the imageId alone — no DB lookup needed, no
// schema migration, and a single-pet imageId is byte-identical to today.

const MULTI_PREFIX_RE = /^multi([2-4])_(.+)$/;

export function encodeMultiImageId(petCount: number, uuid: string): string {
  if (petCount < MIN_PETS || petCount > MAX_PETS) {
    throw new Error(`Invalid pet count ${petCount}`);
  }
  return `multi${petCount}_${uuid}`;
}

export function parsePetCountFromImageId(imageId: string): number {
  const m = imageId.match(MULTI_PREFIX_RE);
  return m ? parseInt(m[1], 10) : 1;
}

// Per-additional-pet surcharge in CENTS. Matches the agreed pricing:
// 1 pet = base, 2 pets = base + $15, 3 pets = base + $30, 4 pets = base + $45.
export const MULTIPET_SURCHARGE_CENTS_PER_EXTRA = 1500;

export function multiPetSurchargeCents(petCount: number): number {
  return Math.max(0, petCount - 1) * MULTIPET_SURCHARGE_CENTS_PER_EXTRA;
}
