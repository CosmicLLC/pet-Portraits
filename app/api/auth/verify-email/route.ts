import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { consumeVerifyToken } from "@/lib/auth-tokens"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase()
  const token = req.nextUrl.searchParams.get("token") || ""
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || ""

  if (!email || !token) {
    return NextResponse.redirect(`${base}/auth/signin?error=Verification`)
  }

  const ok = await consumeVerifyToken(email, token)
  if (!ok) {
    return NextResponse.redirect(`${base}/auth/signin?error=VerificationExpired`)
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  }).catch((err) => {
    console.error("Verify email DB update failed:", err)
  })

  return NextResponse.redirect(`${base}/auth/signin?verified=1`)
}
