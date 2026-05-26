// Patches the OutreachContact rows with personalized opening lines + URL
// references from the research agent's findings. Replaces the
// "[Reference their recent post about ...]" placeholder in each body
// with a specific sentence + link.
//
// Run with:  node scripts/patch-outreach-personalization.mjs

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

async function loadEnv() {
  try {
    const text = await fs.readFile(path.join(ROOT, ".env.local"), "utf-8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      const [, key, value] = m;
      if (!process.env[key]) process.env[key] = value.replace(/^["']|["']$/g, "").trim();
    }
  } catch {}
}

// outlet (from research-batch-1.json) → handle (matches OutreachContact.handle)
const OUTLET_TO_HANDLE = {
  DogTipper: "DogTipper.com",
  "Modern Dog Magazine": "Modern Dog Magazine",
  "This Dog's Life": "This Dog's Life",
  PetGuide: "PetGuide.com",
  "Rover Blog (The Dog People)": "Rover Blog (The Dog People)",
  Dogster: "Dogster.com (Pangolia)",
  "The Dogington Post": "The Dogington Post",
  "Fido Friendly": "Fido Friendly",
  BlogPaws: "BlogPaws",
};

async function main() {
  await loadEnv();
  const prisma = new PrismaClient();

  const researchPath = path.join(ROOT, "docs", "marketing", "outreach", "research-batch-1.json");
  const research = JSON.parse(await fs.readFile(researchPath, "utf-8"));

  let patched = 0;
  for (const r of research) {
    const handle = OUTLET_TO_HANDLE[r.outlet];
    if (!handle) {
      console.warn(`  ⚠ No handle mapping for outlet "${r.outlet}", skipping`);
      continue;
    }
    const contact = await prisma.outreachContact.findFirst({ where: { handle } });
    if (!contact) {
      console.warn(`  ⚠ Contact not found for handle "${handle}", skipping`);
      continue;
    }
    if (!contact.body) continue;

    // Replace the bracketed placeholder with the personalization line.
    // Match any [Reference …] block — agents may have varied bracket wording
    // across the 9 drafts.
    const placeholderRe = /\[Reference [^\]]+\]/;
    if (!placeholderRe.test(contact.body)) {
      console.log(`  ${handle}: no placeholder found (may have been patched already), skipping`);
      continue;
    }

    const replacement = r.personalization_line;
    const newBody = contact.body.replace(placeholderRe, replacement);

    const newNotes = [
      contact.notes,
      "",
      `RESEARCH: ${r.recent_post_title || "(no specific post)"}`,
      r.recent_post_url ? `URL: ${r.recent_post_url}` : null,
      r.notes ? `Note: ${r.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    await prisma.outreachContact.update({
      where: { id: contact.id },
      data: { body: newBody, notes: newNotes },
    });
    console.log(`  ✓ ${handle}`);
    patched++;
  }

  console.log(`\nPatched ${patched} of ${research.length} contacts.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
