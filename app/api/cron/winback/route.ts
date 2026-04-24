import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWinbackEmail } from "@/lib/resend";
import { logEvent } from "@/lib/events";

// Weekly cron — schedule in vercel.json:
//   { "path": "/api/cron/winback", "schedule": "0 16 * * 2" }
// Tuesday 16:00 UTC = 11am ET / 8am PT, which tends to outperform Monday
// or weekend sends for B2C open rate.
//
// Targets subscribers whose last activity was 90–120 days ago — narrow
// window because the email explicitly surfaces new features, and we
// don't want to repeat it endlessly to the same dormant list.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const lowerBound = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
  const upperBound = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Only winback customers who bought at least once. Never-purchased
  // subscribers get the welcome drip; they don't need a winback.
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: lowerBound, lte: upperBound },
    },
    select: { email: true },
    distinct: ["email"],
    take: 500,
  });

  let sent = 0;
  let failed = 0;
  for (const { email } of orders) {
    try {
      const sub = await prisma.subscriber.findUnique({
        where: { email },
        select: { unsubscribedAt: true, lastEmailSent: true },
      });
      if (sub?.unsubscribedAt) continue;

      // Don't hit someone with a winback if they've been emailed in the
      // last 30 days already (any cron, welcome drip, campaign).
      if (sub?.lastEmailSent) {
        const sinceLast = now.getTime() - sub.lastEmailSent.getTime();
        if (sinceLast < 30 * 24 * 60 * 60 * 1000) continue;
      }

      // Has there been a recent purchase? If yes, skip — this customer
      // is still engaged.
      const recent = await prisma.order.findFirst({
        where: { email, createdAt: { gt: upperBound } },
        select: { id: true },
      });
      if (recent) continue;

      await sendWinbackEmail(email);
      await prisma.subscriber.upsert({
        where: { email },
        update: { lastEmailSent: new Date() },
        create: { email, source: "purchase", lastEmailSent: new Date() },
      });
      sent++;
    } catch (err) {
      failed++;
      await logEvent("error", "email", "Winback send failed", {
        email,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    candidates: orders.length,
    sent,
    failed,
    lowerBound: lowerBound.toISOString(),
    upperBound: upperBound.toISOString(),
  });
}
