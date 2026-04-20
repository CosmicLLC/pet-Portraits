import { Resend } from "resend";

const fromEmail = () =>
  process.env.FROM_EMAIL || "Paw Masterpiece <orders@yourdomain.com>";

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "https://petportraits.ai";

export async function sendBrowseAbandonmentEmail(to: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: fromEmail(),
    to,
    subject: "Your Paw Masterpiece is waiting for you 🐾",
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#FAF7F2;">
        <div style="background:#2D4A3E;padding:28px 32px;text-align:center;border-radius:12px 12px 0 0;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#FAF7F2;letter-spacing:-0.3px;">🐾 Paw Masterpiece</p>
        </div>
        <div style="padding:40px 32px;">
          <h1 style="font-size:26px;color:#2D4A3E;margin:0 0 8px;font-weight:700;">Your portrait is still waiting!</h1>
          <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 28px;">
            You generated a portrait but didn't grab it. It's still there — portraits are saved for 24 hours.
          </p>
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${siteUrl()}"
               style="display:inline-block;background:#2D4A3E;color:#FAF7F2;text-decoration:none;padding:18px 48px;border-radius:50px;font-size:17px;font-weight:700;letter-spacing:-0.2px;">
              Get My Portrait
            </a>
            <p style="margin:12px 0 0;color:#888;font-size:13px;">Starting from just $15 — instant digital delivery</p>
          </div>
          <div style="background:#fff;border:1px solid #E5E0D8;border-radius:12px;padding:20px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;color:#C4A35A;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Special offer</p>
            <p style="margin:0 0 10px;font-size:17px;font-weight:700;color:#2D4A3E;">Canvas prints ship in 5–7 days</p>
            <p style="margin:0;color:#666;font-size:13px;">The perfect gift — gallery-quality 8×12 framed canvas delivered to your door.</p>
          </div>
        </div>
        <div style="border-top:1px solid #E5E0D8;padding:24px 32px;text-align:center;">
          <p style="margin:0;color:#AAA;font-size:12px;">Paw Masterpiece — Questions? Reply to this email.</p>
        </div>
      </div>
    `,
  });
}
