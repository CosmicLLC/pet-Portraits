import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

export const PRICE_IDS: Record<string, string> = {
  digital: process.env.STRIPE_DIGITAL_PRICE_ID || "",
  wallpaper: process.env.STRIPE_WALLPAPER_PRICE_ID || "",
  canvas: process.env.STRIPE_CANVAS_PRICE_ID || "",
  bundle: process.env.STRIPE_BUNDLE_PRICE_ID || "",
  canvas_upsell: process.env.STRIPE_CANVAS_UPSELL_PRICE_ID || process.env.STRIPE_CANVAS_PRICE_ID || "",
};
