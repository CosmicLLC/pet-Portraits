// Single semantic event per user action, dispatched to GA4, Meta Pixel, and
// TikTok Pixel with platform-specific mappings. No-ops gracefully when a pixel
// ID env var is missing, so local dev and pre-launch environments don't error.
//
// Each `name` in AnalyticsEvent corresponds to one meaningful funnel moment;
// resist adding generic "button_click" noise — pick the moment that matters
// and fire here.

import { PRODUCTS, type ProductType } from "./products";

type Currency = "USD";

export type AnalyticsEvent =
  | { name: "portrait_generation_start"; style: string }
  | { name: "portrait_generated"; style: string; imageId: string }
  | { name: "add_to_cart"; item: string; value: number; currency?: Currency }
  | { name: "begin_checkout"; productType: ProductType; value: number; currency?: Currency; imageId?: string }
  | { name: "purchase"; transactionId?: string; value?: number; currency?: Currency; productType?: ProductType }
  | { name: "sign_up"; source: string }
  | { name: "exit_intent_shown" };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      page?: () => void;
    };
    dataLayer?: unknown[];
  }
}

const DEBUG =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true";

function log(...args: unknown[]) {
  if (DEBUG) console.log("[analytics]", ...args);
}

export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  const gtag = window.gtag;
  const fbq = window.fbq;
  const ttq = window.ttq;
  log(event);

  switch (event.name) {
    case "portrait_generation_start":
      gtag?.("event", "portrait_generation_start", { style: event.style });
      fbq?.("trackCustom", "PortraitGenerationStart", { style: event.style });
      ttq?.track("ClickButton", { description: "portrait_generation_start", style: event.style });
      break;

    case "portrait_generated":
      gtag?.("event", "portrait_generated", { style: event.style, image_id: event.imageId });
      fbq?.("trackCustom", "PortraitGenerated", { style: event.style, image_id: event.imageId });
      ttq?.track("ViewContent", {
        content_type: "product",
        content_id: event.imageId,
        content_name: `${event.style}_portrait`,
      });
      break;

    case "add_to_cart":
      gtag?.("event", "add_to_cart", {
        items: [{ item_id: event.item, price: event.value }],
        value: event.value,
        currency: event.currency ?? "USD",
      });
      fbq?.("track", "AddToCart", {
        content_ids: [event.item],
        content_type: "product",
        value: event.value,
        currency: event.currency ?? "USD",
      });
      ttq?.track("AddToCart", {
        content_id: event.item,
        value: event.value,
        currency: event.currency ?? "USD",
      });
      break;

    case "begin_checkout":
      gtag?.("event", "begin_checkout", {
        items: [{ item_id: event.productType, item_name: event.productType }],
        value: event.value,
        currency: event.currency ?? "USD",
      });
      fbq?.("track", "InitiateCheckout", {
        content_ids: event.imageId ? [event.imageId] : [event.productType],
        content_category: event.productType,
        value: event.value,
        currency: event.currency ?? "USD",
      });
      ttq?.track("InitiateCheckout", {
        content_id: event.imageId ?? event.productType,
        value: event.value,
        currency: event.currency ?? "USD",
      });
      break;

    case "purchase":
      gtag?.("event", "purchase", {
        transaction_id: event.transactionId,
        value: event.value,
        currency: event.currency ?? "USD",
        items: event.productType
          ? [{ item_id: event.productType, item_name: event.productType, price: event.value }]
          : undefined,
      });
      fbq?.("track", "Purchase", {
        value: event.value,
        currency: event.currency ?? "USD",
        content_ids: event.productType ? [event.productType] : undefined,
        content_type: "product",
      });
      ttq?.track("CompletePayment", {
        content_id: event.productType,
        value: event.value,
        currency: event.currency ?? "USD",
      });
      break;

    case "sign_up":
      gtag?.("event", "sign_up", { method: "email", source: event.source });
      fbq?.("track", "Lead", { source: event.source });
      ttq?.track("SubscribeEmail", { content_name: event.source });
      break;

    case "exit_intent_shown":
      gtag?.("event", "exit_intent_shown");
      fbq?.("trackCustom", "ExitIntentShown");
      ttq?.track("ClickButton", { description: "exit_intent_shown" });
      break;
  }
}

// Dollar value of a product, used for value-based ad optimization and
// revenue reporting. Derived from PRODUCTS so pricing stays in one place.
export function productValue(type: ProductType): number {
  const price = PRODUCTS[type]?.price;
  if (!price) return 0;
  const n = parseFloat(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
