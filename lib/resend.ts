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

// ─── Marketing lifecycle emails ─────────────────────────────────────────
// Each of these is fired by a cron under /api/cron/* on a daily schedule.
// They all use baseTemplate() for visual consistency with transactional
// mail, and all include an unsubscribe link where CAN-SPAM requires it
// (the review reminder is arguably transactional; the anniversary and
// winback are marketing and must carry the footer link).

function unsubscribeFooter(email: string) {
  const url = `${siteUrl()}/unsubscribe?email=${encodeURIComponent(email)}`;
  return `
    <p style="text-align:center;color:#AAA;font-size:11px;margin:24px 0 0;">
      <a href="${url}" style="color:#AAA;text-decoration:underline;">Unsubscribe</a>
      &nbsp;&middot;&nbsp; Paw Masterpiece, Cosmic Company LLC
    </p>
  `;
}

export async function sendWelcomeEmail(to: string, discountCode = "PAWSOME10") {
  const content = `
    <h1 style="font-size:26px;color:#2D4A3E;margin:0 0 8px;font-weight:700;">Welcome to Paw Masterpiece 🐾</h1>
    <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
      Thanks for joining. You're in for art made for the ones you love most — your pets.
    </p>

    <!-- Discount code -->
    <div style="background:#fff;border:2px dashed #2D4A3E;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#888;">Your welcome discount</p>
      <p style="margin:0 0 8px;font-size:30px;font-weight:700;letter-spacing:8px;color:#2D4A3E;">${discountCode}</p>
      <p style="margin:0;font-size:13px;color:#666;">Enter at checkout — 10% off your first order</p>
    </div>

    <!-- Primary CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${siteUrl()}"
         style="display:inline-block;background:#2D4A3E;color:#FAF7F2;text-decoration:none;padding:18px 48px;border-radius:50px;font-size:17px;font-weight:700;">
        Create Your First Portrait
      </a>
      <p style="margin:12px 0 0;color:#AAA;font-size:12px;">Free to preview · Ready in 30 seconds</p>
    </div>

    <p style="color:#666;font-size:14px;line-height:1.7;margin:0 0 12px;">
      What to expect next:
    </p>
    <ul style="color:#666;font-size:14px;line-height:1.7;margin:0 0 20px;padding-left:20px;">
      <li>New art styles and seasonal drops, first</li>
      <li>Occasional gift-giving tips (Mother's Day, Father's Day, Christmas)</li>
      <li>Rare promos — we don't email often, but when we do it's worth opening</li>
    </ul>
    ${unsubscribeFooter(to)}
  `;

  await getResend().emails.send({
    from: fromEmail(),
    to,
    subject: "Your 10% off code inside 🐾",
    html: baseTemplate(content),
  });
}

// Sent 7 days post-purchase. Transactional-ish — asks for an honest review
// and offers a referral reminder. Includes the customer's own ?ref= link.
export async function sendReviewRequestEmail(to: string, opts: { referralUrl?: string } = {}) {
  const referralBlock = opts.referralUrl
    ? `
      <hr style="border:none;border-top:1px solid #E5E0D8;margin:32px 0;" />
      <div style="background:#fff;border:1px solid #E5E0D8;border-radius:12px;padding:20px;text-align:center;">
        <p style="margin:0 0 6px;font-size:13px;color:#888;">Know another pet parent who'd love this?</p>
        <p style="margin:0 0 12px;font-size:17px;font-weight:700;color:#2D4A3E;">
          Give $10, get $10
        </p>
        <a href="${opts.referralUrl}"
           style="display:inline-block;background:#C4A35A;color:#fff;text-decoration:none;padding:12px 32px;border-radius:50px;font-size:14px;font-weight:700;">
          Share Your Link
        </a>
      </div>`
    : "";

  const content = `
    <h1 style="font-size:26px;color:#2D4A3E;margin:0 0 8px;font-weight:700;">How's the portrait?</h1>
    <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
      A week ago you got a portrait from us. We'd love to hear how it turned out — if it's framed, on your wall, or still sitting in your downloads folder, we want to know.
    </p>

    <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 28px;">
      Two easy ways to share:
    </p>

    <div style="margin-bottom:28px;">
      <p style="margin:0 0 8px;color:#2D4A3E;font-weight:700;font-size:15px;">📷 Post it on social</p>
      <p style="margin:0;color:#666;font-size:14px;line-height:1.6;">
        Tag us with #PawMasterpiece on Instagram — we repost our favorites weekly.
      </p>
    </div>

    <div style="margin-bottom:32px;">
      <p style="margin:0 0 8px;color:#2D4A3E;font-weight:700;font-size:15px;">⭐️ Leave us a review</p>
      <p style="margin:0 0 12px;color:#666;font-size:14px;line-height:1.6;">
        Just reply to this email — we read every one and feature the best on our site (with your permission).
      </p>
    </div>

    ${referralBlock}
    ${unsubscribeFooter(to)}
  `;

  await getResend().emails.send({
    from: fromEmail(),
    to,
    subject: "How did your Paw Masterpiece turn out?",
    html: baseTemplate(content),
  });
}

