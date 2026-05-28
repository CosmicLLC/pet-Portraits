// One-shot pet-blogger outreach sender.
//
// Pulls every OutreachContact in status="pending" that has an email
// address + a drafted body, sends the email via Resend, and flips the
// status to "sent" with sentAt set. Skips contacts without an email
// (those need DMs or contact-form submissions — out of scope here).
//
// Sender shape:
//   From:     "Erinc — Paw Masterpiece <{FROM_EMAIL}>"
//   Reply-To: cosmic.company.llc@gmail.com   (replies land in human inbox)
//
// Markdown-style body → minimal HTML transform: newlines → <br>, blank
// lines → paragraph breaks. Keeps the email looking like a personal
// note, not a campaign blast (no header logo, no legal footer, no
// unsubscribe — these are 1-to-1 business outreach, not bulk marketing,
// so CAN-SPAM's commercial-mass-email rules don't apply).
//
// Run with: node scripts/send-outreach.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load .env.local synchronously before any module that reads env vars.
function loadEnvSync() {
  try {
    const text = fs.readFileSync(path.join(ROOT, ".env.local"), "utf-8");
    for (const raw of text.split("\n")) {
      const line = raw.replace(/\r$/, "");
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      const [, key, value] = m;
      if (!process.env[key]) {
        process.env[key] = value.replace(/^["']|["']$/g, "").trim();
      }
    }
  } catch {}
}
loadEnvSync();

const { PrismaClient } = await import("@prisma/client");
const { Resend } = await import("resend");

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@contact.pawmasterpiece.com";
const FROM_NAME = `Erinc — Paw Masterpiece <${FROM_EMAIL}>`;
const REPLY_TO = "cosmic.company.llc@gmail.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY;

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Minimal markdown→html for personal-email bodies. Keeps line breaks
// and paragraphs; converts [text](url) links; escapes everything else.
function markdownToHtml(md) {
  const escaped = escapeHtml(md);
  const linked = escaped.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" style="color:#2D4A3E;text-decoration:underline;">$1</a>'
  );
  const paragraphs = linked
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin:0 0 14px 0;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1F2A24;max-width:560px;">${paragraphs}</div>`;
}

async function main() {
  if (!RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY missing");
    process.exit(1);
  }
  const resend = new Resend(RESEND_API_KEY);
  const prisma = new PrismaClient();

  try {
    const pending = await prisma.outreachContact.findMany({
      where: {
        status: "pending",
        email: { not: null },
        body: { not: null },
        subject: { not: null },
      },
      orderBy: { priority: "asc" },
    });

    console.log(`📤 Sending ${pending.length} outreach emails…\n`);

    let sent = 0;
    let failed = 0;
    const skipped = [];

    for (const c of pending) {
      if (!c.email || !c.subject || !c.body) {
        skipped.push({ name: c.name, reason: "missing fields" });
        continue;
      }
      process.stdout.write(`  → ${c.name} (${c.email}) ... `);
      try {
        const res = await resend.emails.send({
          from: FROM_NAME,
          to: c.email,
          replyTo: REPLY_TO,
          subject: c.subject,
          html: markdownToHtml(c.body),
          text: c.body,
        });
        if (res.error) {
          console.log(`❌ ${res.error.message || res.error}`);
          failed++;
        } else {
          console.log(`✅ sent (${res.data?.id || "no-id"})`);
          await prisma.outreachContact.update({
            where: { id: c.id },
            data: { status: "sent", sentAt: new Date() },
          });
          sent++;
        }
      } catch (e) {
        console.log(`❌ ${e.message}`);
        failed++;
      }

      // 2s pacing — Resend rate-limit is generous, but personal-pitch
      // emails shouldn't look like a burst send to the receiving MTAs.
      await new Promise((r) => setTimeout(r, 2000));
    }

    console.log("");
    console.log("─".repeat(50));
    console.log(`✅ Sent:    ${sent}`);
    console.log(`❌ Failed:  ${failed}`);
    if (skipped.length) {
      console.log(`⏭️  Skipped: ${skipped.length}`);
      for (const s of skipped) console.log(`    - ${s.name}: ${s.reason}`);
    }

    // Show which still need manual outreach (no email)
    const noEmail = await prisma.outreachContact.findMany({
      where: { status: "pending", email: null },
      select: { name: true, handle: true, channel: true, url: true },
    });
    if (noEmail.length) {
      console.log("");
      console.log(
        `📋 ${noEmail.length} contacts still need manual outreach (no email — use contact form / DM):`
      );
      for (const n of noEmail) {
        console.log(`    - ${n.name} (${n.channel}): ${n.handle}${n.url ? " — " + n.url : ""}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
