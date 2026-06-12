import type { Metadata } from "next";
import Link from "next/link";
import { getStripe } from "@/lib/stripe";
import {
  isUpsellSource,
  upsellWindowMsFor,
  UPSELL_DISCOUNT_USD,
  UPSELL_LIST_PRICE_USD,
  UPSELL_PRICE_USD,
  type UpsellSource,
} from "@/lib/upsell";
import UpgradeCta from "./UpgradeCta";

// Landing page for the ladder's EMAIL touches: /upgrade?session=cs_…&source=email_24h
// Server-validates the original wallpaper purchase against Stripe and the
// per-source discount window (lib/upsell.ts) before showing the offer; the
// checkout API re-validates on click. Noindex — this page is meaningless
// without a session id.

export const metadata: Metadata = {
  title: "Upgrade to a Framed Print — Paw Masterpiece",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageState =
  | { kind: "active"; expiresAtIso: string; sessionId: string; source: UpsellSource }
  | { kind: "expired" }
  | { kind: "invalid" };

async function resolveState(
  sessionId: string,
  source: UpsellSource
): Promise<PageState> {
  if (!sessionId || !sessionId.startsWith("cs_")) return { kind: "invalid" };
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (
      session.metadata?.productType !== "wallpaper" ||
      session.payment_status !== "paid"
    ) {
      return { kind: "invalid" };
    }
    const expiresMs =
      (session.created ?? 0) * 1000 + upsellWindowMsFor(source);
    if (Date.now() >= expiresMs) return { kind: "expired" };
    return {
      kind: "active",
      expiresAtIso: new Date(expiresMs).toISOString(),
      sessionId,
      source,
    };
  } catch {
    return { kind: "invalid" };
  }
}

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: { session?: string; source?: string };
}) {
  const sessionId = (searchParams.session ?? "").trim();
  const sourceParam = searchParams.source ?? "";
  const source: UpsellSource = isUpsellSource(sourceParam)
    ? sourceParam
    : "email_24h";

  const state = await resolveState(sessionId, source);

  return (
    <main className="min-h-screen bg-cream flex flex-col">
      <header className="px-4 py-4">
        <Link
          href="/"
          className="font-display text-lg text-brand-green font-semibold"
        >
          🐾 Paw Masterpiece
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="max-w-md w-full">
          {state.kind === "active" && (
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl">
              {/* CSS frame mockup — same treatment as the success modal. */}
              <div className="mb-6 flex justify-center">
                <div
                  className="relative"
                  style={{
                    width: 200,
                    padding: 13,
                    background:
                      "linear-gradient(135deg, #1f1410 0%, #2a1d15 40%, #1a100c 100%)",
                    borderRadius: 6,
                    boxShadow:
                      "0 22px 50px -18px rgba(0,0,0,0.5), 0 8px 20px -8px rgba(0,0,0,0.3)",
                  }}
                >
                  <div
                    className="bg-white overflow-hidden"
                    style={{
                      aspectRatio: "4 / 5",
                      boxShadow: "inset 0 0 14px rgba(0,0,0,0.18)",
                    }}
                  >
                    <img
                      src="/examples/renaissance.png"
                      alt="Framed pet portrait example"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 text-center -mt-3 mb-4">
                Example — yours features the portrait you already created
              </p>

              <h1 className="font-display text-2xl sm:text-3xl text-brand-green text-center mb-2 leading-tight">
                Put your portrait on the wall
              </h1>
              <p className="text-sm text-gray-700 text-center mb-4 leading-relaxed">
                The same artwork from your wallpaper, as an 8×10 framed
                fine-art print. Your wallpaper-buyer discount of $
                {UPSELL_DISCOUNT_USD} is still active.
              </p>

              <div className="flex items-baseline justify-center gap-3 mb-4">
                <span className="font-display text-3xl font-bold text-brand-green">
                  ${UPSELL_PRICE_USD}
                </span>
                <span className="text-lg text-gray-400 line-through">
                  ${UPSELL_LIST_PRICE_USD}
                </span>
                <span className="text-xs text-brand-gold font-semibold">
                  + free shipping
                </span>
              </div>

              <UpgradeCta
                originalSessionId={state.sessionId}
                source={state.source}
                expiresAt={state.expiresAtIso}
              />
            </div>
          )}

          {state.kind === "expired" && (
            <div className="rounded-3xl bg-white p-8 shadow-xl text-center">
              <h1 className="font-display text-2xl text-brand-green mb-3">
                This offer has ended
              </h1>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Your wallpaper-buyer discount window has closed — but your
                pet still deserves a spot on the wall. Framed prints are
                available any time at full price.
              </p>
              <Link
                href="/start"
                className="inline-block bg-brand-green text-cream px-8 py-3.5 rounded-full font-display font-semibold text-sm hover:bg-brand-green/90 transition-colors"
              >
                Create a framed print
              </Link>
            </div>
          )}

          {state.kind === "invalid" && (
            <div className="rounded-3xl bg-white p-8 shadow-xl text-center">
              <h1 className="font-display text-2xl text-brand-green mb-3">
                We couldn&rsquo;t find that purchase
              </h1>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                This upgrade link is tied to a recent wallpaper purchase and
                this one doesn&rsquo;t match an eligible order. If you think
                that&rsquo;s wrong, reply to your purchase email and
                we&rsquo;ll sort it out.
              </p>
              <Link
                href="/"
                className="inline-block bg-brand-green text-cream px-8 py-3.5 rounded-full font-display font-semibold text-sm hover:bg-brand-green/90 transition-colors"
              >
                Back to Paw Masterpiece
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
