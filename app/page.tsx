"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import LandingHeader from "@/components/LandingHeader";
import PostGenerationEmailCapture from "@/components/PostGenerationEmailCapture";
import UploadStep from "@/components/UploadStep";
import { fetchJson } from "@/lib/fetch-json";
import StylePicker from "@/components/StylePicker";
import PortraitOffer from "@/components/PortraitOffer";
import GenerateButton from "@/components/GenerateButton";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import FooterNewsletter from "@/components/FooterNewsletter";
import BrowseAbandonmentCapture from "@/components/BrowseAbandonmentCapture";
import FAQ from "@/components/FAQ";
import HomeJsonLd from "@/components/HomeJsonLd";
import SuccessReferralShare from "@/components/SuccessReferralShare";
import NewsletterInline from "@/components/NewsletterInline";
import ClaimFreePrint from "@/components/ClaimFreePrint";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { StyleKey } from "@/lib/gemini";
import { track, productValue } from "@/lib/analytics";
import type { ProductType } from "@/lib/products";
import { HOME_REVIEWS } from "@/lib/reviews";

type Step = "upload" | "style" | "generate" | "preview";

const STEPS: Step[] = ["style", "upload", "generate", "preview"];
const STEP_LABELS = ["Style", "Upload", "Generate", "Preview"];

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Home() {
  const [step, setStep] = useState<Step>("style");
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState<StyleKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAbandonmentCapture, setShowAbandonmentCapture] = useState(false);
  const [portraitEmailCaptured, setPortraitEmailCaptured] = useState(false);
  const { data: session } = useSession();

  // Countdown timer for preview step
  const [countdown, setCountdown] = useState(10 * 60);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Success page upsell state
  const [upsellLoading, setUpsellLoading] = useState(false);
  const [upsellDone, setUpsellDone] = useState(false);

  // Read URL params only after mount to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Fire purchase event once per unique Stripe redirect. Guarded by sessionStorage
  // on imageId so back-button or hard-reload doesn't double-count. Value is
  // derived from productType; transaction_id left undefined because Stripe
  // session_id isn't on the success URL — CAPI server-side will supply it later.
  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") !== "true") return;
    const imageId = params.get("imageId");
    const productType = params.get("productType") as ProductType | null;
    if (!imageId) return;
    const key = `purchase-tracked:${imageId}:${productType ?? ""}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    const value = productType ? productValue(productType) : undefined;
    track({
      name: "purchase",
      value,
      productType: productType ?? undefined,
    });
  }, [mounted]);
  const urlParams = mounted ? new URLSearchParams(window.location.search) : null;
  const isSuccess = urlParams?.get("success") === "true";
  const isCanceled = urlParams?.get("canceled") === "true";
  const successImageId = urlParams?.get("imageId") ?? null;
  const successProductType = urlParams?.get("productType") ?? null;
  const successSessionId = urlParams?.get("session_id") ?? null;
  // Customers who already purchased a canvas (direct canvas or bundle) shouldn't be
  // re-pitched a canvas on the success page.
  const showCanvasUpsell =
    !!successImageId &&
    successProductType !== "canvas" &&
    successProductType !== "bundle" &&
    successProductType !== "canvas_upsell";

  // Countdown: start/reset when entering preview step
  useEffect(() => {
    if (step !== "preview") {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }
    setCountdown(10 * 60);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c <= 1 ? (clearInterval(countdownRef.current!), 0) : c - 1));
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [step]);

  // Browse-abandonment capture 30s after portrait is ready
  useEffect(() => {
    if (step !== "preview" || portraitEmailCaptured) return;
    const timer = setTimeout(() => setShowAbandonmentCapture(true), 30000);
    return () => clearTimeout(timer);
  }, [step, portraitEmailCaptured]);

  // Wire wizard step state into browser history so the phone back button
  // (and Android system back / iOS swipe-back) walks back through steps
  // instead of exiting the page. Each forward step transition pushState's
  // a `pmStep` marker; the popstate listener mirrors that back into React.
  // The flag prevents the sync effect below from re-pushing on popstate.
  const popstateRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Tag the initial entry so back-from-style can still distinguish "wizard"
    // from "left the page entirely."
    window.history.replaceState({ pmStep: "style" }, "");
    const onPop = (e: PopStateEvent) => {
      const target = e.state?.pmStep;
      if (target && (STEPS as readonly string[]).includes(target)) {
        popstateRef.current = true;
        setError(null);
        setStep(target as Step);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Sync history with step on every change. Skip the push when the change
  // came from popstate (history is already where it should be).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (popstateRef.current) {
      popstateRef.current = false;
      return;
    }
    if (window.history.state?.pmStep === step) return;
    window.history.pushState({ pmStep: step }, "");
  }, [step]);

  const resetState = useCallback(() => {
    setStep("style");
    setFile(null);
    setStyle(null);
    setWatermarkedImage(null);
    setImageId(null);
    setError(null);
    setShowAbandonmentCapture(false);
    setPortraitEmailCaptured(false);
    requestAnimationFrame(() => {
      document.getElementById("create")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  // Route in-app back through history.back() so the phone back button and
  // the on-page back arrow stay synchronized — both pop the same entry.
  const handleBack = useCallback(() => {
    setError(null);
    if (typeof window !== "undefined" && window.history.state?.pmStep) {
      window.history.back();
      return;
    }
    if (step === "upload") setStep("style");
    else if (step === "generate") setStep("upload");
    else if (step === "preview") setStep("generate");
  }, [step]);

  const handleStepClick = useCallback((targetStep: Step) => {
    const currentIndex = STEPS.indexOf(step);
    const targetIndex = STEPS.indexOf(targetStep);
    if (targetIndex < currentIndex) {
      setError(null);
      // Pop N history entries so phone back stays consistent with the jump.
      if (typeof window !== "undefined" && window.history.state?.pmStep) {
        window.history.go(targetIndex - currentIndex);
        return;
      }
      setStep(targetStep);
    }
  }, [step]);

  const handleFileSelected = useCallback((f: File) => {
    setFile(f);
    setStep("generate");
    setError(null);
  }, []);

  const handleStyleSelect = useCallback((s: StyleKey) => {
    setStyle(s);
    setStep("upload");
    setError(null);
  }, []);

  const handleGenerate = useCallback(
    async (overrideStyle?: StyleKey) => {
      if (!file) return;
      // Guard — if an event handler accidentally passes a non-string
      // (e.g. a MouseEvent), ignore it and use the selected style state.
      // Keeps us from sending "[object Object]" to the API.
      const useStyle =
        typeof overrideStyle === "string" ? overrideStyle : style;
      if (!useStyle) return;
      setLoading(true);
      setError(null);
      track({ name: "portrait_generation_start", style: useStyle });
      try {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("style", useStyle);
        const data = await fetchJson<{ watermarkedImage: string; imageId: string }>(
          "/api/generate",
          { method: "POST", body: formData }
        );
        setStyle(useStyle);
        setWatermarkedImage(data.watermarkedImage);
        setImageId(data.imageId);
        setStep("preview");
        track({ name: "portrait_generated", style: useStyle, imageId: data.imageId });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Generation failed — please try again or use a clearer photo."
        );
      } finally {
        setLoading(false);
      }
    },
    [file, style]
  );

  // Re-render the current pet photo in a different style without leaving
  // the preview screen. Tap a style button → fresh generation, same file.
  const handleSwitchStyle = useCallback(
    (next: StyleKey) => {
      if (!file || loading || next === style) return;
      handleGenerate(next);
    },
    [file, loading, style, handleGenerate]
  );

  // Auto-start generation the instant a photo is imported — no button click.
  // Style is chosen before upload (style → upload → generate), so the moment
  // we land on the "generate" step with a file we kick off generation. The
  // ref fires it once per arrival; on error the step stays put and the manual
  // GenerateButton stays available as a fallback. Going Back from preview does
  // NOT re-fire (watermarkedImage is already set), so no surprise re-generation.
  const autoGenRef = useRef(false);
  useEffect(() => {
    if (step !== "generate") {
      autoGenRef.current = false;
      return;
    }
    if (file && style && !loading && !watermarkedImage && !error && !autoGenRef.current) {
      autoGenRef.current = true;
      handleGenerate();
    }
  }, [step, file, style, loading, watermarkedImage, error, handleGenerate]);

  const handleUpsell = useCallback(async () => {
    if (!successImageId) return;
    setUpsellLoading(true);
    track({ name: "begin_checkout", productType: "canvas" as ProductType, value: 59, imageId: successImageId });
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType: "canvas_upsell", imageId: successImageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch {
      setUpsellLoading(false);
    }
  }, [successImageId]);

  // ─── Success page ────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <main className="min-h-screen px-4 py-16 bg-cream">
        <div className="max-w-lg mx-auto">
          {/* Thank you */}
          <div className="text-center animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-brand-green flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-4xl text-brand-green mb-4">Thank you!</h1>
            <p className="text-gray-600 mb-2 text-lg">Your portrait is on its way.</p>
            <p className="text-gray-500 mb-10 text-sm">Check your email for the full-resolution download link.</p>
          </div>

          {/* Campaign bonus claim for digital-only orders. Self-hides on
              physical orders (already auto-fulfilled) and outside the
              active campaign window. */}
          {successSessionId && <ClaimFreePrint sessionId={successSessionId} />}

          {/* Post-purchase upsell — Framed Print at 25% off */}
          {showCanvasUpsell && !upsellDone && (
            <div className="bg-white rounded-3xl border-2 border-brand-green/20 shadow-lg p-6 mb-8 animate-fade-in-up">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center flex-shrink-0 text-2xl">
                  🖼️
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-green/60 mb-0.5">
                    One-time offer
                  </p>
                  <h2 className="font-display text-lg text-brand-green font-semibold leading-snug mb-1">
                    Add a Framed Print — 25% Off
                  </h2>
                  <p className="text-sm text-gray-500 mb-3">
                    Gallery-quality 8×10 framed print shipped to your door. Normally $79 — yours right now for just{" "}
                    <strong className="text-brand-green">$59</strong>.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl font-bold text-brand-green">$59</span>
                    <span className="text-sm text-gray-400 line-through">$79</span>
                    <span className="bg-brand-gold/10 text-brand-gold text-xs font-bold px-2 py-0.5 rounded-full">
                      Save 25%
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleUpsell}
                disabled={upsellLoading}
                className="mt-5 w-full bg-brand-green text-white py-3.5 rounded-xl font-display font-semibold hover:bg-brand-green/90 transition-all hover:shadow-lg disabled:opacity-60"
              >
                {upsellLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing…
                  </span>
                ) : (
                  "Add to Order — $59"
                )}
              </button>
              <button
                onClick={() => setUpsellDone(true)}
                className="w-full text-center text-xs text-gray-400 mt-2 hover:text-gray-500 transition-colors"
              >
                No thanks, I&apos;ll skip this offer
              </button>
            </div>
          )}

          {/* Referral / Share section — personalized code for signed-in buyers */}
          <SuccessReferralShare />

          {/* Newsletter opt-in. They're already on the order-updates list via
              CAN-SPAM existing-customer exemption; this adds explicit consent
              for marketing content (style drops, anniversary reminders) and
              tags them as success_page source for segmentation. */}
          <div className="mb-8">
            <NewsletterInline
              source="success_page"
              headline="Want first dibs on new styles?"
              copy="We send one short email a week — new style drops, framing inspiration, and a reminder before your pet's portrait anniversary. Unsubscribe anytime."
              size="compact"
            />
          </div>

          <div className="text-center">
            <a
              href="/"
              className="inline-block bg-brand-green text-white px-10 py-4 rounded-full font-display font-semibold hover:bg-brand-green/90 transition-all hover:shadow-lg"
            >
              Create Another Portrait
            </a>
          </div>
        </div>
      </main>
    );
  }

  // ─── Main app ────────────────────────────────────────────────────────
  // Landing-page marketing sections show during the first two steps (style + upload)
  // so users browsing see all the copy, then disappear once generation starts.
  const isBrowsing = step === "style" || step === "upload";
  return (
    <main className="min-h-screen bg-cream">
      {isBrowsing && <HomeJsonLd />}
      {isBrowsing && <ExitIntentPopup />}
      <PostGenerationEmailCapture
        trigger={step === "preview" && !!watermarkedImage}
        imageType="portrait"
      />

      {/* Shared sitewide header — same nav as every other public page so
          the mega-menu, promo bar, and auth menu show up here too. The
          old bespoke header had three anchor-scroll nav links and a
          reset-state Logo button; both are gone in favor of consistent
          navigation. Anchor scroll users can still reach the in-page
          sections by scrolling, and the "Reviews" link now points to
          the /reviews page (richer + cacheable). */}
      <LandingHeader />

      {/* Hero — pre-generation only. The product photo is a full-bleed atmospheric
          background that dissolves into the cream on the text side, rather than
          sitting next to the copy as an obvious image. */}
      {isBrowsing && (
        <section className="relative bg-cream border-b border-gray-100 overflow-hidden isolate">
          {/* Background image layer — positioned to the right so the dog and framed
              portrait hug the viewport edge. Feathered masks + color washes dissolve
              it into the cream canvas on the text side. Subtle parallax on scroll. */}
          <div className="pointer-events-none absolute inset-0 select-none" aria-hidden="true">
            <div
              data-parallax="0.12"
              className="absolute inset-0"
              style={{
                backgroundImage: "url(/hero-pet.jpg)",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                backgroundPosition: "right center",
                WebkitMaskImage:
                  "radial-gradient(120% 110% at 85% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0) 85%)",
                maskImage:
                  "radial-gradient(120% 110% at 85% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0) 85%)",
              }}
            />
            {/* Warm cream wash on the left so the text has a clean ground */}
            <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/80 to-transparent" />
            {/* Cream-to-transparent top fade softens the hard edge against the header */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cream/70 to-transparent" />
            {/* Cream-to-transparent bottom fade so the image settles into the next section */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cream to-transparent" />
          </div>

          {/* Foreground content */}
          <div className="relative max-w-6xl mx-auto px-4 py-14 sm:py-24 lg:py-32 min-h-[380px] sm:min-h-[520px] flex items-center">
            <div className="w-full md:max-w-[62%] text-center md:text-left reveal">
              <div className="flex items-center justify-center md:justify-start gap-1.5 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-sm text-gray-600 ml-2 drop-shadow-[0_1px_0_rgba(250,247,242,0.8)]">Loved by pet parents</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[4rem] text-brand-green mb-5 leading-[1.05] drop-shadow-[0_1px_0_rgba(250,247,242,0.9)]">
                Turn Your Pet Into<br />a Work of Art
              </h1>
              <p className="text-gray-600 text-lg sm:text-xl max-w-xl md:mx-0 mx-auto mb-8 drop-shadow-[0_1px_0_rgba(250,247,242,0.9)]">
                Upload a photo, choose a style, and get a stunning portrait in under a minute. The perfect gift for any pet lover.
              </p>
              <div className="mb-8 flex justify-center md:justify-start md:pl-16 lg:pl-24">
                <button
                  onClick={resetState}
                  className="group inline-flex items-center gap-3 bg-brand-green text-cream px-8 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg font-display font-semibold shadow-[0_12px_30px_-10px_rgba(45,74,62,0.45)] hover:bg-brand-green/90 hover:shadow-[0_18px_38px_-12px_rgba(45,74,62,0.55)] hover:-translate-y-0.5 transition-all"
                >
                  Create Your Portrait
                  <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-gray-500 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Ready in seconds
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  Perfect gift
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Secure checkout
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Money-back guarantee banner — pre-generation only */}
      {isBrowsing && (
        <div className="bg-brand-green/5 border-b border-brand-green/10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center gap-3 text-center">
            <svg className="w-5 h-5 text-brand-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-sm text-brand-green font-medium">
              <strong>Satisfaction Guarantee</strong> — Love your portrait or we&apos;ll redo it free within 7 days of purchase.
            </p>
          </div>
        </div>
      )}

      {/* Main wizard */}
      <div id="create" className={`max-w-2xl mx-auto px-4 py-12 sm:py-16 ${step === "preview" ? "pb-24" : ""}`}>
        {/* Thin progress bar */}
        <div className="w-full h-[3px] bg-gray-200 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-green to-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${(STEPS.indexOf(step) + 1) * 25}%` }}
          />
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-3 mb-12">
          {STEPS.map((s, i) => {
            const stepIndex = STEPS.indexOf(step);
            const isActive = s === step;
            const isComplete = i < stepIndex;
            return (
              <div key={s} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => handleStepClick(s)}
                    disabled={!isComplete && !isActive}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-brand-green text-white scale-110"
                        : isComplete
                          ? "bg-brand-green text-white cursor-pointer hover:scale-110 hover:shadow-md"
                          : "bg-gray-200 text-gray-400 cursor-default"
                    }`}
                    aria-label={isComplete ? `Go back to ${STEP_LABELS[i]} step` : STEP_LABELS[i]}
                  >
                    {isComplete ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </button>
                  <span className={`text-xs font-medium ${isActive ? "text-brand-green" : "text-gray-400"}`}>
                    {STEP_LABELS[i]}
                  </span>
                </div>
                {i < 3 && (
                  <div className={`w-12 h-0.5 mb-5 ${isComplete ? "bg-brand-green" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Countdown timer — preview step only */}
        {step === "preview" && (
          <div className="flex items-center justify-center gap-2 mb-6 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 w-fit mx-auto">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Your preview expires in{" "}
              <strong className="font-mono">{formatCountdown(countdown)}</strong>
            </span>
          </div>
        )}

        {/* Step content */}
        <div className="animate-fade-in-up">
          {step === "style" && (
            <StylePicker selected={style} onSelect={handleStyleSelect} />
          )}

          {step === "upload" && (
            <div>
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-green transition-colors mb-6"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <UploadStep onFileSelected={handleFileSelected} />
            </div>
          )}

          {step === "generate" && (
            <div className="w-full flex flex-col items-center gap-8">
              <button
                onClick={handleBack}
                className="self-start flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-green transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="flex items-center gap-5 p-5 bg-white rounded-2xl border border-gray-200 w-full max-w-sm shadow-sm">
                {file && (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Selected pet"
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                )}
                <div>
                  <p className="font-display text-lg font-semibold text-brand-green">Ready to create</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {style === "oil" ? "Oil Painting" : style === "lineart" ? "Pencil / Line Art" : style === "renaissance" ? "Renaissance" : style === "astronaut" ? "Astronaut" : style === "dogue" ? "DOGUE Cover" : "Watercolor"}{" "}style
                  </p>
                </div>
              </div>
              <GenerateButton disabled={!file || !style} loading={loading} onClick={() => handleGenerate()} />
            </div>
          )}

          {step === "preview" && watermarkedImage && imageId && (
            <div className="w-full">
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-green transition-colors mb-6"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <PortraitOffer
                imageId={imageId}
                watermarkedImage={watermarkedImage}
                onError={setError}
              />

              {/* ─── Admin-only: download full-res without purchase ──── */}
              {session?.user?.role === "admin" && imageId && (
                <a
                  href={`/api/admin/download-portrait/${imageId}`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 bg-brand-gold/10 border border-brand-gold/40 text-brand-green text-sm font-semibold px-4 py-3 rounded-xl hover:bg-brand-gold/20 transition-colors"
                  title="Admin-only: download the unwatermarked full-resolution portrait"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download full-res (admin)
                </a>
              )}

              {/* ─── Try another style (same pet, fresh generation) ─── */}
              <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-[11px] font-display font-semibold uppercase tracking-widest text-brand-gold mb-2.5 text-center">
                  Try another style
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { key: "watercolor", label: "Watercolor", img: "/examples/watercolor.png" },
                    { key: "oil",        label: "Oil",        img: "/examples/oil.png" },
                    { key: "renaissance", label: "Renaissance", img: "/examples/renaissance.png" },
                    { key: "lineart",    label: "Line Art",   img: "/examples/lineart.png" },
                  ] as const).map((s) => {
                    const active = style === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => handleSwitchStyle(s.key)}
                        disabled={loading || active}
                        className={`relative aspect-[3/4] rounded-lg overflow-hidden ring-2 transition-all ${
                          active ? "ring-brand-green" : "ring-transparent hover:ring-brand-green/40"
                        } ${loading && !active ? "opacity-40 cursor-wait" : ""}`}
                        title={active ? `Currently showing ${s.label}` : `Switch to ${s.label}`}
                      >
                        <img
                          src={s.img}
                          alt={`${s.label} style`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent h-2/3" />
                        <span className="absolute inset-x-0 bottom-1 text-center text-[10px] sm:text-xs font-semibold text-white drop-shadow">
                          {s.label}
                        </span>
                        {active && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-green text-white flex items-center justify-center">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {loading && (
                  <p className="text-[11px] text-gray-500 text-center mt-2">Rendering new style — hold tight.</p>
                )}
              </div>




              {showAbandonmentCapture && !portraitEmailCaptured && (
                <BrowseAbandonmentCapture
                  imageId={imageId}
                  onCaptured={() => setPortraitEmailCaptured(true)}
                />
              )}

            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl text-center animate-fade-in-up">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {isCanceled && (
          <div className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl text-center animate-fade-in-up">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-display text-lg text-amber-800 mb-1">Your payment was canceled</p>
            <p className="text-amber-700 text-sm mb-4">Your portrait is still saved. Ready to try again?</p>
            <a href="/" className="inline-block bg-brand-green text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-green/90 transition-all">
              Try Again
            </a>
          </div>
        )}
      </div>

      {/* How It Works — pre-generation only */}
      {isBrowsing && (
        <section id="how-it-works" className="bg-white border-y border-gray-100 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center reveal">
            <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-3">How It Works</h2>
            <p className="text-gray-500 mb-12 max-w-md mx-auto">Three simple steps to a portrait you&apos;ll treasure forever.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { title: "Upload a Photo", desc: "Pick any clear photo of your pet. We handle the rest.", icon: <svg className="w-7 h-7 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg> },
                { title: "Choose a Style", desc: "Watercolor, Oil, Renaissance, or Line Art — pick your favorite.", icon: <svg className="w-7 h-7 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg> },
                { title: "Download & Print", desc: "Get your full-res portrait instantly. Print or frame it.", icon: <svg className="w-7 h-7 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg> },
              ].map((item) => (
                <div key={item.title} className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-green/10 flex items-center justify-center">{item.icon}</div>
                  <div>
                    <h3 className="font-display text-lg text-brand-green mb-1">{item.title}</h3>
                    <p className="text-gray-500 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Styles — pre-generation only */}
      {isBrowsing && (
        <section id="styles" className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center reveal">
            <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-3">Choose Your Style</h2>
            <p className="text-gray-500 mb-10 max-w-md mx-auto">Four beautiful artistic styles, each one a masterpiece.</p>
            <div className="reveal-stagger grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: "Watercolor", tagline: "Soft & dreamy", src: "/examples/watercolor.png" },
                { name: "Oil Painting", tagline: "Rich & classic", src: "/examples/oil.png" },
                { name: "Renaissance", tagline: "Royal & regal", src: "/examples/renaissance.png" },
                { name: "Line Art", tagline: "Clean & modern", src: "/examples/lineart.png" },
              ].map((s) => (
                <div
                  key={s.name}
                  className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-sm ring-1 ring-gray-100 group"
                >
                  {/* Plain eager <img>, NOT next/image. These 4 thumbnails sit far below
                      the fold; next/image's default loading="lazy" frequently never fires on
                      iOS Safari for deep-below-fold images, leaving them blank (naturalWidth 0)
                      on phones while desktop loads fine. Eager <img> always fetches. Matches the
                      working StylePicker/selector pattern; sources are pre-optimized ~100KB so
                      the optimizer adds latency without saving bytes here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.src}
                    alt={`${s.name} pet portrait from photo — custom ${s.name.toLowerCase()} dog painting example`}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  {/* Bottom gradient for text legibility — heavier so labels pop */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/55 to-transparent" aria-hidden="true" />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-left text-white">
                    <p className="font-display font-bold text-xl sm:text-2xl leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">{s.name}</p>
                    <p className="text-sm mt-0.5 opacity-95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">{s.tagline}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => document.getElementById("create")?.scrollIntoView({ behavior: "smooth" })}
              className="mt-10 bg-brand-green text-white px-8 py-3.5 rounded-full font-display font-semibold hover:bg-brand-green/90 transition-all hover:shadow-lg"
            >
              Try It Free
            </button>
          </div>
        </section>
      )}

      {/* Comparison table — pre-generation only */}
      {isBrowsing && (
        <section className="bg-white border-t border-gray-100 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 reveal">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-3">Why Paw Masterpiece?</h2>
              <p className="text-gray-500 max-w-md mx-auto">See how we compare to traditional pet portrait services.</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-5 py-3.5 font-display text-gray-500 font-medium w-1/2">Feature</th>
                    <th className="px-5 py-3.5 font-display text-brand-green font-semibold text-center">Paw Masterpiece</th>
                    <th className="px-5 py-3.5 font-display text-gray-400 font-medium text-center">Others</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Instant delivery", true, false],
                    ["Preview before you pay", true, false],
                    ["Money-back guarantee", true, false],
                    ["Multiple art styles", true, false],
                    ["Framed print shipping", true, true],
                    ["Starting price", "$6", "$50+"],
                    ["Turnaround time", "30 seconds", "1–2 weeks"],
                  ].map(([feature, ours, theirs], i) => (
                    <tr key={i} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="px-5 py-3.5 text-gray-700 font-medium">{feature}</td>
                      <td className="px-5 py-3.5 text-center">
                        {typeof ours === "boolean" ? (
                          ours ? (
                            <svg className="w-5 h-5 text-brand-green mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )
                        ) : (
                          <span className="font-semibold text-brand-green">{ours}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {typeof theirs === "boolean" ? (
                          theirs ? (
                            <svg className="w-5 h-5 text-brand-green mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )
                        ) : (
                          <span className="text-gray-500">{theirs}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500 mb-3">Comparing specific competitors?</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  href="/vs/crown-and-paw"
                  className="text-sm text-brand-green hover:bg-brand-green/5 px-4 py-2 rounded-full border border-brand-green/20 transition-colors"
                >
                  vs Crown &amp; Paw
                </Link>
                <Link
                  href="/vs/west-and-willow"
                  className="text-sm text-brand-green hover:bg-brand-green/5 px-4 py-2 rounded-full border border-brand-green/20 transition-colors"
                >
                  vs West &amp; Willow
                </Link>
                <Link
                  href="/how-it-works"
                  className="text-sm text-brand-green hover:bg-brand-green/5 px-4 py-2 rounded-full border border-brand-green/20 transition-colors"
                >
                  How it works
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Photo gallery — pre-generation only */}
      {isBrowsing && (
        <section className="py-16 sm:py-20 bg-cream">
          <div className="max-w-4xl mx-auto px-4 reveal">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-3">Loved by Pet Parents Everywhere</h2>
              <p className="text-gray-500">Real portraits made with Paw Masterpiece.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { src: "/examples/watercolor.png", style: "Watercolor", name: "Luna" },
                { src: "/examples/oil.png", style: "Oil Painting", name: "Max" },
                { src: "/examples/renaissance.png", style: "Renaissance", name: "Bella" },
                { src: "/examples/lineart.png", style: "Line Art", name: "Charlie" },
              ].map((p) => (
                <div key={p.name} className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="relative aspect-square">
                    {/* Eager plain <img> — same iOS-Safari lazy-load fix as the style grid above. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.src}
                      alt={`${p.style} portrait of ${p.name}`}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-display text-sm font-semibold text-brand-green">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.style}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <button
                onClick={() => document.getElementById("create")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-brand-green text-white px-8 py-3.5 rounded-full font-display font-semibold hover:bg-brand-green/90 transition-all hover:shadow-lg"
              >
                Create Your Portrait
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Reviews — pre-generation only */}
      {isBrowsing && (
        <section id="reviews" className="bg-white border-t border-gray-100 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center reveal">
            <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-3">What Pet Parents Say</h2>
            <p className="text-gray-500 mb-12 max-w-md mx-auto">
              Thousands of happy customers and counting.{" "}
              <Link href="/reviews" className="text-brand-green font-semibold hover:underline">
                Read the Wall of Love →
              </Link>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {HOME_REVIEWS.map((r) => (
                <div key={r.name} className="bg-gray-50 rounded-2xl p-6 text-left">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(r.stars)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">&ldquo;{r.review}&rdquo;</p>
                  <p className="font-semibold text-sm text-gray-800">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.pet}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ — pre-generation only */}
      {isBrowsing && <FAQ />}

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <FooterNewsletter />
        <div className="max-w-6xl mx-auto px-4 py-10">
          {/* Sitemap nav — internal link equity to every important landing page.
              New URLs would otherwise only surface via sitemap.xml; putting them
              in the footer multiplies crawl priority and distributes PageRank. */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
            <div>
              <p className="font-display font-semibold text-brand-green mb-3">Gifts</p>
              <ul className="space-y-2">
                <li><Link href="/gifts/mothers-day" className="text-gray-500 hover:text-brand-green transition-colors">Mother&apos;s Day</Link></li>
                <li><Link href="/gifts/fathers-day" className="text-gray-500 hover:text-brand-green transition-colors">Father&apos;s Day</Link></li>
                <li><Link href="/gifts/christmas" className="text-gray-500 hover:text-brand-green transition-colors">Christmas</Link></li>
                <li><Link href="/gifts/birthday" className="text-gray-500 hover:text-brand-green transition-colors">Birthday</Link></li>
                <li><Link href="/gifts/dog-mom-gift" className="text-gray-500 hover:text-brand-green transition-colors">Dog Mom Gifts</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-display font-semibold text-brand-green mb-3">Styles</p>
              <ul className="space-y-2">
                <li><Link href="/styles/watercolor-pet-portrait" className="text-gray-500 hover:text-brand-green transition-colors">Watercolor</Link></li>
                <li><Link href="/styles/oil-painting-pet-portrait" className="text-gray-500 hover:text-brand-green transition-colors">Oil Painting</Link></li>
                <li><Link href="/styles/renaissance-pet-portrait" className="text-gray-500 hover:text-brand-green transition-colors">Renaissance</Link></li>
                <li><Link href="/styles/line-art-pet-portrait" className="text-gray-500 hover:text-brand-green transition-colors">Line Art</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-display font-semibold text-brand-green mb-3">Collections</p>
              <ul className="space-y-2">
                <li><Link href="/products" className="text-gray-500 hover:text-brand-green transition-colors">All Products</Link></li>
                <li><Link href="/pet-portraits/dogs" className="text-gray-500 hover:text-brand-green transition-colors">Dog Portraits</Link></li>
                <li><Link href="/pet-portraits/cats" className="text-gray-500 hover:text-brand-green transition-colors">Cat Portraits</Link></li>
                <li><Link href="/memorial" className="text-gray-500 hover:text-brand-green transition-colors">Memorial Portraits</Link></li>
                <li><Link href="/reviews" className="text-gray-500 hover:text-brand-green transition-colors">Wall of Love</Link></li>
                <li><Link href="/blog" className="text-gray-500 hover:text-brand-green transition-colors">Blog</Link></li>
                <li><Link href="/how-it-works" className="text-gray-500 hover:text-brand-green transition-colors">How It Works</Link></li>
                <li><Link href="/vs/crown-and-paw" className="text-gray-500 hover:text-brand-green transition-colors">vs Crown &amp; Paw</Link></li>
                <li><Link href="/vs/west-and-willow" className="text-gray-500 hover:text-brand-green transition-colors">vs West &amp; Willow</Link></li>
                <li><Link href="/free-photo-guide" className="text-gray-500 hover:text-brand-green transition-colors">Free Photo Guide</Link></li>
                <li><Link href="/free-wallpaper" className="text-gray-500 hover:text-brand-green transition-colors">Free Phone Wallpaper</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-display font-semibold text-brand-green mb-3">Account</p>
              <ul className="space-y-2">
                <li><Link href="/account/orders" className="text-gray-500 hover:text-brand-green transition-colors">My Orders</Link></li>
                <li><Link href="/account/refer" className="text-gray-500 hover:text-brand-green transition-colors">Refer &amp; Earn</Link></li>
                <li><Link href="/auth/signin" className="text-gray-500 hover:text-brand-green transition-colors">Sign In</Link></li>
                <li><a href="mailto:cosmic.company.llc@gmail.com" className="text-gray-500 hover:text-brand-green transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-10 pt-6 flex flex-col sm:flex-row items-center gap-3 sm:justify-between text-sm">
            <div className="flex items-center gap-2">
              <Image src="/logo.jpg" alt="Paw Masterpiece" width={24} height={24} className="opacity-60" />
              <span className="font-display text-gray-400">Paw Masterpiece</span>
              <span className="text-gray-300">&middot;</span>
              <span className="text-gray-400">Love it or we redo it free</span>
            </div>
            <p className="text-gray-400">
              <Link href="/privacy" className="hover:text-brand-green transition-colors">Privacy</Link>
              {" "}&middot;{" "}
              <Link href="/terms" className="hover:text-brand-green transition-colors">Terms</Link>
              {" "}&middot;{" "}
              <Link href="/returns" className="hover:text-brand-green transition-colors">Returns</Link>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

