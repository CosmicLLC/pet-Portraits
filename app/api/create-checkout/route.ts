import { NextRequest, NextResponse } from "next/server";
import { getStripe, PRICE_IDS } from "@/lib/stripe";

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

    // Canvas and bundle ship a physical product — collect a US address.
    const needsShipping = productType === "canvas" || productType === "bundle";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      metadata: {
        imageId,
        productType,
        addWallpaper: addWallpaper ? "true" : "false",
      },
      ...(customerEmail && { customer_email: customerEmail }),
      ...(needsShipping && {
        shipping_address_collection: { allowed_countries: ["US"] },
        phone_number_collection: { enabled: true },
      }),
      success_url: `${baseUrl}?success=true&imageId=${encodeURIComponent(imageId)}&productType=${encodeURIComponent(productType)}`,
      cancel_url: `${baseUrl}?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Payment error — please try again." },
      { status: 500 }
    );
  }
}
