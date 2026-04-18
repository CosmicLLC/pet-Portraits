type MagicLinkEmailProps = { url: string; host: string }

const CREAM = "#FAF7F2"
const BRAND_GREEN = "#2D4A3E"
const BRAND_GOLD = "#C4A35A"
const INK = "#1F2A24"
const MUTED = "#6B7A73"
const BORDER = "#E6DFD3"

export function renderMagicLinkEmail({ url, host }: MagicLinkEmailProps) {
  const escapedUrl = escapeHtml(url)
  // Absolute URL for the logo. Email clients can't reach localhost, so prefer the public
  // base URL if set (covers local dev where the magic-link origin is localhost).
  const publicBase = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "")
  const origin = publicBase || new URL(url).origin
  const logoSrc = `${origin}/logo.jpg`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>Sign in to Paw Masterpiece</title>
<!--[if mso]>
<style type="text/css">body,table,td,p,a,span{font-family:Georgia,'Times New Roman',serif !important;}</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${CREAM};-webkit-font-smoothing:antialiased;">
<div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">
  Click the link to sign in — expires in 10 minutes.
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CREAM};padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid ${BORDER};border-radius:20px;overflow:hidden;">
        <tr>
          <td style="padding:40px 40px 20px 40px;text-align:center;">
            <img src="${escapeHtml(logoSrc)}" alt="Paw Masterpiece" width="72" height="72" style="display:inline-block;width:72px;height:72px;border:0;border-radius:16px;outline:none;text-decoration:none;" />
            <div style="margin-top:14px;font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:-0.3px;color:${BRAND_GREEN};font-weight:600;">
              Paw Masterpiece
            </div>
            <div style="margin-top:6px;height:1px;width:56px;background-color:${BRAND_GOLD};display:inline-block;line-height:1px;font-size:1px;">&nbsp;</div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 8px 40px;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;color:${INK};font-weight:600;text-align:center;">
              Sign in to your account
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 40px 24px 40px;">
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:${MUTED};text-align:center;">
              Tap the button below to sign in. This link expires in <strong style="color:${INK};">10 minutes</strong> and can only be used once.
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:8px 40px 8px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="${BRAND_GREEN}" style="border-radius:12px;">
                  <a href="${escapedUrl}"
                     style="display:inline-block;padding:14px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;background-color:${BRAND_GREEN};">
                    Sign in to Paw Masterpiece
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px 8px 40px;">
            <p style="margin:0 0 6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.55;color:${MUTED};text-align:center;">
              Or paste this link into your browser:
            </p>
            <p style="margin:0;font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;font-size:12px;line-height:1.55;color:${BRAND_GREEN};word-break:break-all;text-align:center;">
              <a href="${escapedUrl}" style="color:${BRAND_GREEN};text-decoration:underline;">${escapedUrl}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 0 40px;">
            <div style="height:1px;background-color:${BORDER};line-height:1px;font-size:1px;">&nbsp;</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 32px 40px;">
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.55;color:${MUTED};text-align:center;">
              Didn't request this? You can safely ignore this email — nobody will be signed in.
            </p>
          </td>
        </tr>
      </table>
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;margin-top:16px;">
        <tr>
          <td style="padding:0 8px;text-align:center;">
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.55;color:${MUTED};">
              Fine art portraits of your pet · <a href="https://${escapeHtml(host)}" style="color:${MUTED};text-decoration:underline;">${escapeHtml(host)}</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  const text = [
    "Sign in to Paw Masterpiece",
    "",
    "Tap this link to sign in. It expires in 10 minutes and can only be used once.",
    "",
    url,
    "",
    "Didn't request this? You can safely ignore this email.",
    "",
    `— Paw Masterpiece (${host})`,
  ].join("\n")

  return { html, text }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
