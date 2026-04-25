// Sent immediately after a /free-wallpaper claim. Confirms the wallpaper
// is downloadable on the page and pitches the framed-canvas upgrade — the
// real revenue product behind the lead magnet.

const SITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

export function renderWallpaperThanksEmail(petName?: string): {
  html: string;
  text: string;
  subject: string;
} {
  const subject = petName
    ? `${petName}'s wallpaper is ready 📱`
    : "Your free pet wallpaper is ready 📱";

  const html = `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#FAF7F2;">
  <div style="background:#2D4A3E;padding:28px 32px;text-align:center;border-radius:12px 12px 0 0;">
    <p style="margin:0;font-size:22px;font-weight:700;color:#FAF7F2;letter-spacing:-0.3px;">🐾 Paw Masterpiece</p>
  </div>
  <div style="padding:40px 32px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#C4A35A;">Free wallpaper · saved</p>
    <h1 style="font-size:28px;color:#2D4A3E;margin:0 0 14px;font-weight:700;line-height:1.15;">
      Set ${petName ? petName + " as your" : "your pet as the"}<br />
      lock screen wallpaper.
    </h1>
    <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 24px;">
      Your wallpaper is ready to download. Tap the button below to grab it, then long-press it on your phone to set as wallpaper.
    </p>

    <div style="text-align:center;margin-bottom:32px;">
      <a href="${SITE_URL}/free-wallpaper"
         style="display:inline-block;background:#2D4A3E;color:#FAF7F2;text-decoration:none;padding:18px 48px;border-radius:50px;font-size:17px;font-weight:700;letter-spacing:-0.2px;">
        Download My Wallpaper
      </a>
      <p style="margin:12px 0 0;color:#AAA;font-size:12px;">Optimized for iPhone 14 Pro · 1290 × 2796</p>
    </div>

    <hr style="border:none;border-top:1px solid #E5E0D8;margin:0 0 28px;" />

    <h2 style="font-size:18px;color:#2D4A3E;margin:0 0 12px;font-weight:700;">Want them on your wall too?</h2>
    <p style="color:#666;font-size:15px;line-height:1.65;margin:0 0 18px;">
      The wallpaper is yours to keep — free, forever. If you'd like the same portrait as a real piece of art on your wall, the framed canvas ships in 3–5 days inside the US. Mother's Day orders include a <strong>FREE 11×14 display print</strong> automatically — through May 10.
    </p>
    <div style="background:#fff;border:2px solid #2D4A3E;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#C4A35A;">Most popular</p>
      <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#2D4A3E;">Framed Canvas 8×12</p>
      <p style="margin:0 0 16px;color:#666;font-size:14px;line-height:1.5;">
        Gallery-quality canvas, premium frame, ready to hang.<br/>
        $79 · ships in 3–5 days · FREE display print included.
      </p>
      <a href="${SITE_URL}"
         style="display:inline-block;background:#2D4A3E;color:#FAF7F2;text-decoration:none;padding:12px 32px;border-radius:50px;font-size:14px;font-weight:700;">
        Order the Canvas
      </a>
    </div>

    <p style="color:#888;font-size:13px;line-height:1.5;margin:0;text-align:center;">
      Reply if you have any questions. We read every email.
    </p>
  </div>
  <div style="border-top:1px solid #E5E0D8;padding:24px 32px;text-align:center;">
    <p style="margin:0;color:#CCC;font-size:11px;">
      <a href="${SITE_URL}/unsubscribe" style="color:#AAA;text-decoration:underline;">Unsubscribe</a>
      &nbsp;&middot;&nbsp; Paw Masterpiece, Cosmic Company LLC
    </p>
  </div>
</div>
`.trim();

  const text = `${petName ? `${petName}'s` : "Your"} wallpaper is ready.

Download: ${SITE_URL}/free-wallpaper
1290 × 2796, optimized for iPhone 14 Pro.

Want the same portrait as wall art? The framed canvas ships in 3–5 days. Through May 10, every order also includes a FREE 11×14 display print: ${SITE_URL}

— Paw Masterpiece`;

  return { html, text, subject };
}
