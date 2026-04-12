import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const STYLE_PROMPTS: Record<string, string> = {
  watercolor: `The first image is a pet photo. The second image is a watercolor style reference. Transform the pet from the first image into a fine art watercolor portrait matching the aesthetic, color palette, and brushwork style of the second image. Preserve the pet's exact likeness, facial features, fur color, and markings. Style: loose expressive brushstrokes, soft wet-on-wet blending, delicate ink outlines, pastel and muted tones, white watercolor paper texture background. Composition: centered subject, generous white space around the pet, head and shoulders framing. Print quality: high detail in face and eyes, gallery-worthy illustration, no text, no watermarks, square format.`,

  oil: `The first image is a pet photo. The second image is an oil painting style reference. Transform the pet from the first image into a classical fine art oil painting portrait matching the aesthetic of the second image. Preserve the pet's exact likeness, facial features, fur color, and markings. Style: rich impasto brushwork, Flemish portrait tradition, warm dramatic lighting from one side, deep jewel-toned or dark neutral background, museum quality finish. Composition: centered subject, formal portrait framing, head and chest visible. Print quality: highly detailed fur texture, luminous eyes, gallery-worthy illustration, no text, no watermarks, square format.`,

  renaissance: `The first image is a pet photo. The second image is a Renaissance portrait style reference. Transform the pet from the first image into a Renaissance royal court portrait matching the aesthetic of the second image. Preserve the pet's exact likeness, facial features, fur color, and markings. Style: 16th-century Flemish oil painting, the pet wearing an ornate velvet robe or jeweled collar, gold leaf accents, rich burgundy or forest green draped fabric background with subtle ornate frame elements at edges. Composition: formal noble pose, centered, head and upper body, dignified regal expression. Print quality: museum-quality detail, highly realistic painting style, no text, no watermarks, square format.`,

  lineart: `The first image is a pet photo. The second image is a line art style reference. Transform the pet from the first image into a minimalist fine line art portrait matching the aesthetic of the second image. Preserve the pet's exact likeness, facial features, fur texture, and markings. Style: precise graphite pencil linework, continuous line drawing technique, cross-hatching for depth and shadow, clean white background, no filled color areas, monochrome. Composition: centered subject, head and shoulders, elegant negative space. Print quality: crisp architectural drawing precision, frameable wall art quality, no text, no watermarks, square format.`,
};

export const STYLE_KEYS = ["watercolor", "oil", "renaissance", "lineart"] as const;

export type StyleKey = (typeof STYLE_KEYS)[number];

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

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
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
