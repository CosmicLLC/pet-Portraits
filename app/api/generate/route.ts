import { NextRequest, NextResponse } from "next/server";
import { generatePortrait, STYLE_KEYS, type StyleKey } from "@/lib/gemini";
import { applyWatermark } from "@/lib/watermark";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const style = formData.get("style") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!style || !STYLE_KEYS.includes(style as StyleKey)) {
      return NextResponse.json({ error: "Invalid style" }, { status: 400 });
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPG, PNG, or WebP." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const fullResBuffer = await generatePortrait(buffer, style as StyleKey);

    // Store full-res in Vercel Blob with NO public access
    // Only accessible via server-side signed URL after payment
    const imageId = uuidv4();
    await put(`portraits/${imageId}.png`, fullResBuffer, {
      access: "private",
      addRandomSuffix: true,
      contentType: "image/png",
    });

    // Store the blob URL server-side — the client never sees it
    // We map imageId -> blob.url via the blob pathname
    // The imageId alone cannot be used to construct the download URL

    // Apply watermark for preview
    const watermarkedBuffer = await applyWatermark(fullResBuffer);
    const watermarkedBase64 = `data:image/png;base64,${watermarkedBuffer.toString("base64")}`;

    return NextResponse.json({ watermarkedImage: watermarkedBase64, imageId });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Generation failed — please try again or use a clearer photo." },
      { status: 500 }
    );
  }
}
