import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReviewRequestEmail } from "@/lib/resend";
import { ensureReferralCode } from "@/lib/referrals";
import { logEvent } from "@/lib/events";

// Daily cron — schedule in vercel.json:
//   { "path": "/api/cron/review-reminder", "schedule": "0 15 * * *" }
// Fires to customers whose order turned 7 days old today, asking for a
// review and nudging the referral link in the same email.
//
// Idempotency: reviewEmailSentAt is set after a successful send. Window
// is 6–8 days so a missed cron day doesn't skip anyone.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const lowerBound = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
  const upperBound = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

  const candidates = await prisma.order.findMany({
    where: {
      createdAt: { gte: lowerBound, lte: upperBound },
      reviewEmailSentAt: null,
    },
    select: { id: true, email: true },
    take: 200,
  });

  let sent = 0;
  let failed = 0;
  for (const order of candidates) {
    try {
      const sub = await prisma.subscriber.findUnique({
        where: { email: order.email },
        select: { unsubscribedAt: true },
      });
      if (sub?.unsubscribedAt) {
        await prisma.order.update({
          where: { id: order.id },
          data: { reviewEmailSentAt: new Date() },
        });
        continue;
      }

      // Surface the customer's referral URL if their email matches an
      // existing account — guests don't have a code yet.
      let referralUrl: string | undefined;
      const user = await prisma.user.findUnique({
        where: { email: order.email },
        select: { id: true, referralCode: true },
      });
      if (user) {
        const code = user.referralCode ?? (await ensureReferralCode(user.id));
        referralUrl = `${baseUrl}/?ref=${code}`;
      }

      await sendReviewRequestEmail(order.email, { referralUrl });
      await prisma.order.update({
        where: { id: order.id },
        data: { reviewEmailSentAt: new Date() },
      });
      sent++;
    } catch (err) {
      failed++;
      await logEvent("error", "email", "Review reminder send failed", {
        orderId: order.id,
        email: order.email,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    candidates: candidates.length,
    sent,
    failed,
    lowerBound: lowerBound.toISOString(),
    upperBound: upperBound.toISOString(),
  });
}
