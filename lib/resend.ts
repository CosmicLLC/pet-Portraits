import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const fromEmail = () =>
  process.env.FROM_EMAIL || "Pet Portraits <orders@yourdomain.com>";

export async function sendDownloadEmail(to: string, downloadUrl: string) {
  await getResend().emails.send({
    from: fromEmail(),
    to,
    subject: "Your pet portrait is ready 🐾",
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F2; padding: 40px 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 28px; color: #2D4A3E; margin: 0;">Your portrait is ready</h1>
        </div>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${downloadUrl}" style="display: inline-block; background: #2D4A3E; color: #FAF7F2; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600;">Download Full Resolution</a>
        </div>
        <p style="text-align: center; color: #888; font-size: 14px;">This link expires in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #E5E0D8; margin: 32px 0;" />
        <p style="text-align: center; color: #AAA; font-size: 12px;">Pet Portraits &mdash; Questions? Reply to this email.</p>
      </div>
    `,
  });
}

export async function sendCanvasConfirmationEmail(to: string) {
  await getResend().emails.send({
    from: fromEmail(),
    to,
    subject: "Your canvas print order is confirmed 🐾",
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F2; padding: 40px 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 28px; color: #2D4A3E; margin: 0;">Your canvas is on its way</h1>
        </div>
        <p style="text-align: center; color: #555; font-size: 16px; line-height: 1.6;">
          We've received your order for an 8&times;10 canvas print. We'll send you a tracking number once it ships (typically 5&ndash;7 business days).
        </p>
        <hr style="border: none; border-top: 1px solid #E5E0D8; margin: 32px 0;" />
        <p style="text-align: center; color: #AAA; font-size: 12px;">Pet Portraits &mdash; Questions? Reply to this email.</p>
      </div>
    `,
  });
}
