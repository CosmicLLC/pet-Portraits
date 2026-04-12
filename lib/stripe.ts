import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export const PRICE_IDS: Record<string, string> = {
  digital: process.env.STRIPE_DIGITAL_PRICE_ID!,
  wallpaper: process.env.STRIPE_WALLPAPER_PRICE_ID!,
  canvas: process.env.STRIPE_CANVAS_PRICE_ID!,
};
