// Auto-delivered tips email when someone subscribes via the
// /free-photo-guide lead magnet. Substantive content (not just "thanks
// for signing up") so the new subscriber gets a useful payload
// immediately. Closes with a soft CTA back to the homepage.

const SITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

interface RenderResult {
  html: string;
  text: string;
}

export function renderPhotoGuideEmail(): RenderResult {
  const html = `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#FAF7F2;">
  <div style="background:#2D4A3E;padding:28px 32px;text-align:center;border-radius:12px 12px 0 0;">
    <p style="margin:0;font-size:22px;font-weight:700;color:#FAF7F2;letter-spacing:-0.3px;">🐾 Paw Masterpiece</p>
  </div>
  <div style="padding:40px 32px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#C4A35A;">Your guide is here</p>
    <h1 style="font-size:28px;color:#2D4A3E;margin:0 0 14px;font-weight:700;line-height:1.15;">
      5 rules for the perfect<br />pet portrait photo.
    </h1>
    <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 24px;">
      You don't need a DSLR. You don't need a willing pet. You don't need a studio. You need five minutes, decent natural light, and the right kind of phone snapshot. Here's exactly what to look for.
    </p>

    <h2 style="font-size:17px;color:#2D4A3E;margin:0 0 8px;font-weight:700;">1. Daylight, never overhead lights</h2>
    <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 18px;">
      Position your pet near a window in the afternoon. Indirect daylight from the side flatters every breed. Yellow ceiling lights flatten fur texture. Camera flash makes pets look like raccoons.
    </p>

    <h2 style="font-size:17px;color:#2D4A3E;margin:0 0 8px;font-weight:700;">2. Eye level, not above</h2>
    <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 18px;">
      Get on the floor. Crouch. Lie down if you have to. Eye-level photos create the intimate framing that makes a portrait feel like real art instead of a snapshot. Phone-pointed-down-from-standing photos look like passport photos for a criminal investigation.
    </p>

    <h2 style="font-size:17px;color:#2D4A3E;margin:0 0 8px;font-weight:700;">3. One pet per photo (for now)</h2>
    <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 18px;">
      If you have multiple pets, take a separate photo of each one. Same lighting if you can. We'll compose them together. Trying to get two cats to sit in frame is how you spend an afternoon getting nothing.
    </p>

    <h2 style="font-size:17px;color:#2D4A3E;margin:0 0 8px;font-weight:700;">4. Their face has to be visible</h2>
    <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 18px;">
      Head-on or three-quarter views work best. Both eyes visible. If the unique markings around their eyes and nose are clear, the artist captures their personality. If half their face is in shadow or hidden by a paw, less so.
    </p>

    <h2 style="font-size:17px;color:#2D4A3E;margin:0 0 8px;font-weight:700;">5. Burst mode + a noise they react to</h2>
    <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 28px;">
      Pets don't pose. Squeak a toy, say their favorite word, pull out a treat just out of frame. Take 30 photos in burst mode. You'll get one good frame. That's all you need.
    </p>

    <hr style="border:none;border-top:1px solid #E5E0D8;margin:0 0 28px;" />

    <h2 style="font-size:17px;color:#2D4A3E;margin:0 0 8px;font-weight:700;">Old photos work too</h2>
    <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 28px;">
      Phone photos from years ago. Photos from before everyone had a phone — scanned, photographed off the print, whatever. Memorial portraits are commissioned almost entirely from photos we'd consider &ldquo;low quality.&rdquo; Whatever photo matters to you is the right photo.
    </p>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${SITE_URL}"
         style="display:inline-block;background:#2D4A3E;color:#FAF7F2;text-decoration:none;padding:18px 48px;border-radius:50px;font-size:16px;font-weight:700;">
        Try a Portrait — Free Preview
      </a>
      <p style="margin:12px 0 0;color:#AAA;font-size:12px;">30 seconds · No payment to preview · 4 styles</p>
    </div>

    <p style="color:#888;font-size:13px;line-height:1.5;margin:0;text-align:center;">
      Got a photo question? Reply to this email — we read every one.
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

  const text = `5 rules for the perfect pet portrait photo

1. Daylight, never overhead lights — position near a window in the afternoon, indirect daylight from the side.

2. Eye level, not above — get on the floor or crouch. Phone-down-from-standing makes pets look like criminals.

3. One pet per photo (for now) — multiple pets, take a separate photo of each. We'll compose them together.

4. Their face has to be visible — head-on or three-quarter views, both eyes visible.

5. Burst mode + a noise they react to — squeak a toy, take 30 photos, keep the best one.

Old photos work too. Memorial portraits come from phone-quality scans every day. Whatever photo matters to you is the right photo.

Try a portrait, free preview in 30 seconds: ${SITE_URL}

Got a photo question? Reply to this email — we read every one.

— Paw Masterpiece`;

  return { html, text };
}
