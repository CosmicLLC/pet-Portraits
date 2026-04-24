import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveCampaign } from "@/lib/campaigns";
import { isPhysicalProduct } from "@/lib/products";
import {
  createProdigiOrder,
  getProdigiAttributesForProduct,
  getProdigiSkuForProduct,
  isProdigiConfigured,
  isProdigiSkuConfigured,
  type ProdigiAddress,
} from "@/lib/prodigi";
import { logEvent } from "@/lib/events";
import { rateLimit, clientIp } from "@/lib/ratelimit";

// Claim the campaign free-bonus print for a digital-only order. Verifies
// the order is eligible (campaign active, digital-only, not already
// claimed), creates a Prodigi order at the supplied shipping address
// using the portrait image from the original order, and persists the
// claim so it can't be run twice.
//
// POST /api/orders/claim-bonus
// Body: { sessionId, name, address: { line1, line2?, city, state, postalCode, country? } }
// → { ok: true, bonusProdigiOrderId } or { error }

export const maxDuration = 60;

interface ClaimBody {
  sessionId?: string;
  name?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

function isValidState(s: string): boolean {
  return /^[A-Z]{2}$/.test(s);
}

function isValidZip(s: string, country: string): boolean {
  if (country === "US") return /^\d{5}(-\d{4})?$/.test(s);
  return s.length >= 3; // permissive for future international
}

export async function POST(req: NextRequest) {
  // Rate-limit so a malicious client can't brute-force session IDs.
  const ip = clientIp(req.headers);
  const limit = await rateLimit(`claim-bonus:${ip}`, 10, 60 * 10);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait and try again." },
      { status: 429 },
    );
  }

  let body: ClaimBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  const name = body.name?.trim();
  const addr = body.address;

  if (!sessionId || !name || !addr) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const line1 = addr.line1?.trim();
  const line2 = addr.line2?.trim();
  const city = addr.city?.trim();
  const state = addr.state?.trim().toUpperCase();
  const postalCode = addr.postalCode?.trim();
  const country = (addr.country?.trim().toUpperCase() || "US");

  if (!line1 || !city || !state || !postalCode) {
    return NextResponse.json({ error: "Missing address fields" }, { status: 400 });
  }
  if (country === "US" && !isValidState(state)) {
    return NextResponse.json({ error: "State must be a 2-letter code (e.g. CA)" }, { status: 400 });
  }
  if (!isValidZip(postalCode, country)) {
    return NextResponse.json({ error: "ZIP/postal code looks invalid" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    select: {
      id: true,
      email: true,
      productType: true,
      createdAt: true,
      portraitBlobUrl: true,
      printReadyBlobUrl: true,
      bonusClaimedAt: true,
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.bonusClaimedAt) {
    return NextResponse.json({ error: "Bonus already claimed" }, { status: 409 });
  }

  // Campaign eligibility must match the order's purchase date, not today —
  // otherwise a customer could game the window by delaying their claim.
  const iso = order.createdAt.toISOString().slice(0, 10);
  const campaign = getActiveCampaign(iso);
  if (!campaign?.freeBonusProductType) {
    return NextResponse.json({ error: "No active campaign for this order" }, { status: 400 });
  }
  if (isPhysicalProduct(order.productType)) {
    return NextResponse.json(
      { error: "Physical orders already include the bonus — no claim needed" },
      { status: 400 },
    );
  }

  const bonusProductType = campaign.freeBonusProductType;
  if (!isProdigiConfigured() || !isProdigiSkuConfigured(bonusProductType)) {
    return NextResponse.json(
      { error: "Bonus fulfillment not configured yet — please email support." },
      { status: 503 },
    );
  }

  // Record the claim FIRST so a retry after a transient Prodigi error
  // can't produce two prints. We store the intended address then try to
  // create the Prodigi order; if creation fails we leave the record for
  // manual retry from the admin.
  try {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        bonusShippingName: name,
        bonusShippingAddress: {
          line1,
          line2: line2 || null,
          city,
          state,
          postalCode,
          country,
        },
        bonusClaimedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("Failed to stamp bonus claim:", err);
    return NextResponse.json({ error: "Couldn't save claim — try again." }, { status: 500 });
  }

  try {
    const prodigiAddress: ProdigiAddress = {
      line1,
      line2: line2 || undefined,
      townOrCity: city,
      stateOrCounty: state,
      postalOrZipCode: postalCode,
      countryCode: country,
    };

    const imageUrl = order.printReadyBlobUrl ?? order.portraitBlobUrl;
    const prodigi = await createProdigiOrder({
      merchantReference: `${order.id}-bonus-claim`,
      sku: getProdigiSkuForProduct(bonusProductType),
      imageUrl,
      attributes: getProdigiAttributesForProduct(bonusProductType),
      recipient: {
        name,
        email: order.email,
        address: prodigiAddress,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { bonusProdigiOrderId: prodigi.order.id },
    });

    await logEvent("info", "webhook", "Bonus claimed by digital buyer", {
      orderId: order.id,
      bonusOrderId: prodigi.order.id,
      bonusProductType,
      email: order.email,
    });

    return NextResponse.json({
      ok: true,
      bonusProdigiOrderId: prodigi.order.id,
    });
  } catch (err) {
    // Roll the claim timestamp back so the customer can retry — if we
    // left it set, they'd be locked out by the "already claimed" guard.
    await prisma.order.update({
      where: { id: order.id },
      data: { bonusClaimedAt: null },
    }).catch(() => {});
    const message = err instanceof Error ? err.message : String(err);
    await logEvent("error", "webhook", "Bonus claim Prodigi failed", {
      orderId: order.id,
      error: message,
    });
    return NextResponse.json(
      { error: "Fulfillment failed. Try again, or email support." },
      { status: 500 },
    );
  }
}
