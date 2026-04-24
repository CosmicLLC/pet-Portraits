"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

// Post-purchase share block. Signed-in buyers get their personal code + a
// real give-$10/get-$10 pitch; guests get a generic share with a soft
// sign-in prompt so they can claim future credit.
//
// Rendered only on the /?success=true landing — the emotional peak of the
// whole funnel, where referral share-rates are 4–6× higher than on a
// standalone account page. We fetch /api/referral/me on mount (rather than
// passing the code as a query param) so the success URL stays clean and
// the code isn't leaked into referral/analytics paths.

interface MeResponse {
  code: string;
  creditsCents: number;
  discountCents: number;
  creditCents: number;
}

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function SuccessReferralShare() {
  const { data: sessionData, status } = useSession();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"code" | "url" | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch("/api/referral/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const copy = (text: string, tag: "code" | "url") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(tag);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  // Guest buyers — no code to share, but we tease the referral program
  // and offer a sign-up CTA so their next purchase can earn them credit.
  if (status !== "authenticated" || !me) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://pawmasterpiece.com";
    const shareText =
      "I just got a stunning AI portrait of my pet from Paw Masterpiece — thought you'd love it:";
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-6 mb-8 animate-fade-in-up">
        <h2 className="font-display text-xl text-brand-green mb-1 text-center">
          Share with Friends
        </h2>
        <p className="text-sm text-gray-500 text-center mb-5">
          Know a pet parent who&apos;d love this? Share the love.
        </p>

        <button
          onClick={() => copy(origin, "url")}
          className="w-full flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3 hover:border-brand-green/40 transition-colors group"
        >
          <span className="text-sm text-gray-600 truncate">{origin}</span>
          <span
            className={`text-xs font-semibold flex-shrink-0 ${
              copied === "url" ? "text-brand-green" : "text-gray-400 group-hover:text-brand-green"
            } transition-colors`}
          >
            {copied === "url" ? "Copied!" : "Copy"}
          </span>
        </button>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(origin)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#1DA1F2] hover:text-[#1DA1F2] transition-colors"
          >
            X / Twitter
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(origin)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#1877F2] hover:text-[#1877F2] transition-colors"
          >
            Facebook
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + origin)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#25D366] hover:text-[#25D366] transition-colors"
          >
            WhatsApp
          </a>
        </div>

        {/* Sign-in nudge so the buyer can earn credit on future shares */}
        <div className="border-t border-gray-100 pt-4 text-center">
          <p className="text-xs text-gray-500 mb-2">
            <strong className="text-brand-green">Give $10, get $10.</strong> Create an account to earn credit every time a friend buys.
          </p>
          <Link
            href={`/auth/signup?callbackUrl=${encodeURIComponent("/account/refer")}`}
            className="text-xs text-brand-green font-semibold hover:underline"
          >
            Create an account →
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated buyer — real personalized refer-and-earn pitch.
  const origin = typeof window !== "undefined" ? window.location.origin : "https://pawmasterpiece.com";
  const shareUrl = `${origin}/?ref=${me.code}`;
  const shareText = `I just got a stunning AI portrait of my pet from Paw Masterpiece — thought you'd love it. Here's ${dollars(me.discountCents)} off your first order:`;
  const firstName = sessionData?.user?.name?.split(" ")[0] ?? "Give";
  const heroTitle =
    firstName === "Give"
      ? `Give ${dollars(me.discountCents)}, get ${dollars(me.creditCents)}.`
      : `${firstName}, give ${dollars(me.discountCents)} and get ${dollars(me.creditCents)} back.`;

  return (
    <div className="bg-white rounded-3xl border-2 border-brand-green/20 shadow-lg p-6 mb-8 animate-fade-in-up">
      <div className="text-center mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-green/60 mb-1">
          Refer & Earn
        </p>
        <h2 className="font-display text-xl text-brand-green font-semibold mb-1">
          {heroTitle}
        </h2>
        <p className="text-sm text-gray-500">
          Friends get {dollars(me.discountCents)} off. You get {dollars(me.creditCents)} off your next order the moment they buy.
        </p>
      </div>

      {/* Personal code */}
      <button
        onClick={() => copy(me.code, "code")}
        className="w-full flex items-center justify-between gap-3 bg-brand-green/5 border-2 border-dashed border-brand-green/40 rounded-xl px-4 py-3 mb-3 hover:border-brand-green/70 transition-colors"
      >
        <span className="font-display text-xl font-bold tracking-[0.2em] text-brand-green">
          {me.code}
        </span>
        <span
          className={`text-xs font-semibold flex-shrink-0 ${
            copied === "code" ? "text-brand-green" : "text-gray-400"
          }`}
        >
          {copied === "code" ? "Copied!" : "Copy code"}
        </span>
      </button>

      {/* Share URL */}
      <button
        onClick={() => copy(shareUrl, "url")}
        className="w-full flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 hover:border-brand-green/40 transition-colors group"
      >
        <span className="text-sm text-gray-600 truncate">{shareUrl}</span>
        <span
          className={`text-xs font-semibold flex-shrink-0 ${
            copied === "url" ? "text-brand-green" : "text-gray-400 group-hover:text-brand-green"
          } transition-colors`}
        >
          {copied === "url" ? "Copied!" : "Copy"}
        </span>
      </button>

      {/* Socials */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#1DA1F2] hover:text-[#1DA1F2] transition-colors"
        >
          X / Twitter
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#1877F2] hover:text-[#1877F2] transition-colors"
        >
          Facebook
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#25D366] hover:text-[#25D366] transition-colors"
        >
          WhatsApp
        </a>
      </div>

      <p className="text-center">
        <Link
          href="/account/refer"
          className="text-xs text-brand-green font-semibold hover:underline"
        >
          View your referral dashboard →
        </Link>
      </p>

      {loading ? null : me.creditsCents > 0 ? (
        <div className="mt-4 bg-brand-gold/10 border border-brand-gold/30 rounded-xl px-4 py-2.5 text-center">
          <p className="text-xs text-brand-green">
            <strong>{dollars(me.creditsCents)}</strong> in credit ready for your next order.
          </p>
        </div>
      ) : null}
    </div>
  );
}
