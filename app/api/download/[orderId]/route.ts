import { NextRequest, NextResponse } from "next/server"
import { list } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { verifyDownloadToken, verifyCartItemToken } from "@/lib/download-token"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const IMAGEID_RE = /^(multi[2-4]_)?[A-Za-z0-9-]+$/

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const orderId = params.orderId
  const img = req.nextUrl.searchParams.get("img")
  const itok = req.nextUrl.searchParams.get("itok")

  let blobUrl: string | null = null
  let filename = "paw-masterpiece-portrait.png"
  let fallbackType = "image/png"

  if (img && itok) {
    // ── Multi-portrait CART per-item link ──────────────────────────────
    // Auth is an HMAC bound to orderId + this exact imageId (signCartItemToken),
    // so a link can only fetch the one image it was minted for. No DB row /
    // cart-items column needed — we resolve portraits/<imageId> directly.
    if (!IMAGEID_RE.test(img) || !verifyCartItemToken(orderId, img, itok)) {
      return NextResponse.json(
        { error: "Invalid or expired download link. Ask support to resend." },
        { status: 403 }
      )
    }
    const { blobs } = await list({ prefix: `portraits/${img}` })
    blobUrl = blobs.length ? blobs[0].url : null
    filename = "paw-masterpiece-portrait.png"
  } else {
    // ── Legacy single-item link (order-scoped token + expiry) ──────────
    const token = req.nextUrl.searchParams.get("token")
    const expRaw = req.nextUrl.searchParams.get("exp")
    const exp = expRaw ? parseInt(expRaw, 10) : NaN
    const type = req.nextUrl.searchParams.get("type") === "wallpaper" ? "wallpaper" : "portrait"

    if (!token || !Number.isFinite(exp) || !verifyDownloadToken(orderId, token, exp)) {
      return NextResponse.json(
        { error: "Invalid or expired download link. Ask support to resend." },
        { status: 403 }
      )
    }
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    blobUrl = type === "wallpaper" ? order.wallpaperBlobUrl : order.portraitBlobUrl
    filename = type === "wallpaper" ? "paw-masterpiece-wallpaper.jpg" : "paw-masterpiece-portrait.png"
    fallbackType = type === "wallpaper" ? "image/jpeg" : "image/png"
  }

  if (!blobUrl) {
    return NextResponse.json({ error: "File not available" }, { status: 404 })
  }

  // Stream the blob through our server so the raw (private) blob URL never
  // leaves the building. Private-access reads use BLOB_READ_WRITE_TOKEN.
  const upstream = await fetch(blobUrl, {
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
      "Content-Type": upstream.headers.get("content-type") || fallbackType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
