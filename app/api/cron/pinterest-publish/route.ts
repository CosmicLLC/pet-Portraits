import { NextRequest, NextResponse } from "next/server";
import { publishNextPins } from "@/lib/pinterest-publish";
import { logEvent } from "@/lib/events";

// Vercel Cron daily Pinterest pin uploader.
//
// Schedule: see vercel.json — runs daily at 14:00 UTC (9am ET).
// Vercel sends the request with header Authorization: Bearer ${CRON_SECRET}
// which we verify here so random callers can't burn through the queue.
//
// Each run pulls up to 2 queued pins from the PinterestPin table, renders
// each as a 1000×1500 PNG, uploads via Pinterest API v5, and marks the
// row as published (or failed). Pinterest sandbox is rate-limited to ~10-20
// pins/hour — we stay well under that with 2/day.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Pinterest base64 uploads can hit 10-20s each

const DEFAULT_BATCH = Number(process.env.PINTEREST_CRON_BATCH || "2");

export async function GET(req: NextRequest) {
  // Verify the request came from Vercel Cron. Vercel sets this header
  // automatically using the CRON_SECRET env var. Manual hits won't work.
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Optional override — useful for backfilling more than 2 pins in one
  // manual run via curl during admin operations.
  const url = new URL(req.url);
  const batchParam = url.searchParams.get("batch");
  const batch = batchParam ? Math.max(1, Math.min(10, parseInt(batchParam, 10))) : DEFAULT_BATCH;

  try {
    const result = await publishNextPins(batch);
    // Always log so the admin event-log shows the cron heartbeat even
    // when nothing was published (queue empty).
    if (result.attempted === 0) {
      await logEvent("info", "webhook", "Pinterest cron — queue empty", { batch });
      return NextResponse.json({ ok: true, attempted: 0, message: "queue empty" });
    }
    if (result.failed > 0) {
      await logEvent("warning", "webhook", "Pinterest cron partial failure", { batch, ...result });
    } else {
      await logEvent("info", "webhook", "Pinterest cron success", { batch, ...result });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEvent("error", "webhook", "Pinterest cron fatal", { error: message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
