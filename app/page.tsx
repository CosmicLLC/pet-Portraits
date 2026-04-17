"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import UploadStep from "@/components/UploadStep";
import StylePicker from "@/components/StylePicker";
import GenerateButton from "@/components/GenerateButton";
import PortraitPreview from "@/components/PortraitPreview";
import ProductSelector from "@/components/ProductSelector";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import FooterNewsletter from "@/components/FooterNewsletter";
import BrowseAbandonmentCapture from "@/components/BrowseAbandonmentCapture";
import SocialProofToast from "@/components/SocialProofToast";
import StickyCartBar from "@/components/StickyCartBar";
import FAQ from "@/components/FAQ";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import PhoneWallpaperPreview from "@/components/PhoneWallpaperPreview";
import type { StyleKey } from "@/lib/gemini";

const ANNOUNCEMENTS = [
  "Custom Paw Masterpiece — Ready in Seconds, Not Days",
  "100% Satisfaction Guarantee — Love it or we redo it free",
  "Free Digital Download with Every Canvas Order",
];

type Step = "upload" | "style" | "generate" | "preview";

const STEPS: Step[] = ["upload", "style", "generate", "preview"];
const STEP_LABELS = ["Upload", "Style", "Generate", "Preview"];

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState<StyleKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAbandonmentCapture, setShowAbandonmentCapture] = useState(false);
  const [portraitEmailCaptured, setPortraitEmailCaptured] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [wallpaperSelected, setWallpaperSelected] = useState(false);
  const { data: session } = useSession();

  // Countdown timer for preview step
  const [countdown, setCountdown] = useState(30 * 60);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Announcement bar rotation
  const [annIdx, setAnnIdx] = useState(0);
  const [annVisible, setAnnVisible] = useState(true);

  // Real-time visitor count (12–34, fluctuates every 30s) — set after mount to avoid hydration mismatch
  const [visitorCount, setVisitorCount] = useState(0);

  // Success page upsell state
  const [upsellLoading, setUpsellLoading] = useState(false);
  const [upsellDone, setUpsellDone] = useState(false);
  const [copied, setCopied] = useState(false);

  // Read URL params only after mount to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const urlParams = mounted ? new URLSearchParams(window.location.search) : null;
  const isSuccess = urlParams?.get("success") === "true";
  const isCanceled = urlParams?.get("canceled") === "true";
  const successImageId = urlParams?.get("imageId") ?? null;

  // Countdown: start/reset when entering preview step
  useEffect(() => {
    if (step !== "preview") {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }
    setCountdown(30 * 60);
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

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (!avatarOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-avatar-menu]")) setAvatarOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [avatarOpen]);

  // Announcement bar rotation: fade out → swap → fade in every 5s
  useEffect(() => {
    const id = setInterval(() => {
      setAnnVisible(false);
      setTimeout(() => {
        setAnnIdx((i) => (i + 1) % ANNOUNCEMENTS.length);
        setAnnVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Visitor count — init after mount, fluctuate every 30s
  useEffect(() => {
    setVisitorCount(Math.floor(Math.random() * 23) + 12);
    const id = setInterval(() => {
      setVisitorCount((n) => Math.min(34, Math.max(12, n + Math.floor(Math.random() * 5) - 2)));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const resetState = useCallback(() => {
    setStep("upload");
    setFile(null);
    setStyle(null);
    setWatermarkedImage(null);
    setImageId(null);
    setError(null);
    setShowAbandonmentCapture(false);
    setPortraitEmailCaptured(false);
    setMobileMenuOpen(false);
    setAvatarOpen(false);
    setWallpaperSelected(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToSection = useCallback((id: string) => {
    setMobileMenuOpen(false);
    const doScroll = () => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    };
    if (step !== "upload") {
      setStep("upload");
      setError(null);
      setTimeout(doScroll, 100);
    } else {
      doScroll();
    }
  }, [step]);

  const handleBack = useCallback(() => {
    setError(null);
    if (step === "style") setStep("upload");
    else if (step === "generate") setStep("style");
    else if (step === "preview") setStep("generate");
  }, [step]);

  const handleStepClick = useCallback((targetStep: Step) => {
    const currentIndex = STEPS.indexOf(step);
    const targetIndex = STEPS.indexOf(targetStep);
    if (targetIndex < currentIndex) {
      setError(null);
      setStep(targetStep);
    }
  }, [step]);

  const handleFileSelected = useCallback((f: File) => {
    setFile(f);
    setStep("style");
    setError(null);
  }, []);

  const handleStyleSelect = useCallback((s: StyleKey) => {
    setStyle(s);
    setStep("generate");
    setError(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!file || !style) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("style", style);
      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWatermarkedImage(data.watermarkedImage);
      setImageId(data.imageId);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed — please try again or use a clearer photo.");
    } finally {
      setLoading(false);
    }
  }, [file, style]);

  const handleUpsell = useCallback(async () => {
    if (!successImageId) return;
    setUpsellLoading(true);
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

  const handleCopyLink = useCallback(() => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, []);

  const navLinks = [
    { label: "How It Works", id: "how-it-works" },
    { label: "Styles", id: "styles" },
    { label: "Reviews", id: "reviews" },
  ];

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://pet-portraits-five.vercel.app";
  const shareText = "I just got a stunning AI portrait of my pet! Check it out:";

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

          {/* Post-purchase upsell — Canvas Print at 25% off */}
          {successImageId && !upsellDone && (
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
                    Add a Canvas Print — 25% Off
                  </h2>
                  <p className="text-sm text-gray-500 mb-3">
                    Gallery-quality 8×10 canvas print shipped to your door. Normally $79 — yours right now for just{" "}
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

          {/* Referral / Share section */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 mb-8 animate-fade-in-up">
            <h2 className="font-display text-xl text-brand-green mb-1 text-center">Share with Friends</h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              Know a pet parent who&apos;d love this? Share the love.
            </p>
            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3 hover:border-brand-green/40 transition-colors group"
            >
              <span className="text-sm text-gray-600 truncate">{shareUrl}</span>
              <span className={`text-xs font-semibold flex-shrink-0 ${copied ? "text-brand-green" : "text-gray-400 group-hover:text-brand-green"} transition-colors`}>
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>
            {/* Social share row */}
            <div className="grid grid-cols-3 gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#1DA1F2] hover:text-[#1DA1F2] transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X / Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#1877F2] hover:text-[#1877F2] transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#25D366] hover:text-[#25D366] transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.852L.057 23.9l6.234-1.637A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm.029 21.818a9.9 9.9 0 01-5.052-1.38l-.362-.215-3.753.984 1.003-3.664-.235-.374A9.86 9.86 0 012.182 12c0-5.424 4.424-9.836 9.847-9.836 5.424 0 9.836 4.412 9.836 9.836 0 5.423-4.412 9.818-9.836 9.818z" />
                </svg>
                WhatsApp
              </a>
            </div>
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
  return (
    <main className="min-h-screen bg-cream">
      {step === "upload" && <ExitIntentPopup />}
      {step === "upload" && <SocialProofToast />}

      {/* Rotating top banner */}
      <div className="bg-brand-green text-white text-center py-2.5 text-sm font-medium tracking-wide overflow-hidden">
        <span
          className="inline-block transition-opacity duration-400"
          style={{ opacity: annVisible ? 1 : 0 }}
        >
          {ANNOUNCEMENTS[annIdx]}
        </span>
      </div>

      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={resetState}
            className="font-display text-2xl text-brand-green tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Paw Masterpiece — go to home"
          >
            Paw Masterpiece
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-sm text-gray-600 hover:text-brand-green transition-colors font-medium"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={resetState}
              className="bg-brand-green text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-brand-green/90 transition-all hover:shadow-md"
            >
              Create Portrait
            </button>

            {/* Auth — desktop */}
            {session ? (
              <div className="relative" data-avatar-menu>
                <button
                  onClick={() => setAvatarOpen((o) => !o)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-gray-200 hover:border-brand-green/40 transition-all"
                  aria-label="Account menu"
                >
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name ?? "Avatar"}
                      width={30}
                      height={30}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="w-[30px] h-[30px] rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green text-xs font-bold">
                      {(session.user?.name ?? session.user?.email ?? "U")[0].toUpperCase()}
                    </span>
                  )}
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {avatarOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 py-1.5 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800 truncate">{session.user?.name ?? "My Account"}</p>
                      <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                    </div>
                    {(session.user as { role?: string })?.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-green hover:bg-brand-green/5 transition-colors font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => { setAvatarOpen(false); signOut({ callbackUrl: "/" }); }}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="text-sm text-gray-600 hover:text-brand-green transition-colors font-medium"
              >
                Sign In
              </Link>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-brand-green hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="w-full text-left py-2.5 px-3 rounded-lg text-sm text-gray-700 hover:text-brand-green hover:bg-gray-50 transition-colors font-medium"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={resetState}
              className="mt-1 w-full bg-brand-green text-white py-2.5 px-3 rounded-lg text-sm font-semibold hover:bg-brand-green/90 transition-all text-center"
            >
              Create Portrait
            </button>

            {/* Auth — mobile */}
            <div className="mt-1 border-t border-gray-100 pt-2">
              {session ? (
                <>
                  <div className="px-3 py-2 text-xs text-gray-400 truncate">{session.user?.email}</div>
                  {(session.user as { role?: string })?.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-left py-2.5 px-3 rounded-lg text-sm text-brand-green hover:bg-brand-green/5 transition-colors font-medium"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                    className="w-full text-left py-2.5 px-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left py-2.5 px-3 rounded-lg text-sm text-gray-700 hover:text-brand-green hover:bg-gray-50 transition-colors font-medium"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero — upload step only */}
      {step === "upload" && (
        <section id="create" className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-sm text-gray-500 ml-2">Loved by pet parents</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-brand-green mb-5 leading-tight">
              Turn Your Pet Into<br />a Work of Art
            </h2>
            <p className="text-gray-500 text-lg sm:text-xl max-w-xl mx-auto mb-8">
              Upload a photo, choose a style, and get a stunning portrait in under a minute. The perfect gift for any pet lover.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
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

            {/* Real-time visitor count */}
            {visitorCount > 0 && (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                <span>
                  <strong className="text-gray-700">{visitorCount}</strong> people viewing portraits right now
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Money-back guarantee banner — upload step only */}
      {step === "upload" && (
        <div className="bg-brand-green/5 border-b border-brand-green/10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center gap-3 text-center">
            <svg className="w-5 h-5 text-brand-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-sm text-brand-green font-medium">
              <strong>100% Satisfaction Guarantee</strong> — Love your portrait or we&apos;ll redo it for free. No questions asked.
            </p>
          </div>
        </div>
      )}

      {/* Main wizard */}
      <div className={`max-w-2xl mx-auto px-4 py-12 sm:py-16 ${step === "preview" ? "pb-24" : ""}`}>
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
          {step === "upload" && (
            <UploadStep onFileSelected={handleFileSelected} />
          )}

          {step === "style" && (
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
              <StylePicker selected={style} onSelect={handleStyleSelect} />
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
                    {style === "oil" ? "Oil Painting" : style === "lineart" ? "Pencil / Line Art" : style === "renaissance" ? "Renaissance" : "Watercolor"}{" "}style
                  </p>
                </div>
              </div>
              <GenerateButton disabled={!file || !style} loading={loading} onClick={handleGenerate} />
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
              <PortraitPreview watermarkedImage={watermarkedImage} />

              {/* ─── Phone Wallpaper Upsell ─────────────────────────── */}
              <button
                type="button"
                onClick={() => setWallpaperSelected((s) => !s)}
                className={`mt-6 w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                  wallpaperSelected
                    ? "border-brand-green bg-brand-green/5 shadow-sm"
                    : "border-gray-200 bg-white hover:border-brand-green/40"
                }`}
              >
                {/* Phone mockup */}
                <div className="flex-shrink-0">
                  <PhoneWallpaperPreview imageUrl={watermarkedImage} size="sm" />
                </div>

                {/* Copy */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-display text-sm font-semibold text-brand-green leading-tight">
                      Add Phone Wallpaper
                    </p>
                    <span className="text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full flex-shrink-0">
                      $1.99
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-snug">
                    1290×2796 px · iPhone-optimised · instant download
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Your portrait, sized for your lock screen.
                  </p>
                </div>

                {/* Checkbox indicator */}
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    wallpaperSelected
                      ? "border-brand-green bg-brand-green"
                      : "border-gray-300"
                  }`}
                >
                  {wallpaperSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>

              <ProductSelector imageId={imageId} onError={setError} wallpaperSelected={wallpaperSelected} />

              {/* Quantity discount nudge */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-brand-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
                </svg>
                <span>
                  Ordering for a friend too?{" "}
                  <button
                    onClick={resetState}
                    className="text-brand-green font-semibold hover:underline"
                  >
                    Order 2+ portraits and save 15%
                  </button>
                </span>
              </div>

              {showAbandonmentCapture && !portraitEmailCaptured && (
                <BrowseAbandonmentCapture
                  imageId={imageId}
                  onCaptured={() => setPortraitEmailCaptured(true)}
                />
              )}

              {/* Sticky buy bar */}
              <StickyCartBar
                watermarkedImage={watermarkedImage}
                imageId={imageId}
                onError={setError}
                wallpaperSelected={wallpaperSelected}
              />
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

      {/* How It Works — upload step only */}
      {step === "upload" && (
        <section id="how-it-works" className="bg-white border-y border-gray-100 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
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

      {/* Styles — upload step only */}
      {step === "upload" && (
        <section id="styles" className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-3">Choose Your Style</h2>
            <p className="text-gray-500 mb-10 max-w-md mx-auto">Four beautiful artistic styles, each one a masterpiece.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: "Watercolor", tagline: "Soft & dreamy", gradient: "from-sky-200 via-pink-100 to-violet-200", emoji: "🎨" },
                { name: "Oil Painting", tagline: "Rich & classic", gradient: "from-amber-800 via-orange-700 to-yellow-800", emoji: "🖼️" },
                { name: "Renaissance", tagline: "Royal & regal", gradient: "from-red-900 via-amber-800 to-yellow-700", emoji: "👑" },
                { name: "Line Art", tagline: "Clean & modern", gradient: "from-gray-300 via-gray-200 to-gray-300", emoji: "✏️" },
              ].map((s) => (
                <div key={s.name} className={`rounded-2xl bg-gradient-to-br ${s.gradient} p-6 flex flex-col items-center gap-2 text-white`}>
                  <span className="text-3xl">{s.emoji}</span>
                  <p className="font-display font-semibold text-sm drop-shadow">{s.name}</p>
                  <p className="text-xs opacity-80">{s.tagline}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => scrollToSection("create")}
              className="mt-10 bg-brand-green text-white px-8 py-3.5 rounded-full font-display font-semibold hover:bg-brand-green/90 transition-all hover:shadow-lg"
            >
              Try It Free
            </button>
          </div>
        </section>
      )}

      {/* Comparison table — upload step only */}
      {step === "upload" && (
        <section className="bg-white border-t border-gray-100 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4">
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
                    ["Canvas print shipping", true, true],
                    ["Starting price", "$19", "$50+"],
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
          </div>
        </section>
      )}

      {/* Photo gallery — upload step only */}
      {step === "upload" && (
        <section className="py-16 sm:py-20 bg-cream">
          <div className="max-w-4xl mx-auto px-4">
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
                    <Image
                      src={p.src}
                      alt={`${p.style} portrait of ${p.name}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 45vw, 220px"
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
                onClick={() => scrollToSection("create")}
                className="bg-brand-green text-white px-8 py-3.5 rounded-full font-display font-semibold hover:bg-brand-green/90 transition-all hover:shadow-lg"
              >
                Create Your Portrait
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Reviews — upload step only */}
      {step === "upload" && (
        <section id="reviews" className="bg-white border-t border-gray-100 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-3">What Pet Parents Say</h2>
            <p className="text-gray-500 mb-12 max-w-md mx-auto">Thousands of happy customers and counting.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { name: "Sarah M.", review: "I cried when I saw my dog Charlie as an oil painting. It\u2019s now framed above my fireplace. Absolutely stunning.", stars: 5, pet: "Golden Retriever mom" },
                { name: "James T.", review: "Ordered the watercolor style for my cat\u2019s birthday (yes, I\u2019m that person). It was ready in 30 seconds and looks incredible.", stars: 5, pet: "Cat dad" },
                { name: "Priya K.", review: "Used this as a holiday gift for my sister. She called me crying. Best gift idea ever. The line art was chef\u2019s kiss.", stars: 5, pet: "Gift giver" },
              ].map((r) => (
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

      {/* FAQ — upload step only */}
      {step === "upload" && <FAQ />}

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <FooterNewsletter />
        <div className="max-w-6xl mx-auto px-4 py-6 text-center space-y-2">
          <p className="text-sm text-gray-400">
            Each portrait is uniquely generated &middot; Not satisfied? We&apos;ll redo it for free.
          </p>
          <p className="text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-brand-green transition-colors">Privacy Policy</Link>
            {" "}&middot;{" "}
            <Link href="/terms" className="hover:text-brand-green transition-colors">Terms of Service</Link>
            {" "}&middot;{" "}
            <a href="mailto:cosmic.company.llc@gmail.com" className="hover:text-brand-green transition-colors">cosmic.company.llc@gmail.com</a>
          </p>
        </div>
      </footer>
    </main>
  );
}

