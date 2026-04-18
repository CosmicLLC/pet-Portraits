import { Resend } from "resend"
import { prisma } from "@/lib/prisma"
import { unsubUrl } from "@/lib/unsub-token"

const CREAM = "#FAF7F2"
const BRAND_GREEN = "#2D4A3E"
const BRAND_GOLD = "#C4A35A"
const MUTED = "#6B7A73"
const BORDER = "#E6DFD3"

const MAX_BATCH = 100

function businessAddress(): string {
  // CAN-SPAM Section 5 requires a valid physical postal address in every
  // commercial email. Set BUSINESS_ADDRESS on Vercel.
  return (
    process.env.BUSINESS_ADDRESS ||
    "Cosmic Company LLC · (physical address not yet configured — set BUSINESS_ADDRESS env var)"
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function logoSrc(): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"
  return `${base}/logo.jpg`
}

// Wraps campaign HTML with brand header, legal footer (unsub link + physical
// address), and the List-Unsubscribe plumbing mail clients expect.
function wrapMarketingEmail(innerHtml: string, email: string): string {
  const unsub = unsubUrl(email)
  const esc = escapeHtml
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
      <tr><td style="padding:32px 40px 16px 40px;text-align:center;">
        <img src="${esc(logoSrc())}" alt="Paw Masterpiece" width="64" height="64" style="display:inline-block;width:64px;height:64px;border:0;border-radius:14px;outline:none;" />
        <div style="margin-top:12px;font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:-0.3px;color:${BRAND_GREEN};font-weight:600;">Paw Masterpiece</div>
        <div style="margin-top:6px;height:1px;width:48px;background-color:${BRAND_GOLD};display:inline-block;line-height:1px;font-size:1px;">&nbsp;</div>
      </td></tr>
      <tr><td style="padding:8px 40px 24px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1F2A24;">
        ${innerHtml}
      </td></tr>
      <tr><td style="padding:24px 40px 0 40px;"><div style="height:1px;background-color:${BORDER};line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
      <tr><td style="padding:20px 40px 32px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.55;color:${MUTED};text-align:center;">
        <p style="margin:0 0 8px 0;">${esc(businessAddress())}</p>
        <p style="margin:0;">
          You're receiving this because you subscribed to updates from Paw Masterpiece.<br/>
          <a href="${esc(unsub)}" style="color:${MUTED};text-decoration:underline;">Unsubscribe with one click</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

function wrapMarketingText(innerText: string, email: string): string {
  const unsub = unsubUrl(email)
  return (
    innerText +
    "\n\n---\n" +
    "You received this because you subscribed to Paw Masterpiece updates.\n" +
    `Unsubscribe: ${unsub}\n` +
    businessAddress()
  )
}

export type CampaignInput = {
  subject: string
  htmlBody: string // inner HTML — wrapMarketingEmail adds header + legal footer
  textBody?: string
}

export type SendResult = {
  campaignId: string
  recipients: number
  delivered: number
  failed: number
}

export async function sendCampaign(
  input: CampaignInput,
  createdBy: string | null
): Promise<SendResult> {
  const campaign = await prisma.campaign.create({
    data: {
      subject: input.subject,
      htmlBody: input.htmlBody,
      textBody: input.textBody ?? null,
      status: "sending",
      createdBy,
    },
  })

  const subscribers = await prisma.subscriber.findMany({
    where: { unsubscribedAt: null },
    select: { email: true },
  })

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { recipients: subscribers.length },
  })

  const resend = new Resend(process.env.RESEND_API_KEY!)
  const from = `Paw Masterpiece <${process.env.FROM_EMAIL || "noreply@pawmasterpiece.com"}>`

  let delivered = 0
  let failed = 0

  for (let i = 0; i < subscribers.length; i += MAX_BATCH) {
    const batch = subscribers.slice(i, i + MAX_BATCH)
    const payloads = batch.map((s) => ({
      from,
      to: s.email,
      subject: input.subject,
      html: wrapMarketingEmail(input.htmlBody, s.email),
      text: wrapMarketingText(input.textBody ?? stripHtml(input.htmlBody), s.email),
      headers: {
        "List-Unsubscribe": `<${unsubUrl(s.email)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }))

    try {
      // Resend accepts up to 100 per call. `emails.send` supports a single
      // object per call; use the batch API when available.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (resend as any).batch.send(payloads)
      if (res?.error) {
        console.error("Batch send error:", res.error)
        failed += batch.length
      } else {
        delivered += batch.length
      }
    } catch (err) {
      console.error("Batch send failed:", err)
      failed += batch.length
    }
  }

  const now = new Date()
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      status: failed === subscribers.length && subscribers.length > 0 ? "failed" : "sent",
      delivered,
      failed,
      sentAt: now,
    },
  })

  if (delivered > 0) {
    await prisma.subscriber
      .updateMany({
        where: { unsubscribedAt: null },
        data: { lastEmailSent: now },
      })
      .catch(() => {})
  }

  return { campaignId: campaign.id, recipients: subscribers.length, delivered, failed }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
