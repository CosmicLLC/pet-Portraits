import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { sendDownloadEmail, sendPhysicalConfirmationEmail, sendCartEmail } from "@/lib/resend";
import { list, put } from "@vercel/blob";
import sharp from "sharp";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { signDownloadToken, signCartItemToken } from "@/lib/download-token";
import { logEvent } from "@/lib/events";
import {
  createProdigiOrder,
  getProdigiAttributesForProduct,
  getProdigiSkuForProduct,
  isProdigiConfigured,
  isProdigiSkuConfigured,
  type ProdigiAddress,
} from "@/lib/prodigi";
import { isPhysicalProduct, PRODUCTS } from "@/lib/products";
import { cartFromMetadata } from "@/lib/cart";
import { shouldApplyFreeBonus } from "@/lib/campaigns";
import { upscaleForPrint, isUpscalerConfigured } from "@/lib/upscale";
import { printAssetUrl } from "@/lib/print-token";
import { trackPurchaseServer } from "@/lib/server-pixels";

// Upscaling + Prodigi can take 15-30s on a physical order.
export const maxDuration = 60;

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

// Fulfill a multi-portrait CART order: ONE Order row + ONE combined delivery
// email with a per-item signed download link, and a Prodigi order per physical
// item (one shipping address). No cart-items DB column — per-item links bind
// order.id + imageId via signCartItemToken; Prodigi orders are fire-and-forget.
// Self-contained + defensive — never throws upward so the webhook always 200s.
async function handleCartCheckout(
  session: Stripe.Checkout.Session,
  items: { imageId: string; productType: string }[],
  email: string | null | undefined
): Promise<void> {
  if (!email) {
    await logEvent("error", "webhook", "Cart order missing email", { sessionId: session.id });
    return;
  }

  // Idempotency — one Order per cart session (Stripe retries are common).
  const existing = await prisma.order
    .findUnique({ where: { stripeSessionId: session.id } })
    .catch(() => null);
  if (existing) return;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://pawmasterpiece.com";

  // Shipping (present only when the cart contained a physical item).
  const sessionAny = session as unknown as {
    shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null;
    collected_information?: {
      shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null;
    } | null;
  };
  const shippingDetails =
    sessionAny.collected_information?.shipping_details ?? sessionAny.shipping_details ?? null;
  const shippingName = shippingDetails?.name ?? null;
  const shippingAddress = shippingDetails?.address ?? null;

  // Resolve each item's portrait blob. Skip + log any missing so the rest fulfill.
  const fulfilled: { imageId: string; productType: string; blobUrl: string }[] = [];
  for (const it of items) {
    const { blobs } = await list({ prefix: `portraits/${it.imageId}` });
    if (!blobs.length) {
      await logEvent("error", "webhook", "Cart item blob not found", {
        sessionId: session.id,
        imageId: it.imageId,
      });
      continue;
    }
    fulfilled.push({ imageId: it.imageId, productType: it.productType, blobUrl: blobs[0].url });
  }
  if (fulfilled.length === 0) {
    await logEvent("error", "webhook", "Cart order had no fulfillable items", {
      sessionId: session.id,
      email,
    });
    return;
  }

  const stripePaymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const order = await prisma.order.create({
    data: {
      stripeSessionId: session.id,
      stripePaymentIntent,
      email,
      imageId: fulfilled[0].imageId, // item #1 for legacy admin/download views
      productType: "cart",
      priceCents: session.amount_total ?? null,
      portraitBlobUrl: fulfilled[0].blobUrl,
      shippingName,
      shippingAddress: shippingAddress ? (shippingAddress as unknown as object) : undefined,
    },
  });

  await prisma.subscriber
    .upsert({ where: { email }, create: { email, source: "purchase" }, update: {} })
    .catch(() => {});

  // Per-item signed download links (?img=&itok=) — the token binds order.id +
  // the exact imageId, so no cart-items DB column is needed.
  const emailItems = fulfilled.map((f) => {
    const physical = isPhysicalProduct(f.productType);
    return {
      label: PRODUCTS[f.productType as keyof typeof PRODUCTS]?.label ?? f.productType,
      physical,
      downloadUrl: physical
        ? undefined
        : `${baseUrl}/api/download/${order.id}?img=${encodeURIComponent(f.imageId)}&itok=${signCartItemToken(order.id, f.imageId)}`,
    };
  });

  try {
    await sendCartEmail(email, emailItems);
  } catch (emailErr) {
    await logEvent("error", "webhook", "Cart email failed (order persisted; admin can resend)", {
      orderId: order.id,
      error: emailErr instanceof Error ? emailErr.message : String(emailErr),
    });
  }

  const dollars = session.amount_total ? session.amount_total / 100 : 0;
  await trackPurchaseServer({
    email,
    value: dollars,
    currency: (session.currency || "usd").toUpperCase(),
    orderId: session.id,
    productType: "cart",
    user: { email, ip: null, userAgent: null },
    sourceUrl: `${baseUrl}/success?session_id=${session.id}`,
  }).catch(() => {});

  // Physical fulfillment — one Prodigi order per physical item, single address.
  const hasPhysical = fulfilled.some((f) => isPhysicalProduct(f.productType));
  if (hasPhysical && shippingAddress && shippingName && isProdigiConfigured()) {
    const prodigiAddress: ProdigiAddress = {
      line1: shippingAddress.line1 ?? "",
      line2: shippingAddress.line2 ?? undefined,
      townOrCity: shippingAddress.city ?? "",
      stateOrCounty: shippingAddress.state ?? undefined,
      postalOrZipCode: shippingAddress.postal_code ?? "",
      countryCode: shippingAddress.country ?? "US",
    };
    for (let idx = 0; idx < fulfilled.length; idx++) {
      const f = fulfilled[idx];
      if (!isPhysicalProduct(f.productType)) continue;
      if (!isProdigiSkuConfigured(f.productType)) {
        await logEvent("warning", "webhook", "Cart item Prodigi SKU not configured", {
          orderId: order.id,
          productType: f.productType,
        });
        continue;
      }
      try {
        const portraitProxyUrl = printAssetUrl(`portraits/${f.imageId}`, baseUrl);
        let printImageUrl = portraitProxyUrl;
        if (isUpscalerConfigured()) {
          try {
            printImageUrl = await upscaleForPrint(portraitProxyUrl, f.imageId, baseUrl);
          } catch (upErr) {
            console.error("Cart upscale failed, using original:", upErr);
          }
        }
        const prodigi = await createProdigiOrder({
          merchantReference: `${order.id}-${idx}`,
          sku: getProdigiSkuForProduct(f.productType),
          imageUrl: printImageUrl,
          attributes: getProdigiAttributesForProduct(f.productType),
          recipient: {
            name: shippingName,
            email,
            phoneNumber: session.customer_details?.phone ?? undefined,
            address: prodigiAddress,
          },
        });
        console.log(`Cart Prodigi order ${prodigi.order.id} for ${order.id} item ${idx}`);
      } catch (prodigiErr) {
        await logEvent("error", "webhook", "Cart item Prodigi order failed", {
          orderId: order.id,
          imageId: f.imageId,
          productType: f.productType,
          error: prodigiErr instanceof Error ? prodigiErr.message : String(prodigiErr),
        });
      }
    }
  }
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
    const {
      imageId,
      productType,
      addWallpaper,
      addDigital,
      bgHex,
      referralCode,
      referrerUserId,
      buyerUserId,
      buyerCreditApplied,
    } = session.metadata || {};
    // Standalone wallpaper SKU ($0.99) — bgHex in metadata means the image
    // is already a composed phone-aspect wallpaper at wallpapers/<imageId>
    // and no portrait blob exists. Routes around the buildWallpaper step.
    const isStandaloneWallpaper = productType === "wallpaper" && !!bgHex;
    const email = session.customer_details?.email;

    // ── Multi-portrait CART checkout ────────────────────────────────────
    // A cart session has no single imageId/productType — it carries ci_* +
    // cartCheckout in metadata. Route it to its own self-contained handler
    // (creates ONE Order with cartItems[], sends one combined email, fires a
    // Prodigi order per physical item) and return before the single-item path.
    const cartItemsIn = cartFromMetadata(
      session.metadata as Record<string, string> | undefined
    );
    if (cartItemsIn.length > 0) {
      await handleCartCheckout(session, cartItemsIn, email).catch(async (err) => {
        console.error("Cart fulfillment error:", err);
        await logEvent("error", "webhook", "Cart fulfillment failed", {
          sessionId: session.id,
          error: err instanceof Error ? err.message : String(err),
        });
      });
      return NextResponse.json({ received: true, cart: true });
    }

    if (!imageId || !email || !productType) {
      console.error("Missing required metadata in webhook", { imageId, email, productType });
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // ── Referral attribution ───────────────────────────────────────────
    // If this session came from a ?ref=CODE cookie, credit the referrer
    // $10 and record a Referral row. We do this BEFORE order creation so
    // attribution is durable even if fulfillment fails later.
    if (referralCode && referrerUserId) {
      try {
        const existing = await prisma.referral.findUnique({
          where: { stripeSessionId: session.id },
        });
        if (!existing) {
          await prisma.$transaction([
            prisma.user.update({
              where: { id: referrerUserId },
              data: { referralCredits: { increment: 1000 } },
            }),
            prisma.referral.create({
              data: {
                referrerUserId,
                refereeEmail: email,
                stripeSessionId: session.id,
                status: "completed",
                discountCents: 1000,
                creditCents: 1000,
                completedAt: new Date(),
              },
            }),
          ]);
          console.log(`Referral credited: ${referrerUserId} for ${email} (session ${session.id})`);
        }
      } catch (err) {
        // Attribution failure is non-fatal — log and continue so the customer
        // still gets their portrait. Admin can reconcile manually.
        console.error("Referral attribution failed:", err);
        await logEvent("warning", "webhook", "Referral attribution failed", {
          sessionId: session.id,
          referralCode,
          referrerUserId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // ── Store credit decrement ─────────────────────────────────────────
    // The buyer used $X of their stored referralCredits at checkout —
    // subtract whatever was applied. Floor at 0 in case of a race.
    if (buyerUserId && buyerCreditApplied) {
      const applied = parseInt(buyerCreditApplied, 10);
      if (applied > 0) {
        try {
          const buyer = await prisma.user.findUnique({
            where: { id: buyerUserId },
            select: { referralCredits: true },
          });
          if (buyer) {
            const newBalance = Math.max(0, buyer.referralCredits - applied);
            await prisma.user.update({
              where: { id: buyerUserId },
              data: { referralCredits: newBalance },
            });
            console.log(`Decremented credits for ${buyerUserId}: -${applied} cents`);
          }
        } catch (err) {
          console.error("Credit decrement failed:", err);
        }
      }
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
      // Locate the source blob. Standalone wallpapers ($0.99 SKU) were
      // composed pre-purchase and live at wallpapers/<imageId>. Everything
      // else (digital, canvas, bundle, the $5 add-on, etc.) starts from a
      // portrait at portraits/<imageId>.
      const blobPrefix = isStandaloneWallpaper
        ? `wallpapers/${imageId}`
        : `portraits/${imageId}`;
      const { blobs } = await list({ prefix: blobPrefix });
      if (!blobs.length) {
        console.error("No blob found for imageId:", imageId, "prefix:", blobPrefix);
        // Surface to EventLog — a PAID order whose source image is missing needs
        // manual admin attention (refund or re-generate). console.error alone is
        // invisible (Vercel function logs have been unreliable here).
        await logEvent("error", "webhook", "Paid order but source blob not found", {
          sessionId: session.id,
          email,
          imageId,
          productType,
          blobPrefix,
        });
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }
      const sourceBlobUrl = blobs[0].url;
      // For standalone wallpaper, the wallpaper IS the primary deliverable —
      // we record it as both portraitBlobUrl (the order's main image) and
      // wallpaperBlobUrl (so the download email's wallpaper link works).
      const portraitBlobUrl = sourceBlobUrl;
      let wallpaperBlobUrl: string | null = isStandaloneWallpaper ? sourceBlobUrl : null;

      // Generate phone wallpaper when the $5 add-on was purchased. Failure
      // here is non-fatal — we still fulfill the main portrait. Skipped
      // entirely for the standalone wallpaper SKU (no buildWallpaper needed
      // since the image already IS the wallpaper).
      if (addWallpaper === "true" && !isStandaloneWallpaper) {
        try {
          const wallpaperBuffer = await buildWallpaper(portraitBlobUrl);
          // Private — served through /api/download/[orderId]?type=wallpaper,
          // which validates the signed token before streaming the blob.
          const blob = await put(
            `wallpapers/${imageId}.jpg`,
            wallpaperBuffer,
            { access: "private", addRandomSuffix: true, contentType: "image/jpeg" }
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
      const needsShipping = isPhysicalProduct(productType);
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

      // Capture wallpaper → canvas ladder attribution if this order
      // was created via /api/create-upsell-checkout. Lets us measure
      // ladder conversion rates and link the canvas order back to the
      // wallpaper order it was upsold from.
      const upsellSource = session.metadata?.upsellSource || null;
      const originalOrderId = session.metadata?.originalOrderId || null;

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
          upsellSource,
          originalOrderId: originalOrderId || null,
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

      // Gated download links — HMAC-signed with a 7-day expiry, streamed
      // through /api/download/[orderId] so the raw blob URL never leaves
      // our server.
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://pawmasterpiece.com";
      const { token, exp } = signDownloadToken(order.id);
      const downloadUrl = `${baseUrl}/api/download/${order.id}?token=${token}&exp=${exp}`;
      const wallpaperDownloadUrl = wallpaperBlobUrl
        ? `${baseUrl}/api/download/${order.id}?token=${token}&exp=${exp}&type=wallpaper`
        : undefined;

      // Customer-facing fulfillment email. Wrapped so a transient Resend
      // failure NEVER 500s the webhook: the Order row is already persisted and
      // idempotency would short-circuit Stripe's retry (so the email would
      // never be re-sent) — better to 200 and let an admin "Resend" than to
      // silently drop it on retry. Mirrors the Prodigi block's isolation.
      try {
        if (productType === "bundle") {
          // Bundle = digital download + physical canvas → send both.
          await sendDownloadEmail(email, downloadUrl, wallpaperDownloadUrl, {
            kind: "portrait",
          });
          await sendPhysicalConfirmationEmail(email, productType);
          console.log(`Bundle fulfillment for ${email}`);
        } else if (productType === "digital" || productType === "wallpaper") {
          await sendDownloadEmail(email, downloadUrl, wallpaperDownloadUrl, {
            kind: productType === "wallpaper" ? "wallpaper" : "portrait",
          });
          console.log(`Download email sent to ${email} for ${productType}`);
        } else if (isPhysicalProduct(productType)) {
          // ALL physical SKUs — display/mounted/canvas PLUS the framed +
          // poster sizes, acrylic, metal, prism, phone_case, mug, pillow,
          // cards, gallery_set.
          // These previously fell through with NO email (Prodigi order created
          // but the customer heard nothing). Now every paid physical order
          // gets a confirmation.
          await sendPhysicalConfirmationEmail(email, productType);
          // "+$5 digital" add-on (metadata.addDigital) — deliver the
          // full-res download alongside the print, same as a bundle.
          if (addDigital === "true") {
            await sendDownloadEmail(email, downloadUrl, wallpaperDownloadUrl, {
              kind: "portrait",
            });
            console.log(`Digital add-on delivered for ${email}`, { imageId, productType });
          }
          console.log(`Physical order confirmed for ${email}`, { imageId, productType });
        } else {
          // Unknown / unhandled productType (e.g. a standalone tier with no
          // fulfillment path) — never silently swallow a paid order.
          await logEvent("error", "webhook", "Paid order with no fulfillment branch", {
            sessionId: session.id,
            email,
            productType,
            imageId,
          });
        }
      } catch (emailErr) {
        console.error("Fulfillment email failed:", emailErr);
        await logEvent(
          "error",
          "webhook",
          "Fulfillment email failed (order persisted; admin can resend)",
          {
            orderId: order.id,
            email,
            productType,
            error: emailErr instanceof Error ? emailErr.message : String(emailErr),
          }
        );
      }

      // ── Server-side conversion API for Meta + TikTok ─────────────────
      // Webhook fires AFTER Stripe takes payment, so this is the most
      // authoritative purchase signal we can send the ad platforms. The
      // session.id is reused as event_id so Meta/TikTok dedupe against the
      // client-side pixel Purchase event fired on the success page (when
      // one is added). Failure here never blocks fulfillment.
      const dollars = session.amount_total ? session.amount_total / 100 : 0;
      await trackPurchaseServer({
        email,
        value: dollars,
        currency: (session.currency || "usd").toUpperCase(),
        orderId: session.id,
        productType,
        user: {
          email,
          ip: null,
          userAgent: null,
        },
        sourceUrl: `${baseUrl}/success?session_id=${session.id}`,
      }).catch((err) => console.warn("[server-pixels] purchase tracking failed:", err));

      // Physical fulfillment via Prodigi. Isolated from email failures above.
      // Never throws upward — we always want to 200 the Stripe webhook so it
      // doesn't retry (the customer already paid, the Order row exists, an
      // admin can manually retry from the dashboard).
      if (needsShipping && shippingAddress && shippingName) {
        if (!isProdigiConfigured() || !isProdigiSkuConfigured(productType)) {
          console.warn(`Prodigi not configured for ${productType} — skipping fulfillment for order ${order.id}`);
          await logEvent("warning", "webhook", "Prodigi not configured, order not sent to printer", {
            orderId: order.id,
            email,
            productType,
          });
        } else {
          try {
            // Upscale the Gemini output (1024x1024) to a print-ready resolution
            // before sending to Prodigi. Pay-per-sale economics — we only burn
            // upscale credits on paid orders. If the upscaler isn't configured
            // or fails, we fall back to the original blob URL and Prodigi will
            // print whatever resolution they receive.
            // Prodigi's lab AND Replicate's upscaler fetch image URLs
            // anonymously, but our blob store is private (a raw blob URL 403s).
            // Hand them the public /api/print-asset proxy URL, which streams
            // the private blob server-side. Physical orders always start from a
            // portrait blob at portraits/<imageId>.
            const portraitProxyUrl = printAssetUrl(`portraits/${imageId}`, baseUrl);
            let printImageUrl = portraitProxyUrl;
            if (isUpscalerConfigured()) {
              try {
                printImageUrl = await upscaleForPrint(portraitProxyUrl, imageId, baseUrl);
                console.log(`Upscaled print asset for order ${order.id}`);
              } catch (upErr) {
                console.error("Upscale failed, falling back to original:", upErr);
                await logEvent("warning", "webhook", "Upscale failed, using original resolution", {
                  orderId: order.id,
                  error: upErr instanceof Error ? upErr.message : String(upErr),
                });
              }
            }

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
              sku: getProdigiSkuForProduct(productType),
              imageUrl: printImageUrl,
              attributes: getProdigiAttributesForProduct(productType),
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
                printReadyBlobUrl: printImageUrl !== portraitProxyUrl ? printImageUrl : undefined,
              },
            });
            console.log(`Prodigi order created ${prodigi.order.id} for ${order.id}`);

            // ── Campaign bonus fulfillment ────────────────────────
            // Mother's Day 2026 (and future campaigns via lib/campaigns):
            // auto-create a second Prodigi order for the free bonus
            // product. Uses the same shipping address + upscaled image
            // asset so there's no extra cost beyond Prodigi print fees.
            const bonus = shouldApplyFreeBonus({
              orderCreatedAt: new Date(),
              paidProductType: productType,
              isPhysical: true,
            });
            if (bonus && isProdigiSkuConfigured(bonus.bonusProductType)) {
              try {
                const bonusOrder = await createProdigiOrder({
                  merchantReference: `${order.id}-bonus`,
                  sku: getProdigiSkuForProduct(bonus.bonusProductType),
                  imageUrl: printImageUrl,
                  attributes: getProdigiAttributesForProduct(bonus.bonusProductType),
                  recipient: {
                    name: shippingName,
                    email,
                    phoneNumber: session.customer_details?.phone ?? undefined,
                    address: prodigiAddress,
                  },
                });
                console.log(`Campaign bonus Prodigi order ${bonusOrder.order.id} for ${order.id}`);
                await logEvent("info", "webhook", "Campaign bonus fulfilled", {
                  orderId: order.id,
                  bonusOrderId: bonusOrder.order.id,
                  bonusProductType: bonus.bonusProductType,
                  campaign: "mothers-day",
                });
              } catch (bonusErr) {
                console.error("Campaign bonus fulfillment failed:", bonusErr);
                await logEvent("warning", "webhook", "Campaign bonus failed", {
                  orderId: order.id,
                  bonusProductType: bonus.bonusProductType,
                  error: bonusErr instanceof Error ? bonusErr.message : String(bonusErr),
                });
              }
            }
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
