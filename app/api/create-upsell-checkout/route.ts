import { NextRequest, NextResponse } from "next/server";
import { getStripe, PRICE_IDS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/ratelimit";

// Wallpaper → canvas upsell checkout. Server is the source of truth on
// whether the $10 discount window is still open: we look up the original
// wallpaper Stripe session by id, verify productType === "wallpaper",
// confirm the session was created within the last 24h, then create a
// brand-new Stripe Checkout for canvas with the WALLPAPER10 coupon
// pre-applied. The new session carries metadata so the webhook can
// attribute the resulting Order back to the original wallpaper purchase.

export const runtime = "nodejs";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

type UpsellSource =
  | "wallpaper_success_modal"
  | "email_1h"
  | "email_24h"
  | "email_72h";

const ALLOWED_SOURCES: ReadonlySet<UpsellSource> = new Set<UpsellSource>([
  "wallpaper_success_modal",
  "email_1h",
  "email_24h",
  "email_72h",
]);

export async function POST(req: NextRequest) {
  try {
    // Rate limit — mints a live Stripe Checkout Session per call. Bound it.
    const ip = clientIp(req.headers);
    const limit = await rateLimit(`upsell-checkout:${ip}`, 15, 60);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests — please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await req.json().catch(() => null) as
      | { originalSessionId?: string; upsellSource?: string }
      | null;
    const originalSessionId = body?.originalSessionId;
    const upsellSourceRaw = body?.upsellSource ?? "wallpaper_success_modal";
    const upsellSource = ALLOWED_SOURCES.has(upsellSourceRaw as UpsellSource)
      ? (upsellSourceRaw as UpsellSource)
      : "wallpaper_success_modal";

    if (!originalSessionId || typeof originalSessionId !== "string") {
      return NextResponse.json(
        { error: "Missing originalSessionId" },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Pull the original wallpaper session. Stripe is the source of
    // truth: lets us validate the user actually completed a wallpaper
    // purchase before granting the discount window.
    let originalSession;
    try {
      originalSession = await stripe.checkout.sessions.retrieve(
        originalSessionId
      );
    } catch {
      return NextResponse.json(
        { error: "Original purchase not found" },
        { status: 404 }
      );
    }

    if (originalSession.metadata?.productType !== "wallpaper") {
      return NextResponse.json(
        { error: "Original purchase was not a wallpaper" },
        { status: 400 }
      );
    }

    if (originalSession.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Original purchase incomplete" },
        { status: 400 }
      );
    }

    // 24h window — server-side source of truth. Stripe `created` is in
    // seconds since epoch.
    const createdMs = (originalSession.created ?? 0) * 1000;
    const expiresMs = createdMs + TWENTY_FOUR_HOURS_MS;
    if (Date.now() >= expiresMs) {
      return NextResponse.json(
        { error: "Discount window expired" },
        { status: 410 }
      );
    }

    const canvasPriceId = PRICE_IDS.canvas;
    const couponId = process.env.STRIPE_WALLPAPER10_COUPON_ID;
    if (!canvasPriceId || !couponId) {
      console.error(
        "Upsell checkout misconfigured — canvasPriceId or couponId missing",
        { canvasPriceId: !!canvasPriceId, couponId: !!couponId }
      );
      return NextResponse.json(
        { error: "Upsell unavailable — please try again later" },
        { status: 500 }
      );
    }

    // Try to find the corresponding Order row so we can store the FK.
    // If it doesn't exist yet (webhook race — Stripe redirects faster
    // than the webhook fires), proceed without it. The webhook will
    // create the Order eventually; the upsell flow doesn't depend on
    // having it now.
    const originalOrder = await prisma.order
      .findUnique({
        where: { stripeSessionId: originalSessionId },
        select: { id: true, imageId: true, email: true },
      })
      .catch(() => null);

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
      "https://pawmasterpiece.com";

    const customerEmail =
      originalOrder?.email ?? originalSession.customer_email ?? undefined;

    // The canvas upsell ships physical — collect US shipping address.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: canvasPriceId, quantity: 1 }],
      discounts: [{ coupon: couponId }],
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      shipping_address_collection: { allowed_countries: ["US"] },
      phone_number_collection: { enabled: true },
      metadata: {
        productType: "canvas",
        imageId:
          originalOrder?.imageId ?? originalSession.metadata?.imageId ?? "",
        upsellSource,
        originalOrderId: originalOrder?.id ?? "",
        originalSessionId,
      },
      success_url: `${baseUrl}/?success=true&imageId=${encodeURIComponent(originalOrder?.imageId ?? originalSession.metadata?.imageId ?? "")}&productType=canvas&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/wallpaper?success=true&imageId=${encodeURIComponent(originalOrder?.imageId ?? originalSession.metadata?.imageId ?? "")}&session_id=${encodeURIComponent(originalSessionId)}&upsell=cancelled`,
    });

    return NextResponse.json({
      url: session.url,
      expiresAt: new Date(expiresMs).toISOString(),
    });
  } catch (error) {
    console.error("Upsell checkout error:", error);
    return NextResponse.json(
      { error: "Could not start canvas upgrade — please try again." },
      { status: 500 }
    );
  }
}
