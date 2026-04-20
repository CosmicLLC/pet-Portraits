import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const fromEmail = () =>
  process.env.FROM_EMAIL || "Paw Masterpiece <orders@yourdomain.com>";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://petportraits.ai";

function baseTemplate(content: string) {
  return `
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#FAF7F2;">
      <!-- Header -->
      <div style="background:#2D4A3E;padding:28px 32px;text-align:center;border-radius:12px 12px 0 0;">
        <p style="margin:0;font-size:22px;font-weight:700;color:#FAF7F2;letter-spacing:-0.3px;">🐾 Paw Masterpiece</p>
      </div>
      <!-- Body -->
      <div style="padding:40px 32px;">
        ${content}
      </div>
      <!-- Footer -->
      <div style="border-top:1px solid #E5E0D8;padding:24px 32px;text-align:center;">
        <p style="margin:0 0 6px;color:#AAA;font-size:12px;">
          Questions? Just reply to this email — we&rsquo;re here to help.
        </p>
        <p style="margin:0;color:#CCC;font-size:11px;">
          Paw Masterpiece &nbsp;&middot;&nbsp; AI-powered portraits for every pet lover
        </p>
      </div>
    </div>
  `;
}

export async function sendDownloadEmail(to: string, downloadUrl: string, wallpaperUrl?: string) {
  const wallpaperSection = wallpaperUrl
    ? `
    <hr style="border:none;border-top:1px solid #E5E0D8;margin:32px 0;" />
    <!-- Phone wallpaper download -->
    <div style="background:#fff;border:2px solid #2D4A3E;border-radius:12px;padding:24px;text-align:center;margin-bottom:8px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#C4A35A;">
        📱 Your add-on
      </p>
      <h2 style="font-size:20px;color:#2D4A3E;margin:0 0 10px;font-weight:700;">
        Phone Wallpaper (1290×2796)
      </h2>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Optimised for iPhone — set it as your lock screen to show off your pet every time you check your phone.
      </p>
      <a href="${wallpaperUrl}"
         style="display:inline-block;background:#2D4A3E;color:#FAF7F2;text-decoration:none;padding:12px 32px;border-radius:50px;font-size:14px;font-weight:700;">
        Download Wallpaper
      </a>
    </div>`
    : "";

  const content = `
    <h1 style="font-size:26px;color:#2D4A3E;margin:0 0 8px;font-weight:700;">Your portrait is ready! 🎉</h1>
    <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 28px;">
      Your full-resolution Paw Masterpiece portrait is waiting for you. Click below to download it before the link expires.
    </p>

    <!-- Download CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${downloadUrl}"
         style="display:inline-block;background:#2D4A3E;color:#FAF7F2;text-decoration:none;padding:18px 48px;border-radius:50px;font-size:17px;font-weight:700;letter-spacing:-0.2px;">
        Download My Portrait
      </a>
      <p style="margin:12px 0 0;color:#AAA;font-size:12px;">Link expires in 24 hours</p>
    </div>
    ${wallpaperSection}

    <hr style="border:none;border-top:1px solid #E5E0D8;margin:32px 0;" />

    <!-- Canvas upsell -->
    <div style="background:#fff;border:2px solid #2D4A3E;border-radius:12px;padding:24px;text-align:center;margin-bottom:8px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#C4A35A;">
        Upgrade your order
      </p>
      <h2 style="font-size:20px;color:#2D4A3E;margin:0 0 10px;font-weight:700;">
        Turn it into a canvas print
      </h2>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Display your portrait on a stunning 8&times;12 framed gallery-quality canvas.
        Arrives in 5&ndash;7 days &mdash; the perfect gift for a pet lover.
      </p>
      <a href="${siteUrl()}"
         style="display:inline-block;background:#C4A35A;color:#fff;text-decoration:none;padding:12px 32px;border-radius:50px;font-size:14px;font-weight:700;">
        Order Canvas Print &mdash; $77
      </a>
    </div>

    <p style="text-align:center;color:#AAA;font-size:12px;margin:16px 0 0;">
      Not happy with your portrait? Reply and we&rsquo;ll redo it for free.
    </p>
  `;

  await getResend().emails.send({
    from: fromEmail(),
    to,
    subject: "Your Paw Masterpiece is ready to download 🐾",
    html: baseTemplate(content),
  });
}

// Human-readable description for each product type, used in the confirmation email
const PRODUCT_EMAIL_LABEL: Record<string, string> = {
  display: "11×14 display print",
  mounted: "11×14 mounted print",
  canvas: "8×12 framed canvas print",
  bundle: "8×12 framed canvas print",
};

