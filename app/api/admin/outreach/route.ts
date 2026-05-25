import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PET_BLOGGER_SEED } from "@/lib/outreach-seed"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== "admin") return null
  return session
}

// GET — list contacts (with optional ?status= filter)
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const status = req.nextUrl.searchParams.get("status")
  const where = status && status !== "all" ? { status } : {}
  const contacts = await prisma.outreachContact.findMany({
    where,
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  })
  // Counts by status for the pipeline header
  const allCounts = await prisma.outreachContact.groupBy({
    by: ["status"],
    _count: true,
  })
  const counts = allCounts.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = c._count
    return acc
  }, {})
  return NextResponse.json({
    contacts: contacts.map((c) => ({
      ...c,
      sentAt: c.sentAt?.toISOString() ?? null,
      repliedAt: c.repliedAt?.toISOString() ?? null,
      acceptedAt: c.acceptedAt?.toISOString() ?? null,
      postedAt: c.postedAt?.toISOString() ?? null,
      followUpAt: c.followUpAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    counts,
  })
}

// POST — create a new contact OR seed the 9 pet bloggers (action=seed)
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))

  if (body.action === "seed") {
    // Idempotent — checks existing by handle before creating
    const existing = await prisma.outreachContact.findMany({
      select: { handle: true },
    })
    const existingHandles = new Set(existing.map((e) => e.handle))
    const toCreate = PET_BLOGGER_SEED.filter((s) => !existingHandles.has(s.handle))
    if (toCreate.length === 0) {
      return NextResponse.json({ ok: true, created: 0, skipped: PET_BLOGGER_SEED.length })
    }
    await prisma.outreachContact.createMany({
      data: toCreate.map((s) => ({
        name: s.name,
        channel: s.channel,
        handle: s.handle,
        email: s.email,
        url: s.url,
        niche: s.niche,
        priority: s.priority,
        subject: s.subject,
        body: s.body,
        notes: s.notes,
      })),
    })
    return NextResponse.json({ ok: true, created: toCreate.length, skipped: PET_BLOGGER_SEED.length - toCreate.length })
  }

  // Manual create
  if (!body.name || !body.handle || !body.channel) {
    return NextResponse.json({ error: "name, handle, channel required" }, { status: 400 })
  }
  const c = await prisma.outreachContact.create({
    data: {
      name: body.name,
      handle: body.handle,
      channel: body.channel,
      email: body.email || null,
      url: body.url || null,
      niche: body.niche || null,
      followers: typeof body.followers === "number" ? body.followers : null,
      priority: body.priority || 2,
      subject: body.subject || null,
      body: body.body || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json({ ok: true, id: c.id })
}

// PATCH — update a contact's status / fields
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })

  // Auto-stamp the relevant timestamp when a status transitions.
  const data: Record<string, unknown> = {}
  if (typeof body.status === "string") {
    data.status = body.status
    const now = new Date()
    if (body.status === "sent" && !body.sentAt) data.sentAt = now
    if (body.status === "replied" && !body.repliedAt) data.repliedAt = now
    if (body.status === "accepted" && !body.acceptedAt) data.acceptedAt = now
    if (body.status === "posted" && !body.postedAt) data.postedAt = now
  }
  for (const key of ["name", "handle", "channel", "email", "url", "niche", "subject", "body", "notes"]) {
    if (typeof body[key] === "string") data[key] = body[key]
  }
  if (typeof body.followers === "number") data.followers = body.followers
  if (typeof body.priority === "number") data.priority = body.priority

  await prisma.outreachContact.update({ where: { id: body.id }, data })
  return NextResponse.json({ ok: true })
}

// DELETE — remove a contact
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await prisma.outreachContact.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
