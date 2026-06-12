import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUpsellLadderEmail } from "@/lib/resend";
import { logEvent } from "@/lib/events";
import { upsellStepForTemplate } from "@/lib/upsell-emails";
import { upsellWindowMsFor } from "@/lib/upsell";

// Wallpaper → canvas ladder sender — schedule in vercel.json:
//   { "path": "/api/cron/upsell-emails", "schedule": "*/30 * * * *" }
// Every 30 minutes, deliver whatever ScheduledEmail rows are due. The rows
// are created by the Stripe webhook on standalone wallpaper purchases and
// cancelled by the webhook on conversion; this route adds belt-and-braces
// guards (conversion, unsubscribe, dead window) so a missed cancel never
// turns into a nag.
//
// Failure policy: a transient send error leaves the row pending so the
// next run retries; rows more than 48h past their sendAt are marked
// failed instead of retrying forever.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RETRY_GIVE_UP_MS = 48 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

  const due = await prisma.scheduledEmail.findMany({
    where: {
      status: "pending",
      sendAt: { lte: now },
      template: { startsWith: "upsell_" },
    },
    orderBy: { sendAt: "asc" },
    take: 50,
  });

  let sent = 0;
  let cancelled = 0;
  let failed = 0;

  for (const row of due) {
    try {
      const step = upsellStepForTemplate(row.template);
      if (!step) {
        await prisma.scheduledEmail.update({
          where: { id: row.id },
          data: { status: "failed", error: `Unknown template ${row.template}` },
        });
        failed++;
        continue;
      }

      const cancel = async (reason: string) => {
        await prisma.scheduledEmail.update({
          where: { id: row.id },
          data: { status: "cancelled", cancelledAt: new Date(), error: reason },
        });
        cancelled++;
      };

      // Original wallpaper order — its Stripe session id is the proof the
      // /upgrade page + upsell checkout validate against.
      const order = await prisma.order.findUnique({
        where: { id: row.orderId },
        select: { id: true, stripeSessionId: true, createdAt: true },
      });
      if (!order) {
        await cancel("Original order not found");
        continue;
      }

      // Already converted? (webhook normally cancels, but cover races)
      const converted = await prisma.order.count({
        where: { originalOrderId: order.id },
      });
      if (converted > 0) {
        await cancel("Already converted");
        continue;
      }

      // Honor unsubscribes — these are marketing touches.
      const sub = await prisma.subscriber.findUnique({
        where: { email: row.email },
        select: { unsubscribedAt: true },
      });
      if (sub?.unsubscribedAt) {
        await cancel("Unsubscribed");
        continue;
      }

      // Never send a touch whose discount window already closed (e.g. the
      // cron was down past the offer's deadline) — a dead link is worse
      // than no email.
      const expiresMs =
        order.createdAt.getTime() + upsellWindowMsFor(step.source);
      if (Date.now() >= expiresMs) {
        await cancel("Discount window already expired");
        continue;
      }

      const upgradeUrl = `${baseUrl}/upgrade?session=${encodeURIComponent(
        order.stripeSessionId
      )}&source=${step.source}`;

      await sendUpsellLadderEmail(row.email, { step: step.step, upgradeUrl });
      await prisma.scheduledEmail.update({
        where: { id: row.id },
        data: { status: "sent", sentAt: new Date() },
      });
      sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const giveUp = now.getTime() - row.sendAt.getTime() > RETRY_GIVE_UP_MS;
      await prisma.scheduledEmail
        .update({
          where: { id: row.id },
          data: giveUp ? { status: "failed", error: message } : { error: message },
        })
        .catch(() => {});
      failed++;
      await logEvent("error", "email", "Upsell ladder send failed", {
        scheduledEmailId: row.id,
        template: row.template,
        email: row.email,
        gaveUp: giveUp,
        error: message,
      });
    }
  }

  return NextResponse.json({ due: due.length, sent, cancelled, failed });
}
