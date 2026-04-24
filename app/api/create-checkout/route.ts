import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStripe, PRICE_IDS } from "@/lib/stripe";
import { isPhysicalProduct } from "@/lib/products";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  REFERRAL_COOKIE,
  REFERRAL_DISCOUNT_CENTS,
  lookupReferrer,
} from "@/lib/referrals";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const { productType, imageId, customerEmail, addWallpaper } = await req.json();

    if (!productType) {
      return NextResponse.json({ error: "Invalid product type" }, { status: 400 });
    }

    if (!imageId) {
      return NextResponse.json({ error: "Missing imageId" }, { status: 400 });
    }

    const isBundle = productType === "bundle";
    const hasPrice = isBundle
      ? PRICE_IDS.bundle || (PRICE_IDS.digital && PRICE_IDS.canvas)
      : PRICE_IDS[productType];

    if (!hasPrice) {
      return NextResponse.json({ error: "Invalid product type" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Bundle uses two line items if no dedicated bundle price is set
    const lineItems: { price: string; quantity: number }[] =
      isBundle && !PRICE_IDS.bundle
        ? [
            { price: PRICE_IDS.digital, quantity: 1 },
            { price: PRICE_IDS.canvas, quantity: 1 },
          ]
        : [{ price: PRICE_IDS[productType], quantity: 1 }];

    // Add phone wallpaper as an optional add-on line item
    if (addWallpaper && PRICE_IDS.wallpaper) {
      lineItems.push({ price: PRICE_IDS.wallpaper, quantity: 1 });
    }

    // Any physical product (display/mounted/canvas/bundle) ships via Prodigi
    // and needs a US shipping address.
    const needsShipping = isPhysicalProduct(productType);

    // ─── Referral + store credit ────────────────────────────────────────
    // At most one discount per session. Priority: store credit for the
    // signed-in buyer (they earned it — use it before any ?ref= coupon).
    // If they have no credit, fall back to the ?ref= cookie discount.
    const stripe = getStripe();
    const discounts: Stripe.Checkout.SessionCreateParams["discounts"] = [];
    const referralMeta: Record<string, string> = {};

    const authSession = await auth();
    const buyerEmail = authSession?.user?.email ?? null;

    let buyerCreditApplied = 0;
    if (buyerEmail) {
      const buyer = await prisma.user.findUnique({
        where: { email: buyerEmail },
        select: { id: true, referralCredits: true },
      });
      if (buyer && buyer.referralCredits > 0) {
        // Apply the full balance as a one-time coupon. Stripe caps at the
        // line-items total automatically — whatever doesn't fit stays on
        // the balance because we only decrement what actually applied.
        const coupon = await stripe.coupons.create({
          amount_off: buyer.referralCredits,
          currency: "usd",
          duration: "once",
          name: "Paw Masterpiece store credit",
        });
        discounts.push({ coupon: coupon.id });
        buyerCreditApplied = buyer.referralCredits;
        referralMeta.buyerUserId = buyer.id;
        referralMeta.buyerCreditApplied = String(buyer.referralCredits);
      }
    }

    if (discounts.length === 0) {
      const refCookie = cookies().get(REFERRAL_COOKIE)?.value;
      const referrer = await lookupReferrer(refCookie);
      // Block self-referrals when the buyer is signed in.
      if (referrer && referrer.email !== buyerEmail) {
        const coupon = await stripe.coupons.create({
          amount_off: REFERRAL_DISCOUNT_CENTS,
          currency: "usd",
          duration: "once",
          name: `Friend discount (${referrer.referralCode})`,
        });
        discounts.push({ coupon: coupon.id });
        referralMeta.referralCode = referrer.referralCode ?? "";
        referralMeta.referrerUserId = referrer.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      discounts: discounts.length > 0 ? discounts : undefined,
      metadata: {
        imageId,
        productType,
        addWallpaper: addWallpaper ? "true" : "false",
        ...referralMeta,
      },
      ...(customerEmail && { customer_email: customerEmail }),
      ...(!customerEmail && buyerEmail && { customer_email: buyerEmail }),
      ...(needsShipping && {
        shipping_address_collection: { allowed_countries: ["US"] },
        phone_number_collection: { enabled: true },
      }),
      success_url: `${baseUrl}?success=true&imageId=${encodeURIComponent(imageId)}&productType=${encodeURIComponent(productType)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}?canceled=true`,
    });

    return NextResponse.json({
      url: session.url,
      // Surface applied credit so the client can show an optimistic toast
      // before the webhook processes. Cents, same as everywhere else.
      creditApplied: buyerCreditApplied || undefined,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Payment error — please try again." },
      { status: 500 }
    );
  }
}
