import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ensureReferralCode,
  REFERRAL_CREDIT_CENTS,
  REFERRAL_DISCOUNT_CENTS,
} from "@/lib/referrals";
import ReferDashboard from "./ReferDashboard";

export const metadata = {
  title: "Refer & Earn",
  robots: { index: false, follow: false },
};

export default async function ReferPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/account/refer");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, referralCode: true, referralCredits: true },
  });
  if (!user) redirect("/auth/signin");

  const code = user.referralCode ?? (await ensureReferralCode(user.id));

  const referrals = await prisma.referral.findMany({
    where: { referrerUserId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      refereeEmail: true,
      status: true,
      createdAt: true,
      creditCents: true,
    },
  });

  const completedCount = referrals.filter((r) => r.status === "completed").length;
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";
  const shareUrl = `${baseUrl}/?ref=${code}`;

  return (
    <ReferDashboard
      code={code}
      shareUrl={shareUrl}
      creditsCents={user.referralCredits}
      completedCount={completedCount}
      discountCents={REFERRAL_DISCOUNT_CENTS}
      creditCents={REFERRAL_CREDIT_CENTS}
      recentReferrals={referrals.map((r) => ({
        id: r.id,
        // Mask the referee's email so the dashboard is shareable without
        // leaking friends' addresses in a screenshot.
        refereeEmailMasked: maskEmail(r.refereeEmail),
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        creditCents: r.creditCents,
      }))}
    />
  );
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "****";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}
