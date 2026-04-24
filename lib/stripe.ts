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
  display: process.env.STRIPE_DISPLAY_PRICE_ID || "",
  mounted: process.env.STRIPE_MOUNTED_PRICE_ID || "",
  canvas: process.env.STRIPE_CANVAS_PRICE_ID || "",
  bundle: process.env.STRIPE_BUNDLE_PRICE_ID || "",
  canvas_upsell: process.env.STRIPE_CANVAS_UPSELL_PRICE_ID || process.env.STRIPE_CANVAS_PRICE_ID || "",
  // 2026-04-24 expansion — set each env var in Stripe → Products to light
  // up the corresponding tile in ProductSelector. Unset = auto-hidden.
  canvas_16x20: process.env.STRIPE_CANVAS_16X20_PRICE_ID || "",
  multipet: process.env.STRIPE_MULTIPET_PRICE_ID || "",
  gallery_set: process.env.STRIPE_GALLERY_SET_PRICE_ID || "",
  acrylic: process.env.STRIPE_ACRYLIC_PRICE_ID || "",
  metal: process.env.STRIPE_METAL_PRICE_ID || "",
  cards: process.env.STRIPE_CARDS_PRICE_ID || "",
  phone_case: process.env.STRIPE_PHONE_CASE_PRICE_ID || "",
  prism: process.env.STRIPE_PRISM_PRICE_ID || "",
  mug: process.env.STRIPE_MUG_PRICE_ID || "",
  pillow: process.env.STRIPE_PILLOW_PRICE_ID || "",
};
