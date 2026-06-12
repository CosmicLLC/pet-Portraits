// Wallpaper → canvas ladder — ScheduledEmail bookkeeping (server only).
// The Stripe webhook calls scheduleUpsellEmails() when a standalone
// wallpaper purchase lands, and cancelPendingUpsellEmails() when the buyer
// converts to any wall print (so nobody is nagged after buying). The
// /api/cron/upsell-emails cron does the actual sending.

import { prisma } from "./prisma";
import type { UpsellSource } from "./upsell";

const HOUR_MS = 60 * 60 * 1000;

// One row per touch. `source` is the upsellSource the email's CTA carries
// into /upgrade → /api/create-upsell-checkout, which keys the discount
// window for that touch (lib/upsell.ts).
export const UPSELL_EMAIL_STEPS = [
  { template: "upsell_1h", step: "1h", delayMs: 1 * HOUR_MS, source: "email_1h" },
  { template: "upsell_24h", step: "24h", delayMs: 24 * HOUR_MS, source: "email_24h" },
  { template: "upsell_72h", step: "72h", delayMs: 72 * HOUR_MS, source: "email_72h" },
] as const;

export type UpsellEmailStep = (typeof UPSELL_EMAIL_STEPS)[number];

export function upsellStepForTemplate(template: string): UpsellEmailStep | null {
  return UPSELL_EMAIL_STEPS.find((s) => s.template === template) ?? null;
}

export function upsellSourceForTemplate(template: string): UpsellSource {
  return (upsellStepForTemplate(template)?.source ?? "email_24h") as UpsellSource;
}

// Idempotent under Stripe webhook retries: @@unique([orderId, template]) +
// skipDuplicates means re-delivery of checkout.session.completed never
// double-schedules a touch.
export async function scheduleUpsellEmails(
  orderId: string,
  email: string
): Promise<number> {
  const now = Date.now();
  const res = await prisma.scheduledEmail.createMany({
    data: UPSELL_EMAIL_STEPS.map((s) => ({
      template: s.template,
      email,
      orderId,
      sendAt: new Date(now + s.delayMs),
    })),
    skipDuplicates: true,
  });
  return res.count;
}

// Products that count as "they bought the wall print" — any of these from
// the same buyer ends the ladder, whether or not they came through the
// upsell checkout.
const CONVERSION_PRODUCT_TYPES = new Set([
  "canvas",
  "canvas_upsell",
  "bundle",
  "framed_12x16",
  "framed_18x24",
]);

export function isUpsellConversionProduct(productType: string): boolean {
  return CONVERSION_PRODUCT_TYPES.has(productType);
}

// Cancel whatever touches are still pending for this buyer. Matches by the
// originating wallpaper order (exact attribution) AND by email (covers the
// buyer who converts through the normal store flow with no attribution
// metadata). Cancelling zero rows is fine — this must stay cheap + safe to
// call on every conversion-shaped order.
export async function cancelPendingUpsellEmails(opts: {
  originalOrderId?: string | null;
  email?: string | null;
}): Promise<number> {
  const matchers: Array<{ orderId: string } | { email: string }> = [];
  if (opts.originalOrderId) matchers.push({ orderId: opts.originalOrderId });
  if (opts.email) matchers.push({ email: opts.email });
  if (matchers.length === 0) return 0;

  const res = await prisma.scheduledEmail.updateMany({
    where: {
      status: "pending",
      template: { startsWith: "upsell_" },
      OR: matchers,
    },
    data: { status: "cancelled", cancelledAt: new Date() },
  });
  return res.count;
}
