import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { sendDownloadEmail, sendCanvasConfirmationEmail } from "@/lib/resend";
import { list, put } from "@vercel/blob";
import sharp from "sharp";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { signDownloadToken } from "@/lib/download-token";
import { logEvent } from "@/lib/events";
import {
  createProdigiOrder,
  getCanvasSku,
  isProdigiConfigured,
  type ProdigiAddress,
} from "@/lib/prodigi";

// 9:19.5 — iPhone 14 Pro resolution
const WALLPAPER_W = 1290;
const WALLPAPER_H = 2796;

const gradientSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${WALLPAPER_W}" height="${WALLPAPER_H}">
    <defs>
      <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#000" stop-opacity="0.70"/>
        <stop offset="38%"  stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="bot" x1="0" y1="0" x2="0" y2="1">
        <stop offset="62%"  stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.50"/>
      </linearGradient>
    </defs>
    <rect width="${WALLPAPER_W}" height="${WALLPAPER_H}" fill="url(#top)"/>
    <rect width="${WALLPAPER_W}" height="${WALLPAPER_H}" fill="url(#bot)"/>
  </svg>`
);

async function buildWallpaper(sourceUrl: string): Promise<Buffer> {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Failed to fetch portrait: ${res.status}`);
  const sourceBuffer = Buffer.from(await res.arrayBuffer());

  // Rasterise the gradient SVG first so sharp can composite it as a bitmap
  const overlayBuffer = await sharp(gradientSvg)
    .resize(WALLPAPER_W, WALLPAPER_H)
    .png()
    .toBuffer();

  return sharp(sourceBuffer)
    .resize(WALLPAPER_W, WALLPAPER_H, { fit: "cover", position: "center" })
    .composite([{ input: overlayBuffer, blend: "over" }])
    .jpeg({ quality: 92 })
    .toBuffer();
}

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
    const { imageId, productType, addWallpaper } = session.metadata || {};
    const email = session.customer_details?.email;

    if (!imageId || !email || !productType) {
      console.error("Missing required metadata in webhook", { imageId, email, productType });
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Idempotency — if we've already processed this Stripe session, return 200 without
    // re-sending emails or re-generating the wallpaper. Stripe retries are common.
    const existing = await prisma.order.findUnique({
      where: { stripeSessionId: session.id },
    }).catch(() => null);
    if (existing) {
      console.log(`Skipping duplicate webhook for session ${session.id}`);
      return NextResponse.json({ received: true, deduplicated: true });
    }

    try {
      // Find the original portrait blob by imageId prefix
      const { blobs } = await list({ prefix: `portraits/${imageId}` });
      if (!blobs.length) {
        console.error("No blob found for imageId:", imageId);
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }
      const portraitBlobUrl = blobs[0].url;

      // Generate phone wallpaper when add-on was purchased.
      // Failure here is non-fatal — we still fulfill the main portrait.
      let wallpaperBlobUrl: string | null = null;
      if (addWallpaper === "true") {
        try {
          const wallpaperBuffer = await buildWallpaper(portraitBlobUrl);
          const blob = await put(
            `wallpapers/${imageId}.jpg`,
            wallpaperBuffer,
            { access: "public", addRandomSuffix: true, contentType: "image/jpeg" }
          );
          wallpaperBlobUrl = blob.url;
          console.log(`Wallpaper generated for ${imageId}`);
        } catch (wallpaperErr) {
          console.error("Wallpaper generation failed:", wallpaperErr);
        }
      }

      // Persist the order FIRST — even if email sending fails we have a durable
      // record and idempotency protection on retries.
      const stripePaymentIntent =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      // Capture shipping address for physical products. Newer Stripe API versions
      // nest this under collected_information; older versions expose it directly
      // on the session. Support both so we don't care which one's in play.
      const needsShipping = productType === "canvas" || productType === "bundle";
      const sessionAny = session as unknown as {
        shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null;
        collected_information?: {
          shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null;
        } | null;
      };
      const shippingDetails =
        sessionAny.collected_information?.shipping_details ??
        sessionAny.shipping_details ??
        null;
      const shippingName = shippingDetails?.name ?? null;
      const shippingAddress = shippingDetails?.address ?? null;

      if (needsShipping && (!shippingAddress || !shippingName)) {
        // This should only happen for orders placed before shipping collection was enabled.
        console.error("Physical order missing shipping details", { sessionId: session.id });
        await logEvent("error", "webhook", "Physical order missing shipping details", {
          sessionId: session.id,
          email,
          productType,
        });
      }

      const order = await prisma.order.create({
        data: {
          stripeSessionId: session.id,
          stripePaymentIntent,
          email,
          imageId,
          productType,
          priceCents: session.amount_total ?? null,
          addWallpaper: addWallpaper === "true",
          portraitBlobUrl,
          wallpaperBlobUrl,
          shippingName,
          shippingAddress: shippingAddress
            ? (shippingAddress as unknown as object)
            : undefined,
        },
      });

      // Auto-enroll the customer in the marketing list under CAN-SPAM's
      // existing-customer allowance. They can unsubscribe via the required
      // footer link in every campaign. If they'd previously unsubscribed,
      // don't re-subscribe them — honor that choice.
      await prisma.subscriber.upsert({
        where: { email },
        create: { email, source: "purchase" },
        update: {},
      }).catch((err) => console.error("Subscriber auto-enroll failed:", err));

      // Gated download links — HMAC-signed, streamed through /api/download/[orderId]
      // so the raw blob URL never leaves our server.
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://pawmasterpiece.com";
      const token = signDownloadToken(order.id);
      const downloadUrl = `${baseUrl}/api/download/${order.id}?token=${token}`;
      const wallpaperDownloadUrl = wallpaperBlobUrl
        ? `${baseUrl}/api/download/${order.id}?token=${token}&type=wallpaper`
        : undefined;

      if (productType === "digital" || productType === "wallpaper") {
        await sendDownloadEmail(email, downloadUrl, wallpaperDownloadUrl);
        console.log(`Download email sent to ${email} for ${productType}`);
      } else if (productType === "canvas") {
        await sendCanvasConfirmationEmail(email);
        console.log(`Canvas order confirmed for ${email}`, { imageId, productType });
      } else if (productType === "bundle") {
        await sendDownloadEmail(email, downloadUrl, wallpaperDownloadUrl);
        await sendCanvasConfirmationEmail(email);
        console.log(`Bundle fulfillment for ${email}`);
      }

      // Physical fulfillment via Prodigi. Isolated from email failures above.
      // Never throws upward — we always want to 200 the Stripe webhook so it
      // doesn't retry (the customer already paid, the Order row exists, an
      // admin can manually retry from the dashboard).
      if (needsShipping && shippingAddress && shippingName) {
        if (!isProdigiConfigured()) {
          console.warn(`Prodigi not configured — skipping fulfillment for order ${order.id}`);
          await logEvent("warning", "webhook", "Prodigi not configured, order not sent to printer", {
            orderId: order.id,
            email,
          });
        } else {
          try {
            const prodigiAddress: ProdigiAddress = {
              line1: shippingAddress.line1 ?? "",
              line2: shippingAddress.line2 ?? undefined,
              townOrCity: shippingAddress.city ?? "",
              stateOrCounty: shippingAddress.state ?? undefined,
              postalOrZipCode: shippingAddress.postal_code ?? "",
              countryCode: shippingAddress.country ?? "US",
            };
            const prodigi = await createProdigiOrder({
              merchantReference: order.id,
              sku: getCanvasSku(),
              imageUrl: portraitBlobUrl,
              recipient: {
                name: shippingName,
                email,
                phoneNumber: session.customer_details?.phone ?? undefined,
                address: prodigiAddress,
              },
            });
            await prisma.order.update({
              where: { id: order.id },
              data: {
                prodigiOrderId: prodigi.order.id,
                prodigiStatus: "InProgress",
                prodigiStage: prodigi.order.status.stage,
              },
            });
            console.log(`Prodigi order created ${prodigi.order.id} for ${order.id}`);
          } catch (prodigiErr) {
            console.error("Prodigi order creation failed:", prodigiErr);
            await prisma.order.update({
              where: { id: order.id },
              data: { prodigiStatus: "Failed" },
            }).catch(() => {});
            await logEvent("error", "webhook", "Prodigi order creation failed", {
              orderId: order.id,
              email,
              error: prodigiErr instanceof Error ? prodigiErr.message : String(prodigiErr),
            });
          }
        }
      }
    } catch (err) {
      console.error("Webhook fulfillment error:", err);
      await logEvent("error", "webhook", "Fulfillment failed", {
        sessionId: session.id,
        email,
        imageId,
        productType,
        error: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json(
        { error: "Fulfillment failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
