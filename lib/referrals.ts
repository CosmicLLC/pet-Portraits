// Refer-a-friend core helpers. Code format is deliberately readable at a
// glance — no lowercase, no letters that look like digits (0/O, 1/I/L),
// 8 chars — so users can dictate codes over the phone when they gift-giving.
//
// Flow:
// 1. Signed-in user gets a personal code via /api/referral/me (lazy-created).
// 2. They share pawmasterpiece.com/?ref=CODE.
// 3. A referee landing with ?ref= has a 30-day cookie set by <RefCapture/>.
// 4. At checkout, create-checkout reads the cookie, validates the code, and
//    attaches a dynamic Stripe coupon worth $10 off plus passes the code
//    through in session.metadata.referralCode.
// 5. On the webhook, if a session completes with referralCode metadata, the
//    referrer's referralCredits balance is bumped by $10 and a Referral row
//    is created.
// 6. When the referrer next checks out, their balance auto-applies as a
//    second dynamic coupon, and the session metadata records how much was
//    applied so the webhook can decrement the balance after success.

import { prisma } from "./prisma";

export const REFERRAL_COOKIE = "pm_ref";
// 30 days — long enough for someone to "remember to buy later," short
// enough that stale referrals don't linger and distort attribution.
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
// Dollar value (in cents) given to the referee at checkout and credited to
// the referrer on completion. Symmetric so the share copy is simple.
export const REFERRAL_DISCOUNT_CENTS = 1000; // $10 off
export const REFERRAL_CREDIT_CENTS = 1000; // $10 store credit
// Codes skip characters that look alike so customers can read them aloud.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

function randomCode(): string {
  let out = "";
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

// Get-or-create a referral code for a user. Collisions are astronomically
// unlikely (31^8 ≈ 8.5e11), but we still retry on uniqueness violations.
export async function ensureReferralCode(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (existing?.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      });
      return updated.referralCode ?? code;
    } catch (err) {
      // Prisma P2002 unique violation — regenerate and try again.
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("Unique") && !msg.includes("P2002")) throw err;
    }
  }
  throw new Error("Could not allocate a unique referral code after 5 tries");
}

// Look up the referrer behind a code. Returns null for an invalid or
// self-referral (we check in create-checkout before attributing).
export async function lookupReferrer(code: string | null | undefined) {
  if (!code) return null;
  const upper = code.toUpperCase().trim();
  if (upper.length !== CODE_LENGTH) return null;
  return prisma.user.findUnique({
    where: { referralCode: upper },
    select: { id: true, email: true, referralCode: true },
  });
}
