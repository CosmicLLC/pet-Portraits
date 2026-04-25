import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { renderWallpaperThanksEmail } from "@/lib/emails/wallpaper-thanks";
import { logEvent } from "@/lib/events";

// Email-capture endpoint for the /free-wallpaper lead magnet. Subscribes
// the visitor with source="other" (legacy schema constraint) tagged via
// name field, then fires a thank-you email with a CTA back to the
// framed-canvas upgrade. The actual wallpaper image is downloaded
// client-side from the canvas — this endpoint is purely the email-list
// capture + nurture trigger.

export const runtime = "nodejs";

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limit = await rateLimit(`wallpaper-magnet:${ip}`, 10, 60 * 10);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: { email?: unknown; name?: unknown; petName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;
  const petName =
    typeof body.petName === "string" && body.petName.trim() ? body.petName.trim() : undefined;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
  }

  const blocked = await prisma.blockedEmail.findUnique({ where: { email } }).catch(() => null);
  if (blocked) {
    return NextResponse.json({ ok: true });
  }

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
    console.error("Wallpaper magnet subscribe failed:", err);
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }

  // Fire the thank-you email asynchronously — don't block the response.
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || "Paw Masterpiece <orders@pawmasterpiece.com>";
  if (apiKey) {
    const { html, text, subject } = renderWallpaperThanksEmail(petName);
    const client = new Resend(apiKey);
    client.emails
      .send({ from: fromEmail, to: email, subject, html, text })
      .then(() =>
        prisma.subscriber.update({
          where: { email },
          data: { lastEmailSent: new Date() },
        }).catch(() => {})
      )
      .catch((err) => {
        console.error("Wallpaper thanks send failed:", err);
        logEvent("warning", "email", "Wallpaper magnet email failed", {
          email,
          error: err instanceof Error ? err.message : String(err),
        }).catch(() => {});
      });
  }

  return NextResponse.json({ ok: true });
}
