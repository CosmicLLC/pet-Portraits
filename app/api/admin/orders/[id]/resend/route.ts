import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendDownloadEmail, sendCanvasConfirmationEmail } from "@/lib/resend"
import { signDownloadToken } from "@/lib/download-token"
import { logEvent } from "@/lib/events"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"
  const token = signDownloadToken(order.id)
  const downloadUrl = `${baseUrl}/api/download/${order.id}?token=${token}`
  const wallpaperUrl = order.wallpaperBlobUrl
    ? `${baseUrl}/api/download/${order.id}?token=${token}&type=wallpaper`
    : undefined

  try {
    if (order.productType === "digital" || order.productType === "wallpaper") {
      await sendDownloadEmail(order.email, downloadUrl, wallpaperUrl)
    } else if (order.productType === "canvas") {
      await sendCanvasConfirmationEmail(order.email)
    } else if (order.productType === "bundle") {
      await sendDownloadEmail(order.email, downloadUrl, wallpaperUrl)
      await sendCanvasConfirmationEmail(order.email)
    } else {
      // canvas_upsell or unknown — send the digital link.
      await sendDownloadEmail(order.email, downloadUrl, wallpaperUrl)
    }
    await logEvent("info", "admin", "Download email resent by admin", {
      orderId: order.id,
      email: order.email,
      actor: session.user?.email,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Resend failed:", err)
    await logEvent("error", "admin", "Resend download email failed", {
      orderId: order.id,
      email: order.email,
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: "Failed to resend email" }, { status: 500 })
  }
}
