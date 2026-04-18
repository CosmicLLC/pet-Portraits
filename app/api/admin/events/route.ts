import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const type = req.nextUrl.searchParams.get("type") || undefined
  const source = req.nextUrl.searchParams.get("source") || undefined
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || "100"), 500)

  const events = await prisma.eventLog.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(source ? { source } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
  return NextResponse.json({ events })
}

// Delete all events older than N days (purge), or a specific id
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const id = req.nextUrl.searchParams.get("id")
  const purgeDays = req.nextUrl.searchParams.get("purgeDays")
  if (id) {
    await prisma.eventLog.delete({ where: { id } }).catch(() => null)
  } else if (purgeDays) {
    const cutoff = new Date(Date.now() - Number(purgeDays) * 86400000)
    await prisma.eventLog.deleteMany({ where: { createdAt: { lt: cutoff } } })
  }
  return NextResponse.json({ ok: true })
}
