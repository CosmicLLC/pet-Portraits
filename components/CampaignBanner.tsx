import Link from "next/link";
import { getActiveCampaign } from "@/lib/campaigns";

// Site-wide campaign announcement bar. Renders nothing when no campaign
// is active, so it's safe to drop at the top of any page. Server-only
// component — reads CAMPAIGNS at render time, no client JS shipped.
export default function CampaignBanner() {
  const campaign = getActiveCampaign();
  if (!campaign) return null;

  return (
    <Link
      href={campaign.href}
      className="block bg-brand-green text-cream text-center py-2.5 text-sm font-medium tracking-wide hover:bg-brand-green/90 transition-colors"
    >
      <span>{campaign.announcement}</span>
      <span className="ml-2 text-cream/80 underline underline-offset-2">
        Shop now →
      </span>
    </Link>
  );
}
