import { NextRequest, NextResponse } from "next/server";
import { getStripe, PRICE_IDS } from "@/lib/stripe";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import {
  type CartItem,
  isValidCartItem,
  cartToMetadata,
  cartHasPhysical,
  MAX_CART_ITEMS,
} from "@/lib/cart";
import {
  multiPetSurchargeCents,
  parsePetCountFromImageId,
} from "@/lib/gemini-multi";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Multi-portrait CART checkout. Distinct from /api/create-checkout (single
// item). Takes an array of generated portraits, builds one Stripe Checkout
// session with N line items priced ENTIRELY from server-side Stripe Price IDs
// (the client's prices are never trusted), collects a shipping address if any
// item is physical, and stamps the cart onto session metadata so the webhook
// can fulfill every item. No bulk discount (per product decision).
//
// Cart items are PORTRAITS only (blob at portraits/<imageId>). The standalone
// $0.99 wallpaper SKU and the "multipet" add-on are not cartable here — they
// have their own flows / aren't standalone deliverables.
const CARTABLE_DENY = new Set(["wallpaper", "multipet", "canvas_upsell"]);

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req.headers);
    const limit = await rateLimit(`cart-checkout:${ip}`, 15, 60);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests — please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = (await req.json().catch(() => null)) as { items?: unknown } | null;
    const rawItems = Array.isArray(body?.items) ? body!.items : null;
    if (!rawItems || rawItems.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }
    if (rawItems.length > MAX_CART_ITEMS) {
      return NextResponse.json(
        { error: `Carts are limited to ${MAX_CART_ITEMS} portraits.` },
        { status: 400 }
      );
    }

    // Validate every item: well-formed, a real priced product, and cartable.
    const items: CartItem[] = [];
    for (const raw of rawItems) {
      if (!isValidCartItem(raw)) {
        return NextResponse.json({ error: "Invalid cart item." }, { status: 400 });
      }
      const { productType } = raw;
      if (CARTABLE_DENY.has(productType) || !PRICE_IDS[productType]) {
        return NextResponse.json(
          { error: "One of your items can't be purchased in a cart." },
          { status: 400 }
        );
      }
      items.push(raw);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://pawmasterpiece.com";
    const stripe = getStripe();

    // Build line items — base price per item (server-side Price ID) + a per-item
    // multi-pet surcharge (inline price_data) when the imageId encodes 2+ pets.
    const lineItems: NonNullable<Stripe.Checkout.SessionCreateParams["line_items"]> = [];
    for (const it of items) {
      lineItems.push({ price: PRICE_IDS[it.productType], quantity: 1 });
      const petCount = parsePetCountFromImageId(it.imageId);
      const surcharge = petCount > 1 ? multiPetSurchargeCents(petCount) : 0;
      if (surcharge > 0) {
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: surcharge,
            product_data: {
              name: `Multi-pet surcharge (${petCount} pets)`,
              description: `+$15 per additional pet for portrait ${it.imageId.slice(0, 12)}…`,
            },
          },
        });
      }
    }

    const needsShipping = cartHasPhysical(items);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      metadata: cartToMetadata(items),
      ...(needsShipping && {
        shipping_address_collection: { allowed_countries: ["US"] },
        phone_number_collection: { enabled: true },
      }),
      success_url: `${baseUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Cart checkout error:", error);
    return NextResponse.json(
      { error: "Payment error — please try again." },
      { status: 500 }
    );
  }
}