export async function sendPhysicalConfirmationEmail(to: string, productType: string) {
  const label = PRODUCT_EMAIL_LABEL[productType] ?? "print";
  const content = `
    <h1 style="font-size:26px;color:#2D4A3E;margin:0 0 8px;font-weight:700;">Your print is on its way! 🖼️</h1>
    <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 28px;">
      We&rsquo;ve received your order for a ${label}. Here&rsquo;s what happens next:
    </p>

    <!-- Timeline -->
    <div style="margin-bottom:32px;">
      <div style="display:flex;align-items:flex-start;margin-bottom:16px;">
        <div style="width:32px;height:32px;background:#2D4A3E;border-radius:50%;color:#FAF7F2;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:14px;text-align:center;line-height:32px;">1</div>
        <div>
          <p style="margin:0 0 2px;font-weight:700;color:#2D4A3E;font-size:15px;">We print your portrait</p>
          <p style="margin:0;color:#888;font-size:13px;">Gallery-quality print produced within 1&ndash;2 business days</p>
        </div>
      </div>
      <div style="display:flex;align-items:flex-start;margin-bottom:16px;">
        <div style="width:32px;height:32px;background:#2D4A3E;border-radius:50%;color:#FAF7F2;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:14px;text-align:center;line-height:32px;">2</div>
        <div>
          <p style="margin:0 0 2px;font-weight:700;color:#2D4A3E;font-size:15px;">It ships to your door</p>
          <p style="margin:0;color:#888;font-size:13px;">Tracking number sent when it leaves our facility (3&ndash;5 business days)</p>
        </div>
      </div>
      <div style="display:flex;align-items:flex-start;">
        <div style="width:32px;height:32px;background:#C4A35A;border-radius:50%;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:14px;text-align:center;line-height:32px;">✓</div>
        <div>
          <p style="margin:0 0 2px;font-weight:700;color:#2D4A3E;font-size:15px;">You hang it with pride</p>
          <p style="margin:0;color:#888;font-size:13px;">The perfect keepsake for any pet lover</p>
        </div>
      </div>
    </div>

    <hr style="border:none;border-top:1px solid #E5E0D8;margin:32px 0;" />

    <!-- Digital upsell while waiting -->
    <div style="background:#fff;border:1px solid #E5E0D8;border-radius:12px;padding:20px;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;color:#888;">While you wait…</p>
      <p style="margin:0 0 10px;font-size:17px;font-weight:700;color:#2D4A3E;">
        Create a portrait for a friend&rsquo;s pet
      </p>
      <p style="margin:0 0 16px;color:#666;font-size:13px;line-height:1.5;">
        Digital downloads are just $25 and make a thoughtful, unique gift.
      </p>
      <a href="${siteUrl()}"
         style="display:inline-block;background:#2D4A3E;color:#FAF7F2;text-decoration:none;padding:12px 32px;border-radius:50px;font-size:14px;font-weight:700;">
        Make Another Portrait
      </a>
    </div>
  `;

  await getResend().emails.send({
    from: fromEmail(),
    to,
    subject: "Your print order is confirmed — here's what's next 🐾",
    html: baseTemplate(content),
  });
}

export async function sendPrintShippedEmail(
  to: string,
  tracking: { carrier: string; trackingNumber: string; trackingUrl: string | null }
) {
  const ctaBlock = tracking.trackingUrl
    ? `
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${tracking.trackingUrl}"
         style="display:inline-block;background:#2D4A3E;color:#FAF7F2;text-decoration:none;padding:18px 48px;border-radius:50px;font-size:17px;font-weight:700;letter-spacing:-0.2px;">
        Track My Package
      </a>
    </div>`
    : "";

  const content = `
    <h1 style="font-size:26px;color:#2D4A3E;margin:0 0 8px;font-weight:700;">Your print has shipped! 📦</h1>
    <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 28px;">
      Great news — your Paw Masterpiece print is on its way. Here are your tracking details:
    </p>

    <div style="background:#fff;border:1px solid #E5E0D8;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:13px;color:#888;">Carrier</p>
      <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:#2D4A3E;">${tracking.carrier}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#888;">Tracking number</p>
      <p style="margin:0;font-size:15px;font-weight:700;color:#2D4A3E;font-family:monospace;">${tracking.trackingNumber}</p>
    </div>

    ${ctaBlock}

    <p style="color:#666;font-size:14px;line-height:1.6;margin:0;">
      Typical transit is 3&ndash;5 business days. If there&rsquo;s any issue with your delivery, just reply to this email.
    </p>
  `;

  await getResend().emails.send({
    from: fromEmail(),
    to,
    subject: "Your print has shipped 📦",
    html: baseTemplate(content),
  });
}
