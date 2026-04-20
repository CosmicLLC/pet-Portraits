import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createProdigiOrder,
  getCanvasSku,
  isProdigiConfigured,
  type ProdigiAddress,
} from "@/lib/prodigi";
import { logEvent } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Manually (re)submit a canvas/bundle order to Prodigi. Used by admin when
// the automatic call from the Stripe webhook failed, or when Prodigi wasn't
// yet configured at purchase time.
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isProdigiConfigured()) {
    return NextResponse.json(
      { error: "Prodigi is not configured. Set PRODIGI_API_KEY and PRODIGI_CANVAS_SKU." },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (order.productType !== "canvas" && order.productType !== "bundle") {
    return NextResponse.json({ error: "Not a physical order" }, { status: 400 });
  }

  if (order.prodigiOrderId) {
    return NextResponse.json(
      { error: "Order already submitted to Prodigi", prodigiOrderId: order.prodigiOrderId },
      { status: 409 }
    );
  }

  const addr = order.shippingAddress as Record<string, string | null> | null;
  if (!addr || !order.shippingName) {
    return NextResponse.json(
      { error: "Order has no shipping address — cannot submit to printer" },
      { status: 400 }
    );
  }

  const prodigiAddress: ProdigiAddress = {
    line1: addr.line1 ?? "",
    line2: addr.line2 ?? undefined,
    townOrCity: addr.city ?? "",
    stateOrCounty: addr.state ?? undefined,
    postalOrZipCode: addr.postal_code ?? "",
    countryCode: addr.country ?? "US",
  };

  try {
    const prodigi = await createProdigiOrder({
      merchantReference: order.id,
      sku: getCanvasSku(),
      imageUrl: order.portraitBlobUrl,
      recipient: {
        name: order.shippingName,
        email: order.email,
        address: prodigiAddress,
      },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: {
        prodigiOrderId: prodigi.order.id,
        prodigiStatus: "InProgress",
        prodigiStage: prodigi.order.status.stage,
      },
    });
    await logEvent("info", "admin", "Prodigi order submitted by admin", {
      orderId: order.id,
      prodigiOrderId: prodigi.order.id,
      actor: session.user?.email,
    });
    return NextResponse.json({ ok: true, prodigiOrderId: prodigi.order.id });
  } catch (err) {
    console.error("Admin Prodigi retry failed:", err);
    await prisma.order.update({
      where: { id: order.id },
      data: { prodigiStatus: "Failed" },
    }).catch(() => {});
    await logEvent("error", "admin", "Prodigi retry failed", {
      orderId: order.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Prodigi call failed" },
      { status: 500 }
    );
  }
}
