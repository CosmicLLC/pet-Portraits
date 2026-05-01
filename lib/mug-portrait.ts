// Magic-mug portrait generator.
//
// Takes a pet photo, runs it through Gemini with a mug-specific prompt that
// generates a portrait centered on a solid background color, then composites
// the result onto an exact 2700×1050px banner (mug wrap-around aspect ratio,
// 300 DPI) so the print arrives at the right physical size on Prodigi's mug
// SKU. Background color is configurable so admins can match the heat-reveal
// contrast they want.

import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";

let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    _ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 180000 } });
  }
  return _ai;
}

// Final output dimensions for an 11oz magic mug print.
export const MUG_WIDTH = 2700;
export const MUG_HEIGHT = 1050;
export const MUG_DPI = 300;

// Curated palette — rich enough to give visible heat-reveal contrast on the
// magic mug, never white or near-white. Hex values match the brief.
export const MUG_BACKGROUND_PRESETS = [
  { name: "Warm Cream", hex: "#F5E6D3" },
  { name: "Dusty Rose", hex: "#D4A5A5" },
  { name: "Sage Green", hex: "#B8C5A6" },
  { name: "Soft Navy", hex: "#2C3E50" },
] as const;

export type MugBackgroundName = (typeof MUG_BACKGROUND_PRESETS)[number]["name"];

// Convert a hex string to a Sharp-compatible RGB(A) object.
function hexToRgb(hex: string): { r: number; g: number; b: number; alpha: number } {
  const normalized = hex.replace(/^#/, "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
    alpha: 1,
  };
}

// Build the Gemini prompt with the chosen background color baked in. Kept
// verbatim from the brief — the trailing DO NOTs are load-bearing for
// keeping the heat-reveal mug working (no white backgrounds, no extra
// subjects, no text).
function buildMugPrompt(backgroundHex: string, backgroundName: string): string {
  return `Transform this pet photo into a custom portrait optimized for an 11oz magic mug print:

REQUIREMENTS:
- Final image dimensions: 2700 x 1050 pixels (wide banner aspect ratio, ~2.57:1)
- Resolution: 300 DPI
- Color profile: sRGB
- Format: PNG

COMPOSITION:
- Place the pet centered in the middle third of the canvas
- Pet should occupy ~70% of the vertical space, leaving 15% padding top and bottom
- Crop pet at upper chest/shoulders (portrait style, not full body)
- Eyes must be sharp, expressive, and centered horizontally
- Pet facing slightly toward camera (3/4 angle preferred)

BACKGROUND:
- Single solid color background filling the entire 2700 x 1050 canvas
- Background color must be: ${backgroundName} (${backgroundHex})
- No gradients, no patterns, no textures — completely flat solid color
- No additional decorative elements, text, or borders

STYLE:
- Premium illustrated portrait style (similar to gallery pet portraits)
- Clean, polished, gift-worthy aesthetic
- Maintain the pet's actual coloring, markings, and distinctive features
- Soft realistic rendering, not cartoon or overly stylized

OUTPUT:
- 2700 x 1050 pixels exactly
- PNG format
- High contrast between pet and background for clear visibility when revealed on the mug

DO NOT:
- Add hands, owners, or other subjects
- Include text, names, or watermarks
- Use multiple background colors or scenic backgrounds
- Add props (collars beyond what's in original photo, hats, accessories) unless requested
- Use white or very light backgrounds (low contrast on the heat-reveal mug)`;
}

async function callGemini(petPhotoBuffer: Buffer, prompt: string): Promise<Buffer> {
  const response = await getAI().models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/png",
              data: petPhotoBuffer.toString("base64"),
            },
          },
        ],
      },
    ],
    config: { responseModalities: ["IMAGE", "TEXT"] },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No response from Gemini");
  for (const part of parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, "base64");
    }
  }
  throw new Error("No image data in Gemini response");
}

// Take Gemini's output (typically ~1024×1024) and force it to the exact
// 2700×1050 banner needed for the mug. The portrait is fit by height onto
// the banner and centered horizontally, with the same solid color filling
// the remaining horizontal space — so the wrap-around looks continuous.
async function composeMugBanner(
  geminiBuffer: Buffer,
  backgroundHex: string
): Promise<Buffer> {
  const bgColor = hexToRgb(backgroundHex);

  // Resize the AI output so its height matches the mug banner. `inside`
  // preserves aspect ratio, so the width may be smaller — that's fine, the
  // background fill takes care of the sides.
  const portraitResized = await sharp(geminiBuffer)
    .resize(MUG_WIDTH, MUG_HEIGHT, { fit: "inside" })
    .png()
    .toBuffer();

  // Composite the resized portrait centered onto a fresh banner canvas
  // filled with the chosen background. Sharp centers automatically when we
  // omit a position with `gravity: "center"`.
  return sharp({
    create: {
      width: MUG_WIDTH,
      height: MUG_HEIGHT,
      channels: 3,
      background: bgColor,
    },
  })
    .composite([{ input: portraitResized, gravity: "center" }])
    .withMetadata({ density: MUG_DPI })
    .png()
    .toBuffer();
}

export type MugPortraitOptions = {
  petPhoto: Buffer;
  backgroundHex: string;
  backgroundName: string;
};

export async function generateMugPortrait(opts: MugPortraitOptions): Promise<Buffer> {
  const prompt = buildMugPrompt(opts.backgroundHex, opts.backgroundName);
  const aiOutput = await callGemini(opts.petPhoto, prompt);
  return composeMugBanner(aiOutput, opts.backgroundHex);
}
