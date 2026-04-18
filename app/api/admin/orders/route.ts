import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== "admin") return null
  return session
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() || ""
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || "100"), 500)

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { imageId: { contains: q } },
          { stripeSessionId: { contains: q } },
        ],
      }
    : {}

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      stripeSessionId: true,
      stripePaymentIntent: true,
      email: true,
      imageId: true,
      productType: true,
      priceCents: true,
      addWallpaper: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ orders })
}
