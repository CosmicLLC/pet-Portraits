import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { sendDownloadEmail, sendCanvasConfirmationEmail } from "@/lib/resend";
import { list } from "@vercel/blob";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { imageId, productType } = session.metadata || {};
    const email = session.customer_details?.email;

    if (!imageId || !email) {
      console.error("Missing imageId or email in webhook", { imageId, email });
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    try {
      // Find the blob by searching for the imageId prefix
      // addRandomSuffix means the full path isn't guessable
      const { blobs } = await list({ prefix: `portraits/${imageId}` });
      if (!blobs.length) {
        console.error("No blob found for imageId:", imageId);
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }

      const downloadUrl = blobs[0].url;

      if (productType === "digital" || productType === "wallpaper") {
        await sendDownloadEmail(email, downloadUrl);
        console.log(`Download email sent to ${email} for ${productType}`);
      } else if (productType === "canvas") {
        await sendCanvasConfirmationEmail(email);
        console.log(`Canvas order confirmed for ${email}`, {
          imageId,
          productType,
        });
      }
    } catch (err) {
      console.error("Webhook fulfillment error:", err);
      return NextResponse.json(
        { error: "Fulfillment failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
