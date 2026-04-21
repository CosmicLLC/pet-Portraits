import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyDownloadToken } from "@/lib/download-token"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const token = req.nextUrl.searchParams.get("token")
  const expRaw = req.nextUrl.searchParams.get("exp")
  const exp = expRaw ? parseInt(expRaw, 10) : NaN
  const type = req.nextUrl.searchParams.get("type") === "wallpaper" ? "wallpaper" : "portrait"

  if (!token || !Number.isFinite(exp) || !verifyDownloadToken(params.orderId, token, exp)) {
    return NextResponse.json(
      { error: "Invalid or expired download link. Ask support to resend." },
      { status: 403 }
    )
  }

  const order = await prisma.order.findUnique({ where: { id: params.orderId } })
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const blobUrl = type === "wallpaper" ? order.wallpaperBlobUrl : order.portraitBlobUrl
  if (!blobUrl) {
    return NextResponse.json({ error: "File not available" }, { status: 404 })
  }

  // Stream the blob through our server so the raw blob URL never leaves the building.
  // Vercel Blob private-access reads use BLOB_READ_WRITE_TOKEN on the server side.
  const upstream = await fetch(blobUrl, {
    headers: process.env.BLOB_READ_WRITE_TOKEN
      ? { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
      : {},
  })
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 })
  }

  const filename =
    type === "wallpaper"
      ? "paw-masterpiece-wallpaper.jpg"
      : "paw-masterpiece-portrait.png"
  const contentType =
    upstream.headers.get("content-type") ||
    (type === "wallpaper" ? "image/jpeg" : "image/png")

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
