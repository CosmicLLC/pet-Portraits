const CREAM = "#FAF7F2"
const BRAND_GREEN = "#2D4A3E"
const BRAND_GOLD = "#C4A35A"
const INK = "#1F2A24"
const MUTED = "#6B7A73"
const BORDER = "#E6DFD3"

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function baseLayout(bodyHtml: string, host: string, logoSrc: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
</head>
<body style="margin:0;padding:0;background-color:${CREAM};-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CREAM};padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid ${BORDER};border-radius:20px;overflow:hidden;">
      <tr><td style="padding:40px 40px 20px 40px;text-align:center;">
        <img src="${escapeHtml(logoSrc)}" alt="Paw Masterpiece" width="72" height="72" style="display:inline-block;width:72px;height:72px;border:0;border-radius:16px;outline:none;text-decoration:none;" />
        <div style="margin-top:14px;font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:-0.3px;color:${BRAND_GREEN};font-weight:600;">Paw Masterpiece</div>
        <div style="margin-top:6px;height:1px;width:56px;background-color:${BRAND_GOLD};display:inline-block;line-height:1px;font-size:1px;">&nbsp;</div>
      </td></tr>
      ${bodyHtml}
    </table>
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;margin-top:16px;"><tr><td style="padding:0 8px;text-align:center;">
      <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.55;color:${MUTED};">
        Fine art portraits of your pet · <a href="https://${escapeHtml(host)}" style="color:${MUTED};text-decoration:underline;">${escapeHtml(host)}</a>
      </p>
    </td></tr></table>
  </td></tr>
</table>
</body></html>`
}

function logoSrc(): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"
  return `${base}/logo.jpg`
}

function hostFromUrl(url: string): string {
  try { return new URL(url).host } catch { return "pawmasterpiece.com" }
}

function ctaBody(title: string, body: string, url: string, buttonLabel: string, footer: string): string {
  const escapedUrl = escapeHtml(url)
  return `
    <tr><td style="padding:0 40px 8px 40px;">
      <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;color:${INK};font-weight:600;text-align:center;">${escapeHtml(title)}</h1>
    </td></tr>
    <tr><td style="padding:12px 40px 24px 40px;">
      <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:${MUTED};text-align:center;">${body}</p>
    </td></tr>
    <tr><td align="center" style="padding:8px 40px 8px 40px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td align="center" bgcolor="${BRAND_GREEN}" style="border-radius:12px;">
          <a href="${escapedUrl}" style="display:inline-block;padding:14px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;background-color:${BRAND_GREEN};">${escapeHtml(buttonLabel)}</a>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:24px 40px 8px 40px;">
      <p style="margin:0 0 6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.55;color:${MUTED};text-align:center;">Or paste this link into your browser:</p>
      <p style="margin:0;font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;font-size:12px;line-height:1.55;color:${BRAND_GREEN};word-break:break-all;text-align:center;">
        <a href="${escapedUrl}" style="color:${BRAND_GREEN};text-decoration:underline;">${escapedUrl}</a>
      </p>
    </td></tr>
    <tr><td style="padding:32px 40px 0 40px;"><div style="height:1px;background-color:${BORDER};line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
    <tr><td style="padding:20px 40px 32px 40px;">
      <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.55;color:${MUTED};text-align:center;">${footer}</p>
    </td></tr>`
}

export function renderVerifyEmail(url: string) {
  const host = hostFromUrl(url)
  const body = ctaBody(
    "Confirm your email",
    "Tap the button below to finish setting up your Paw Masterpiece account. This link expires in 24 hours.",
    url,
    "Confirm my email",
    "Didn't sign up? You can safely ignore this email."
  )
  const html = baseLayout(body, host, logoSrc())
  const text = `Confirm your email for Paw Masterpiece.\n\n${url}\n\nLink expires in 24 hours. Didn't sign up? Ignore this email.`
  return { html, text, subject: "Confirm your Paw Masterpiece account" }
}

export function renderResetEmail(url: string) {
  const host = hostFromUrl(url)
  const body = ctaBody(
    "Reset your password",
    "We got a request to reset your Paw Masterpiece password. Tap the button to choose a new one. This link expires in 1 hour and can only be used once.",
    url,
    "Reset my password",
    "Didn't ask for this? You can safely ignore this email — your password will not change."
  )
  const html = baseLayout(body, host, logoSrc())
  const text = `Reset your Paw Masterpiece password.\n\n${url}\n\nLink expires in 1 hour. Didn't request? Ignore this email.`
  return { html, text, subject: "Reset your Paw Masterpiece password" }
}
