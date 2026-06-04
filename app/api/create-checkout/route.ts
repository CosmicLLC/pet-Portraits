import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStripe, PRICE_IDS } from "@/lib/stripe";
import { isPhysicalProduct, productPriceCents } from "@/lib/products";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import {
  REFERRAL_COOKIE,
  REFERRAL_DISCOUNT_CENTS,
  lookupReferrer,
} from "@/lib/referrals";
import {
  multiPetSurchargeCents,
  parsePetCountFromImageId,
} from "@/lib/gemini-multi";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    // Rate limit — each call mints a live Stripe Coupon + Checkout Session.
    // Unauthenticated, so without this an attacker could flood Stripe object
    // creation (cost / quota abuse). 15/min per IP is ample for real users.
    const ip = clientIp(req.headers);
    const limit = await rateLimit(`create-checkout:${ip}`, 15, 60);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests — please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const { productType, imageId, customerEmail, addWallpaper, addDigital, bgHex } = await req.json();

    if (!productType) {
      return NextResponse.json({ error: "Invalid product type" }, { status: 400 });
    }

    if (!imageId) {
      return NextResponse.json({ error: "Missing imageId" }, { status: 400 });
    }

    // Multi-pet is an UPGRADE/surcharge layered onto a base product — it's
    // auto-added as a line item via the multiN_ imageId in the surcharge block
    // below, and it has NO standalone fulfillment branch in the webhook. Reject
    // it as a standalone purchase so a customer can never pay $20 for nothing.
    if (productType === "multipet") {
      return NextResponse.json(
        { error: "Multi-pet is an add-on to a portrait, not a standalone product." },
        { status: 400 }
      );
    }

    const isBundle = productType === "bundle";
    const hasPrice = isBundle
      ? PRICE_IDS.bundle || (PRICE_IDS.digital && PRICE_IDS.canvas)
      : PRICE_IDS[productType];

    if (!hasPrice) {
      return NextResponse.json({ error: "Invalid product type" }, { status: 400 });
    }

    // Match the webhook's hardened fallback — if NEXT_PUBLIC_BASE_URL is ever
    // unset in prod, success/cancel redirects must still go to the live site,
    // not localhost. (Local dev sets the var in .env.local.)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://pawmasterpiece.com";

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

    // Multi-pet surcharge — only triggers when the imageId was minted by
    // /api/generate-multi (which prefixes the UUID with "multi<N>_").
    // Single-pet imageIds skip this branch entirely, so the legacy flow
    // is byte-identical to before. Uses an inline price_data line item
    // rather than a separate Stripe Price so we don't need to provision
    // new price IDs per pet count.
    const petCount = parsePetCountFromImageId(imageId);
    type LineItemsParam = NonNullable<
      Stripe.Checkout.SessionCreateParams["line_items"]
    >;
    const lineItemsMulti: LineItemsParam = lineItems.map((li) => ({
      price: li.price,
      quantity: li.quantity,
    }));
    if (petCount > 1) {
      const surchargeCents = multiPetSurchargeCents(petCount);
      if (surchargeCents > 0) {
        lineItemsMulti.push({
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: surchargeCents,
            product_data: {
              name: `Multi-pet portrait surcharge (${petCount} pets)`,
              description: `+$15 per additional pet beyond the first. ${petCount - 1} extra ${
                petCount - 1 === 1 ? "pet" : "pets"
              } in this portrait.`,
            },
          },
        });
      }
    }

    // Optional "+$5 digital" add-on — bundles the full-resolution download
    // with a physical print without a dedicated bundle SKU or Stripe Price.
    // Inline price_data (like the multi-pet surcharge) so nothing new needs
    // provisioning. Physical-only: adding the digital file to a digital order
    // is meaningless. The webhook reads metadata.addDigital to ALSO email the
    // download link alongside the physical confirmation.
    const wantsDigital = Boolean(addDigital) && isPhysicalProduct(productType);
    if (wantsDigital) {
      lineItemsMulti.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: 500,
          product_data: {
            name: "Full-resolution digital file",
            description: "Add-on: the print-ready digital download emailed alongside your print.",
          },
        },
      });
    }

    // Any physical product (display/mounted/canvas/bundle) ships via Prodigi
    // and needs a US shipping address.
    const needsShipping = isPhysicalProduct(productType);

    // ─── Shipping rate ($10 flat, free over the threshold) ──────────────
    // Stripe shipping rates are fixed amounts and can't natively go free
    // above a cart total, so we compute the merchandise subtotal here and
    // attach EITHER a $10 standard rate OR a $0 "Free shipping" rate. Defined
    // inline (shipping_rate_data) so nothing needs provisioning in the Stripe
    // dashboard. Subtotal mirrors the line items built above; based on the
    // pre-discount merchandise value (referral/credit don't lower shipping).
    let shippingOptions:
      | Stripe.Checkout.SessionCreateParams["shipping_options"]
      | undefined;
    if (needsShipping) {
      let merchandiseCents =
        isBundle && !PRICE_IDS.bundle
          ? productPriceCents("digital") + productPriceCents("canvas")
          : productPriceCents(productType);
      if (addWallpaper && PRICE_IDS.wallpaper) {
        merchandiseCents += productPriceCents("wallpaper");
      }
      if (petCount > 1) merchandiseCents += multiPetSurchargeCents(petCount);
      if (wantsDigital) merchandiseCents += 500;

      const thresholdUsd = Number(
        process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_USD
      );
      const qualifiesForFree =
        Number.isFinite(thresholdUsd) &&
        thresholdUsd > 0 &&
        merchandiseCents >= Math.round(thresholdUsd * 100);

      shippingOptions = [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: qualifiesForFree ? 0 : 1000,
              currency: "usd",
            },
            display_name: qualifiesForFree ? "Free shipping" : "Standard shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
      ];
    }

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
      line_items: lineItemsMulti,
      discounts: discounts.length > 0 ? discounts : undefined,
      metadata: {
        imageId,
        productType,
        addWallpaper: addWallpaper ? "true" : "false",
        addDigital: wantsDigital ? "true" : "false",
        ...(petCount > 1 ? { petCount: String(petCount) } : {}),
        // Standalone wallpaper SKU only — bgHex is the user's picked color.
        // Presence of this field in webhook is how we dispatch the standalone
        // fulfillment path vs the existing portrait-add-on flow.
        ...(productType === "wallpaper" && bgHex ? { bgHex } : {}),
        ...referralMeta,
      },
      ...(customerEmail && { customer_email: customerEmail }),
      ...(!customerEmail && buyerEmail && { customer_email: buyerEmail }),
      ...(needsShipping && {
        shipping_address_collection: { allowed_countries: ["US"] },
        phone_number_collection: { enabled: true },
        ...(shippingOptions && { shipping_options: shippingOptions }),
      }),
      // Wallpaper standalone returns to its own landing page so the
      // success state is contextual ("your wallpaper is on its way" vs the
      // home page portrait success flow).
      success_url:
        productType === "wallpaper" && bgHex
          ? `${baseUrl}/wallpaper?success=true&imageId=${encodeURIComponent(imageId)}&session_id={CHECKOUT_SESSION_ID}`
          : `${baseUrl}?success=true&imageId=${encodeURIComponent(imageId)}&productType=${encodeURIComponent(productType)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        productType === "wallpaper" && bgHex
          ? `${baseUrl}/wallpaper?canceled=true`
          : `${baseUrl}?canceled=true`,
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
