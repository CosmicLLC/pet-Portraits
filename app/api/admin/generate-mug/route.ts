import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateMugPortrait, MUG_BACKGROUND_PRESETS } from "@/lib/mug-portrait"
import { logEvent } from "@/lib/events"

// Gemini + Sharp can take 30-50s on a single mug portrait.
export const maxDuration = 60
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const HEX_RE = /^#[0-9a-fA-F]{6}$/

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const form = await req.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 })
  }

  const file = form.get("image") as File | null
  if (!file) return NextResponse.json({ error: "Missing image" }, { status: 400 })

  const validTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!validTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type — JPG, PNG, or WebP only" },
      { status: 400 }
    )
  }

  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large — 15MB max" }, { status: 400 })
  }

  // Background can be picked from the preset list by name, or supplied as a
  // raw hex for ad-hoc colors. Either path validates against simple rules.
  const presetName = (form.get("backgroundName") as string | null) ?? ""
  const customHex = ((form.get("backgroundHex") as string | null) ?? "").trim()
  const preset = MUG_BACKGROUND_PRESETS.find((p) => p.name === presetName)

  let backgroundHex: string
  let backgroundName: string
  if (preset) {
    backgroundHex = preset.hex
    backgroundName = preset.name
  } else if (HEX_RE.test(customHex)) {
    backgroundHex = customHex.toUpperCase()
    backgroundName = `Custom ${backgroundHex}`
  } else {
    return NextResponse.json(
      { error: "Pick a preset or pass a #RRGGBB color via backgroundHex" },
      { status: 400 }
    )
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const png = await generateMugPortrait({
      petPhoto: buffer,
      backgroundHex,
      backgroundName,
    })

    await logEvent("info", "admin", "Mug portrait generated", {
      actor: session.user?.email,
      backgroundHex,
      sourceSize: file.size,
      outputSize: png.length,
    })

    // Stream the PNG straight back. The client triggers the download from
    // the response blob, no need to upload to storage for a one-off admin
    // tool. Cast to Uint8Array — Node's Buffer satisfies BodyInit at runtime
    // but the static types don't always agree.
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="mug-print-${Date.now()}.png"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (err) {
    console.error("Mug portrait generation failed:", err)
    await logEvent("error", "admin", "Mug portrait generation failed", {
      actor: session.user?.email,
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    )
  }
}
