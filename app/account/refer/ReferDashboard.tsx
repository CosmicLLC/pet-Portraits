"use client";

import { useState } from "react";

interface RecentReferral {
  id: string;
  refereeEmailMasked: string;
  status: string;
  createdAt: string;
  creditCents: number;
}

interface Props {
  code: string;
  shareUrl: string;
  creditsCents: number;
  completedCount: number;
  discountCents: number;
  creditCents: number;
  recentReferrals: RecentReferral[];
}

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function ReferDashboard({
  code,
  shareUrl,
  creditsCents,
  completedCount,
  discountCents,
  creditCents,
  recentReferrals,
}: Props) {
  const [copied, setCopied] = useState<"code" | "url" | null>(null);

  const copy = (text: string, tag: "code" | "url") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(tag);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const shareText = `I just got a stunning AI portrait of my pet from Paw Masterpiece — thought you'd love it. Here's ${dollars(discountCents)} off your first order:`;

  return (
    <div className="max-w-3xl">
      {/* Hero */}
      <section className="bg-brand-green/5 border border-brand-green/15 rounded-3xl p-8 mb-8">
        <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-3">
          Refer & Earn
        </p>
        <h1 className="font-display text-3xl text-brand-green mb-3">
          Give {dollars(discountCents)}, get {dollars(creditCents)}.
        </h1>
        <p className="text-gray-600 leading-relaxed max-w-xl">
          Friends get {dollars(discountCents)} off their first portrait. You get {dollars(creditCents)} in store credit when they complete their first order. Credit auto-applies to your next purchase.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Your credit</p>
          <p className="font-display text-3xl font-bold text-brand-green">
            {dollars(creditsCents)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Applied automatically at checkout
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Friends joined</p>
          <p className="font-display text-3xl font-bold text-brand-green">{completedCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            Completed first orders
          </p>
        </div>
      </section>

      {/* Share tools */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <h2 className="font-display text-lg font-semibold text-brand-green mb-4">
          Share your link
        </h2>

        {/* Code */}
        <div className="mb-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Your code</p>
          <button
            onClick={() => copy(code, "code")}
            className="w-full flex items-center justify-between gap-3 bg-brand-green/5 border-2 border-dashed border-brand-green/40 rounded-xl px-4 py-3 hover:border-brand-green/70 transition-colors"
          >
            <span className="font-display text-2xl font-bold tracking-[0.2em] text-brand-green">
              {code}
            </span>
            <span className={`text-xs font-semibold ${copied === "code" ? "text-brand-green" : "text-gray-400"}`}>
              {copied === "code" ? "Copied!" : "Copy"}
            </span>
          </button>
        </div>

        {/* URL */}
        <div className="mb-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Share link</p>
          <button
            onClick={() => copy(shareUrl, "url")}
            className="w-full flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:border-brand-green/40 transition-colors"
          >
            <span className="text-sm text-gray-600 truncate">{shareUrl}</span>
            <span className={`text-xs font-semibold flex-shrink-0 ${copied === "url" ? "text-brand-green" : "text-gray-400"}`}>
              {copied === "url" ? "Copied!" : "Copy"}
            </span>
          </button>
        </div>

        {/* Socials */}
        <div className="grid grid-cols-3 gap-3">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#1DA1F2] hover:text-[#1DA1F2] transition-colors"
          >
            X / Twitter
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#1877F2] hover:text-[#1877F2] transition-colors"
          >
            Facebook
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#25D366] hover:text-[#25D366] transition-colors"
          >
            WhatsApp
          </a>
        </div>
      </section>

      {/* Recent referrals */}
      {recentReferrals.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-display text-lg font-semibold text-brand-green mb-4">
            Recent referrals
          </h2>
          <div className="divide-y divide-gray-100">
            {recentReferrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-gray-800">{r.refereeEmailMasked}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  {r.status === "completed" ? (
                    <>
                      <p className="text-sm font-semibold text-brand-green">
                        +{dollars(r.creditCents)}
                      </p>
                      <p className="text-xs text-gray-400">Credited</p>
                    </>
                  ) : (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-0.5">
                      Pending
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="mt-10 text-sm text-gray-500 leading-relaxed max-w-xl">
        <h3 className="font-display text-base font-semibold text-brand-green mb-2">How it works</h3>
        <ol className="space-y-1 list-decimal list-inside">
          <li>Share your link or code with a friend.</li>
          <li>They get {dollars(discountCents)} off their first Paw Masterpiece order automatically at checkout.</li>
          <li>Once they complete their first order, {dollars(creditCents)} in store credit lands in your balance.</li>
          <li>Your credit applies automatically to your next order — nothing to redeem.</li>
        </ol>
      </section>
    </div>
  );
}