// Sent 365 days post-purchase. Celebrates the pet portrait anniversary and
// pushes a "try a different style" upsell — the highest-ROI nudge we have
// for repeat orders since the customer is already a converted fan.
export async function sendAnniversaryEmail(
  to: string,
  opts: { imageId?: string; style?: string } = {}
) {
  const tryStyleCta =
    opts.style && opts.style !== "watercolor"
      ? `/?style=watercolor`
      : opts.style === "watercolor"
        ? `/?style=oil`
        : "/";
  const content = `
    <h1 style="font-size:26px;color:#2D4A3E;margin:0 0 8px;font-weight:700;">One year ago today 🎂</h1>
    <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
      You commissioned a Paw Masterpiece a year ago. That's kind of a long time in the life of a pet — new toys, new habits, maybe a few more gray hairs around the muzzle.
    </p>

    <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 28px;">
      Want to capture this year's version? Try a different style and see them in a new light — watercolor, oil, Renaissance, or line art.
    </p>

    <!-- Primary CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${siteUrl()}${tryStyleCta}"
         style="display:inline-block;background:#2D4A3E;color:#FAF7F2;text-decoration:none;padding:18px 48px;border-radius:50px;font-size:17px;font-weight:700;">
        Create This Year's Portrait
      </a>
    </div>

    <!-- Gift angle -->
    <div style="background:#fff;border:1px solid #E5E0D8;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#C4A35A;">Or — a gift idea</p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#2D4A3E;">Portrait gallery wall</p>
      <p style="margin:0;color:#666;font-size:13px;line-height:1.5;">
        A lot of our customers commission a new portrait each year in a different style. Same pet, four frames, one wall — aged together.
      </p>
    </div>
    ${unsubscribeFooter(to)}
  `;

  await getResend().emails.send({
    from: fromEmail(),
    to,
    subject: "One year of portraits 🎂",
    html: baseTemplate(content),
  });
}

// Sent to customers who purchased 90+ days ago and haven't engaged since.
// Soft winback — not "come back!" but "here's what's new."
export async function sendWinbackEmail(to: string) {
  const content = `
    <h1 style="font-size:26px;color:#2D4A3E;margin:0 0 8px;font-weight:700;">A few things you might have missed</h1>
    <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
      It's been a minute since we last heard from you. Quick update — a lot has happened since your first Paw Masterpiece:
    </p>

    <ul style="color:#555;font-size:15px;line-height:1.8;margin:0 0 28px;padding-left:20px;">
      <li><strong>Phone wallpaper add-on</strong> — $1.99, iPhone-optimised, instant download</li>
      <li><strong>Framed canvas prints</strong> — 8×12 gallery-quality, ships in 3–5 days</li>
      <li><strong>Memorial portrait funnel</strong> — gentle tone, unlimited revisions</li>
      <li><strong>Refer a friend</strong> — $10 for them, $10 back for you</li>
    </ul>

    <!-- Primary CTA -->
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${siteUrl()}"
         style="display:inline-block;background:#2D4A3E;color:#FAF7F2;text-decoration:none;padding:18px 48px;border-radius:50px;font-size:17px;font-weight:700;">
        See What's New
      </a>
    </div>

    <p style="color:#888;font-size:13px;line-height:1.6;margin:0 0 20px;text-align:center;">
      No pressure. We just wanted you to know.
    </p>
    ${unsubscribeFooter(to)}
  `;

  await getResend().emails.send({
    from: fromEmail(),
    to,
    subject: "A few things you might have missed 🐾",
    html: baseTemplate(content),
  });
}

// Sent when a guest viewer bails without buying but left an email via the
// browse-abandonment or exit-intent capture. Mentions their saved portrait
// (by image) and nudges with the discount code.
export async function sendAbandonedPortraitEmail(
  to: string,
  opts: { imageUrl?: string; discountCode?: string } = {}
) {
  const code = opts.discountCode ?? "PAWSOME10";
  const imgBlock = opts.imageUrl
    ? `
    <div style="text-align:center;margin-bottom:24px;">
      <img src="${opts.imageUrl}" alt="Your Paw Masterpiece preview" style="max-width:280px;border-radius:12px;border:1px solid #E5E0D8;" />
    </div>`
    : "";

  const content = `
    <h1 style="font-size:26px;color:#2D4A3E;margin:0 0 8px;font-weight:700;">Your portrait is saved</h1>
    <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
      You were about to create something great. We saved your preview — it's still here whenever you're ready.
    </p>

    ${imgBlock}

    <!-- Discount -->
    <div style="background:#fff;border:2px dashed #2D4A3E;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#888;">10% off — expires in 48 hours</p>
      <p style="margin:0;font-size:26px;font-weight:700;letter-spacing:6px;color:#2D4A3E;">${code}</p>
    </div>

    <!-- Primary CTA -->
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${siteUrl()}"
         style="display:inline-block;background:#2D4A3E;color:#FAF7F2;text-decoration:none;padding:18px 48px;border-radius:50px;font-size:17px;font-weight:700;">
        Finish My Portrait
      </a>
    </div>
    ${unsubscribeFooter(to)}
  `;

  await getResend().emails.send({
    from: fromEmail(),
    to,
    subject: "Your Paw Masterpiece is saved 🐾",
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
