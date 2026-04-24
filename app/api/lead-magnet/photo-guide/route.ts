import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { renderPhotoGuideEmail } from "@/lib/emails/photo-guide";
import { logEvent } from "@/lib/events";

// Lead magnet capture: takes an email, subscribes them with source="lead_magnet",
// and fires the auto-deliver "5 rules for the perfect pet photo" email. Honors
// rate limiting + blocklist like the standard /api/subscribe route, plus
// suppresses the welcome-email side effect since we're sending our own.

export const runtime = "nodejs";

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limit = await rateLimit(`lead-magnet:${ip}`, 10, 60 * 10);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: { email?: unknown; name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
  }

  const blocked = await prisma.blockedEmail.findUnique({ where: { email } }).catch(() => null);
  if (blocked) {
    // Silently succeed — same pattern as /api/subscribe.
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;

  // Subscribe with source="lead_magnet" so we can segment these in
  // future campaigns. Reactivate if they previously unsubscribed.
  try {
    await prisma.subscriber.upsert({
      where: { email },
      create: { email, source: "other", name },
      update: {
        unsubscribedAt: null,
        ...(name ? { name } : {}),
      },
    });
  } catch (err) {
    console.error("Lead magnet subscribe failed:", err);
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }

  // Auto-deliver the photo guide email. Async — don't block the
  // response; the user sees the success state immediately and the
  // email arrives within ~5s.
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || "Paw Masterpiece <orders@pawmasterpiece.com>";
  if (apiKey) {
    const { html, text } = renderPhotoGuideEmail();
    const client = new Resend(apiKey);
    client.emails
      .send({
        from: fromEmail,
        to: email,
        subject: "Your 5 rules for the perfect pet portrait photo 🐾",
        html,
        text,
      })
      .then(() =>
        prisma.subscriber.update({
          where: { email },
          data: { lastEmailSent: new Date() },
        }).catch(() => {})
      )
      .catch((err) => {
        console.error("Photo guide send failed:", err);
        logEvent("warning", "email", "Photo guide auto-send failed", {
          email,
          error: err instanceof Error ? err.message : String(err),
        }).catch(() => {});
      });
  }

  return NextResponse.json({ ok: true });
}
