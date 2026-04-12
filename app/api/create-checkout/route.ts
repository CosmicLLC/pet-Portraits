import { NextRequest, NextResponse } from "next/server";
import { stripe, PRICE_IDS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { productType, imageId, customerEmail } = await req.json();

    if (!productType || !PRICE_IDS[productType]) {
      return NextResponse.json({ error: "Invalid product type" }, { status: 400 });
    }

    if (!imageId) {
      return NextResponse.json({ error: "Missing imageId" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: PRICE_IDS[productType], quantity: 1 }],
      metadata: { imageId, productType },
      ...(customerEmail && { customer_email: customerEmail }),
      success_url: `${baseUrl}?success=true`,
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
