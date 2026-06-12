// Wallpaper → canvas ladder — single source of truth for the offer.
// Client-safe: constants + pure functions only (the modal imports this).
//
// PRICING (margin check 2026-06-11, live Prodigi quote):
//   GLOBAL-CFP-8X10 framed print: $35.00 item + $24.80 US shipping = $59.80 COGS
//   (Budget and Standard ship at the same rate; Prodigi may add US sales
//   tax on top — no resale certificate is on file).
//   At the originally-planned $10 off ($69, free shipping to buyer):
//     $69 − $59.80 COGS − ~$2.30 Stripe = +$6.90 BEFORE Prodigi sales tax,
//     ≈ +$2.70 at 7% tax, NEGATIVE in 10%+ tax states. Too fragile.
//   At $5 off ($74): worst case (10% tax) still nets ≈ +$5.75. Margin-safe.
// To flip back to $10 off: re-run the margin check (COGS or base price must
// move first), create the $10 coupon, set STRIPE_WALLPAPER10_COUPON_ID, and
// update the three USD constants below — everything else reads from here.
//
// NOTE: WALLPAPER5/WALLPAPER10 (this ladder) and PAWSOME10 (cart
// abandonment, 10% off) are SEPARATE codes. Never point this module's
// coupon env vars at PAWSOME10.

export type UpsellSource =
  | "wallpaper_success_modal"
  | "email_1h"
  | "email_24h"
  | "email_72h";

export const UPSELL_SOURCES: readonly UpsellSource[] = [
  "wallpaper_success_modal",
  "email_1h",
  "email_24h",
  "email_72h",
];

export function isUpsellSource(v: string): v is UpsellSource {
  return (UPSELL_SOURCES as readonly string[]).includes(v);
}

export const UPSELL_LIST_PRICE_USD = 79; // canvas (8×10 framed print) list price
export const UPSELL_DISCOUNT_USD = 5;
export const UPSELL_PRICE_USD = UPSELL_LIST_PRICE_USD - UPSELL_DISCOUNT_USD;

const HOUR_MS = 60 * 60 * 1000;

// Server-enforced discount windows, measured from the original wallpaper
// purchase (Stripe session.created). Each EMAIL touch honestly re-extends
// the deadline its copy promises — a 24h-only window would 410 every click
// on the 24h/72h emails:
//   modal + 1h email : 24h  ("today only")
//   24h email        : 48h  ("we extended it one more day")
//   72h email        : 96h  ("final 24 hours, then it's gone")
export const UPSELL_WINDOW_MS: Record<UpsellSource, number> = {
  wallpaper_success_modal: 24 * HOUR_MS,
  email_1h: 24 * HOUR_MS,
  email_24h: 48 * HOUR_MS,
  email_72h: 96 * HOUR_MS,
};

export function upsellWindowMsFor(source: string): number {
  return isUpsellSource(source)
    ? UPSELL_WINDOW_MS[source]
    : UPSELL_WINDOW_MS.wallpaper_success_modal;
}
