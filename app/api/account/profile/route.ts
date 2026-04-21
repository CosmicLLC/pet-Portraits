import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Update the signed-in user's profile. Currently only `name` is editable —
// email/password changes go through the existing auth flows.
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { name?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const rawName = typeof body.name === "string" ? body.name.trim() : ""
  // Simple constraints — no HTML, keep it short enough to render in email
  // headers without blowing up. Empty name clears the field.
  if (rawName.length > 80) {
    return NextResponse.json({ error: "Name is too long (80 chars max)" }, { status: 400 })
  }
  if (/[<>]/.test(rawName)) {
    return NextResponse.json({ error: "Name can't contain < or >" }, { status: 400 })
  }

  await prisma.user.update({
    where: { email: session.user.email.toLowerCase() },
    data: { name: rawName || null },
  })

  return NextResponse.json({ ok: true })
}
