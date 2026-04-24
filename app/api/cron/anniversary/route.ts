import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAnniversaryEmail } from "@/lib/resend";
import { logEvent } from "@/lib/events";

// Daily cron — schedule in vercel.json:
//   { "path": "/api/cron/anniversary", "schedule": "0 14 * * *" }
// At ~14:00 UTC we catch the east coast in the late morning after coffee.
//
// Targets orders placed exactly ~365 days ago and sends the anniversary
// email, then marks anniversaryEmailSentAt so retries are idempotent.
// The window is deliberately wide (364–366 days) so a day-long cron
// outage doesn't silently skip anyone.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const lowerBound = new Date(now.getTime() - 366 * 24 * 60 * 60 * 1000);
  const upperBound = new Date(now.getTime() - 364 * 24 * 60 * 60 * 1000);

  const candidates = await prisma.order.findMany({
    where: {
      createdAt: { gte: lowerBound, lte: upperBound },
      anniversaryEmailSentAt: null,
    },
    select: { id: true, email: true, imageId: true, productType: true },
    take: 200,
  });

  let sent = 0;
  let failed = 0;
  for (const order of candidates) {
    try {
      // Honor unsubscribes — a customer who ever unsubscribed gets no
      // marketing email, even if their purchase hit its anniversary.
      const sub = await prisma.subscriber.findUnique({
        where: { email: order.email },
        select: { unsubscribedAt: true },
      });
      if (sub?.unsubscribedAt) {
        await prisma.order.update({
          where: { id: order.id },
          data: { anniversaryEmailSentAt: new Date() },
        });
        continue;
      }

      await sendAnniversaryEmail(order.email, { imageId: order.imageId });
      await prisma.order.update({
        where: { id: order.id },
        data: { anniversaryEmailSentAt: new Date() },
      });
      sent++;
    } catch (err) {
      failed++;
      await logEvent("error", "email", "Anniversary send failed", {
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
