import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureReferralCode, REFERRAL_DISCOUNT_CENTS, REFERRAL_CREDIT_CENTS } from "@/lib/referrals";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, referralCode: true, referralCredits: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const code = user.referralCode ?? (await ensureReferralCode(user.id));

  const [referrals, completed] = await Promise.all([
    prisma.referral.count({ where: { referrerUserId: user.id } }),
    prisma.referral.count({ where: { referrerUserId: user.id, status: "completed" } }),
  ]);

  return NextResponse.json({
    code,
    creditsCents: user.referralCredits,
    referralsTotal: referrals,
    referralsCompleted: completed,
    discountCents: REFERRAL_DISCOUNT_CENTS,
    creditCents: REFERRAL_CREDIT_CENTS,
  });
}
