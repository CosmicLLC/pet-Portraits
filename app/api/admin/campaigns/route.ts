import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendCampaign } from "@/lib/email-marketing"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== "admin") return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      subject: true,
      status: true,
      recipients: true,
      delivered: true,
      failed: true,
      sentAt: true,
      createdAt: true,
    },
  })
  return NextResponse.json({ campaigns })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { subject?: string; htmlBody?: string; textBody?: string }
  try { body = await req.json() } catch { body = {} }

  const subject = (body.subject || "").trim()
  const htmlBody = (body.htmlBody || "").trim()
  const textBody = body.textBody?.trim() || undefined

  if (!subject || !htmlBody) {
    return NextResponse.json({ error: "subject and htmlBody are required" }, { status: 400 })
  }
  if (subject.length > 200) {
    return NextResponse.json({ error: "subject too long" }, { status: 400 })
  }

  try {
    const result = await sendCampaign(
      { subject, htmlBody, textBody },
      session.user?.id ?? null
    )
    return NextResponse.json(result)
  } catch (err) {
    console.error("Campaign send failed:", err)
    return NextResponse.json({ error: "Failed to send campaign" }, { status: 500 })
  }
}
