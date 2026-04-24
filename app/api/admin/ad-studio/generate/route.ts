import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleGenAI, PersonGeneration } from "@google/genai";
import { logEvent } from "@/lib/events";

// Admin-gated Imagen 4 text-to-image endpoint powering the Ad Studio's
// "Generate with AI" button. Piggybacks on the existing GEMINI_API_KEY so
// there's no new env var or billing surface to wire up.
//
// Input:  { prompt: string, aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" }
// Output: { imageBase64: string, mimeType: "image/png" }

export const maxDuration = 60;

let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");
    _ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 120000 } });
  }
  return _ai;
}

const ALLOWED_ASPECT = new Set(["1:1", "3:4", "4:3", "9:16", "16:9"]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { prompt?: unknown; aspectRatio?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const aspectRatio =
    typeof body.aspectRatio === "string" && ALLOWED_ASPECT.has(body.aspectRatio)
      ? body.aspectRatio
      : "1:1";

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  if (prompt.length > 4000) {
    return NextResponse.json({ error: "Prompt too long (max 4000 chars)" }, { status: 400 });
  }

  try {
    const response = await getAI().models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio,
        // Ads feature real adults; ALLOW_ADULT is the permissive-for-people
        // setting without allowing minors in generated images.
        personGeneration: PersonGeneration.ALLOW_ADULT,
      },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      throw new Error("Imagen returned no image bytes");
    }

    return NextResponse.json({
      imageBase64: imageBytes,
      mimeType: "image/png",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Ad Studio image generation failed:", message);
    await logEvent("error", "generate", "Ad Studio Imagen failed", {
      error: message,
      prompt: prompt.slice(0, 200),
      aspectRatio,
      adminEmail: session.user.email,
    }).catch(() => {});
    return NextResponse.json(
      { error: message.includes("safety") ? "Prompt blocked by safety filters — try different wording." : "Image generation failed." },
      { status: 500 }
    );
  }
}
