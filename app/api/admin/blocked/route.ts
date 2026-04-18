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

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const blocked = await prisma.blockedEmail.findMany({ orderBy: { blockedAt: "desc" } })
  return NextResponse.json({ blocked })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  let body: { email?: string; reason?: string }
  try { body = await req.json() } catch { body = {} }
  const email = (body.email || "").trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }
  await prisma.blockedEmail.upsert({
    where: { email },
    create: { email, reason: body.reason || null },
    update: { reason: body.reason || null },
  })
  // Also unsubscribe them from marketing immediately
  await prisma.subscriber.updateMany({
    where: { email },
    data: { unsubscribedAt: new Date() },
  }).catch(() => {})
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase()
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })
  await prisma.blockedEmail.delete({ where: { email } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
