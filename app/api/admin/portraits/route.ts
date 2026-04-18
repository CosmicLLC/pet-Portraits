import { NextRequest, NextResponse } from "next/server"
import { list } from "@vercel/blob"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const cursor = req.nextUrl.searchParams.get("cursor") || undefined
  const { blobs, cursor: next } = await list({ prefix: "portraits/", limit: 60, cursor })

  // Map imageId -> order (if any) so admin can see buyer context
  const imageIds = blobs
    .map((b) => {
      const m = b.pathname.match(/^portraits\/([^.]+?)(?:-[A-Za-z0-9]{21})?\.png$/)
      return m?.[1] || null
    })
    .filter(Boolean) as string[]

  const orders = await prisma.order.findMany({
    where: { imageId: { in: imageIds } },
    select: { imageId: true, email: true, productType: true, createdAt: true },
  })
  const byImageId = new Map(orders.map((o) => [o.imageId, o]))

  return NextResponse.json({
    portraits: blobs.map((b) => {
      const m = b.pathname.match(/^portraits\/([^.]+?)(?:-[A-Za-z0-9]{21})?\.png$/)
      const imageId = m?.[1] || null
      const order = imageId ? byImageId.get(imageId) : undefined
      return {
        pathname: b.pathname,
        size: b.size,
        uploadedAt: b.uploadedAt,
        imageId,
        order: order
          ? { email: order.email, productType: order.productType, createdAt: order.createdAt }
          : null,
      }
    }),
    nextCursor: next || null,
  })
}
