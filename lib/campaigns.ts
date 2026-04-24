// Seasonal campaign config. A campaign that lands today looks at the
// current date against the windows here to decide what to promote, what
// to auto-add at checkout, and what copy to show on the announcement
// bar. Toggling a campaign is a single date edit — no redeploy needed.

export interface Campaign {
  id: string;
  // The dates are inclusive on both ends. "America/Los_Angeles" is
  // assumed — adjust if ops moves.
  startsOn: string; // YYYY-MM-DD
  endsOn: string;   // YYYY-MM-DD
  // Short version for announcement bar rotation (kept under ~50 chars).
  announcement: string;
  // Long version for the gift landing page hero band.
  landingBlurb: string;
  // If set, every physical order during the window includes an extra
  // Prodigi fulfillment for this product key as a free gift.
  freeBonusProductType?: string;
  // Where to land when the bar is clicked.
  href: string;
}

export const CAMPAIGNS: Campaign[] = [
  {
    id: "mothers-day-2026",
    startsOn: "2026-04-24",
    endsOn: "2026-05-10",
    announcement: "🎁 FREE 11×14 Display Print with any order — Mother's Day",
    landingBlurb:
      "Through Mother's Day: every Paw Masterpiece order ships with a FREE 11×14 display print of the same portrait. Nothing to add at checkout — it's automatic.",
    freeBonusProductType: "display",
    href: "/gifts/mothers-day",
  },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getActiveCampaign(now = todayIso()): Campaign | null {
  return (
    CAMPAIGNS.find((c) => c.startsOn <= now && now <= c.endsOn) ?? null
  );
}

// Returns whether the bonus-product fulfillment should fire for a given
// order. Keeps all the gating in one place so the webhook stays simple.
export function shouldApplyFreeBonus(args: {
  orderCreatedAt: Date;
  paidProductType: string;
  isPhysical: boolean;
}): { bonusProductType: string } | null {
  if (!args.isPhysical) return null;
  const iso = args.orderCreatedAt.toISOString().slice(0, 10);
  const campaign = getActiveCampaign(iso);
  if (!campaign?.freeBonusProductType) return null;
  // Don't double-ship the same product for free that the customer paid
  // for — that's a refund trigger, not a gift.
  if (args.paidProductType === campaign.freeBonusProductType) return null;
  return { bonusProductType: campaign.freeBonusProductType };
}
