import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveCampaign } from "@/lib/campaigns";
import { isPhysicalProduct } from "@/lib/products";

// Polled by the success page to decide whether to render the "claim your
// free display print" form. Returns the order's bonus status so the form
// can hide itself once claimed and the UI shows the right state.
//
// GET /api/orders/bonus-status?session_id=<stripe_session_id>
// → { order: { id, productType, claimed: bool }, eligible: bool } or
//   { order: null } if webhook hasn't fired yet (client retries).
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    select: {
      id: true,
      productType: true,
      createdAt: true,
      bonusClaimedAt: true,
      bonusProdigiOrderId: true,
    },
  });

  if (!order) {
    // Webhook hasn't fired yet — client retries.
    return NextResponse.json({ order: null });
  }

  // Eligible when: campaign active on order date, order is NOT physical
  // (physical orders get the bonus auto-fulfilled), and not yet claimed.
  const iso = order.createdAt.toISOString().slice(0, 10);
  const campaign = getActiveCampaign(iso);
  const isPhysical = isPhysicalProduct(order.productType);
  const eligible =
    !!campaign?.freeBonusProductType &&
    !isPhysical &&
    !order.bonusClaimedAt;

  return NextResponse.json({
    order: {
      id: order.id,
      productType: order.productType,
      claimed: !!order.bonusClaimedAt,
    },
    eligible,
    bonusProductType: campaign?.freeBonusProductType ?? null,
  });
}
