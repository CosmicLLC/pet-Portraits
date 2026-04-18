import { NextRequest, NextResponse } from "next/server"
import { list } from "@vercel/blob"
import { auth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Admin-only: streams the full-resolution (unwatermarked) portrait for a given
// imageId without requiring a purchase. Session role must be "admin" — the
// auth.ts callback only assigns that role to ADMIN_EMAIL.
export async function GET(
  _req: NextRequest,
  { params }: { params: { imageId: string } }
) {
  const session = await auth()
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const imageId = params.imageId
  if (!imageId || !/^[A-Za-z0-9_-]+$/.test(imageId)) {
    return NextResponse.json({ error: "Invalid imageId" }, { status: 400 })
  }

  const { blobs } = await list({ prefix: `portraits/${imageId}` })
  if (!blobs.length) {
    return NextResponse.json({ error: "Portrait not found" }, { status: 404 })
  }

  const upstream = await fetch(blobs[0].url, {
    headers: process.env.BLOB_READ_WRITE_TOKEN
      ? { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
      : {},
  })
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 })
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "image/png",
      "Content-Disposition": `attachment; filename="paw-masterpiece-${imageId}.png"`,
      "Cache-Control": "private, no-store",
    },
  })
}
