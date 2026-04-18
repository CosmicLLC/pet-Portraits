import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyUnsubToken } from "@/lib/unsub-token"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function handle(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase()
  const token = req.nextUrl.searchParams.get("token") || ""
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || ""

  if (!email || !token || !verifyUnsubToken(email, token)) {
    return NextResponse.redirect(`${base}/unsubscribe?status=invalid`)
  }

  try {
    await prisma.subscriber.updateMany({
      where: { email },
      data: { unsubscribedAt: new Date() },
    })
  } catch (err) {
    console.error("Unsubscribe DB update failed:", err)
  }

  return NextResponse.redirect(`${base}/unsubscribe?status=ok&email=${encodeURIComponent(email)}`)
}

export async function GET(req: NextRequest) {
  return handle(req)
}

// RFC 8058 one-click unsubscribe — Gmail/Outlook POST to the List-Unsubscribe URL
// with `List-Unsubscribe=One-Click` when the user clicks the mail client's button.
export async function POST(req: NextRequest) {
  return handle(req)
}
