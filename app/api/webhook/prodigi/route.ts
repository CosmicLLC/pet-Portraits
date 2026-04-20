import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTracking, type ProdigiOrderResponse } from "@/lib/prodigi";
import { sendPrintShippedEmail } from "@/lib/resend";
import { logEvent } from "@/lib/events";

// Prodigi pub/sub status webhook.
//
// Configure in Prodigi dashboard to POST to:
//   https://<your-domain>/api/webhook/prodigi?secret=<PRODIGI_WEBHOOK_SECRET>
//
// Subscribe to at minimum:
//   - com.prodigi.order.status.stage.changed
//   - com.prodigi.order.shipments.created
//
// We update our Order row and fire a tracking email the first time a shipment
// with a tracking number appears.

type ProdigiEvent = {
  specversion?: string;
  type?: string;
  id?: string;
  time?: string;
  data?: {
    order?: ProdigiOrderResponse["order"];
  };
};

export async function POST(req: NextRequest) {
  const expected = process.env.PRODIGI_WEBHOOK_SECRET;
  const provided = req.nextUrl.searchParams.get("secret");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: ProdigiEvent;
  try {
    event = (await req.json()) as ProdigiEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prodigiOrder = event.data?.order;
  if (!prodigiOrder?.id) {
    // Acknowledge unknown payload shapes so Prodigi doesn't retry forever.
    return NextResponse.json({ received: true, skipped: "no order id" });
  }

  const order = await prisma.order.findFirst({
    where: { prodigiOrderId: prodigiOrder.id },
  });
  if (!order) {
    console.warn(`Prodigi webhook for unknown order ${prodigiOrder.id}`);
    return NextResponse.json({ received: true, skipped: "unknown order" });
  }

  const { carrier, trackingNumber, trackingUrl } = extractTracking(prodigiOrder);
  const newStage = prodigiOrder.status?.stage ?? order.prodigiStage;

  // Normalize the coarse status field — anything with tracking means it's in the wild.
  const newStatus =
    newStage === "Complete"
      ? "Complete"
      : newStage === "Cancelled"
      ? "Cancelled"
      : trackingNumber
      ? "Shipped"
      : "InProgress";

  const justShipped = !order.shippedAt && trackingNumber;

  try {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        prodigiStage: newStage,
        prodigiStatus: newStatus,
        trackingNumber: trackingNumber ?? order.trackingNumber,
        trackingUrl: trackingUrl ?? order.trackingUrl,
        carrier: carrier ?? order.carrier,
        shippedAt: justShipped ? new Date() : order.shippedAt,
      },
    });
  } catch (err) {
    console.error("Prodigi webhook DB update failed:", err);
    await logEvent("error", "webhook", "Prodigi DB update failed", {
      prodigiOrderId: prodigiOrder.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  if (justShipped && trackingNumber) {
    try {
      await sendPrintShippedEmail(order.email, {
        carrier: carrier ?? "your carrier",
        trackingNumber,
        trackingUrl: trackingUrl ?? null,
      });
    } catch (err) {
      console.error("Tracking email failed:", err);
      await logEvent("error", "email", "Tracking email failed", {
        orderId: order.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ received: true });
}
