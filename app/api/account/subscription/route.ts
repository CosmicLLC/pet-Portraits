import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Toggle the signed-in user's marketing email subscription. Mirrors the
// logic used by /unsubscribe but is initiated from the logged-in dashboard.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { subscribed?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const subscribed = body.subscribed === true
  const email = session.user.email.toLowerCase()

  if (subscribed) {
    // Re-subscribe — or create if they've never been on the list
    await prisma.subscriber.upsert({
      where: { email },
      create: { email, source: "account" },
      update: { unsubscribedAt: null },
    })
  } else {
    // Unsubscribe — upsert in case the record doesn't exist yet
    await prisma.subscriber.upsert({
      where: { email },
      create: { email, source: "account", unsubscribedAt: new Date() },
      update: { unsubscribedAt: new Date() },
    })
  }

  return NextResponse.json({ ok: true, subscribed })
}
