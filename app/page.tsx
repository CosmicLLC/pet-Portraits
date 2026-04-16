"use client";

import { useState, useCallback, useEffect } from "react";
import UploadStep from "@/components/UploadStep";
import StylePicker from "@/components/StylePicker";
import GenerateButton from "@/components/GenerateButton";
import PortraitPreview from "@/components/PortraitPreview";
import ProductSelector from "@/components/ProductSelector";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import FooterNewsletter from "@/components/FooterNewsletter";
import BrowseAbandonmentCapture from "@/components/BrowseAbandonmentCapture";
import Link from "next/link";
import type { StyleKey } from "@/lib/gemini";

type Step = "upload" | "style" | "generate" | "preview";

const STEPS: Step[] = ["upload", "style", "generate", "preview"];
const STEP_LABELS = ["Upload", "Style", "Generate", "Preview"];

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

  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const isSuccess = params?.get("success") === "true";
  const isCanceled = params?.get("canceled") === "true";

  // Show browse-abandonment capture 30s after portrait is ready
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToSection = useCallback((id: string) => {
    setMobileMenuOpen(false);
    const doScroll = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
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

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setWatermarkedImage(data.watermarkedImage);
      setImageId(data.imageId);
      setStep("preview");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Generation failed — please try again or use a clearer photo."
      );
    } finally {
      setLoading(false);
    }
  }, [file, style]);

  const navLinks = [
    { label: "How It Works", id: "how-it-works" },
    { label: "Styles", id: "styles" },
    { label: "Reviews", id: "reviews" },
  ];

  // Success page
  if (isSuccess) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-cream">
        <div className="max-w-md w-full text-center animate-fade-in-up">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-brand-green flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-4xl text-brand-green mb-4">Thank you!</h1>
          <p className="text-gray-600 mb-2 text-lg">Your portrait is on its way.</p>
          <p className="text-gray-500 mb-10 text-sm">Check your email for the full-resolution download link.</p>
          <a
            href="/"
            className="inline-block bg-brand-green text-white px-10 py-4 rounded-full font-display font-semibold hover:bg-brand-green/90 transition-all hover:shadow-lg"
          >
            Create Another Portrait
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Exit-intent popup — only on the landing/upload step */}
      {step === "upload" && <ExitIntentPopup />}

      {/* Top banner */}
      <div className="bg-brand-green text-white text-center py-2.5 text-sm font-medium tracking-wide">
        Custom Pet Portraits — Ready in Seconds, Not Days
      </div>

      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo — resets wizard to upload */}
          <button
            onClick={resetState}
            className="font-display text-2xl text-brand-green tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Pet Portraits — go to home"
          >
            Pet Portraits
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

        {/* Mobile menu dropdown */}
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
          </div>
        )}
      </header>

      {/* Hero section — only show on upload step */}
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
          </div>
        </section>
      )}

      {/* Main content area */}
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        {/* Progress steps — clickable for completed steps */}
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
                  <p className="font-display text-lg font-semibold text-brand-green">
                    Ready to create
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {style === "oil"
                      ? "Oil Painting"
                      : style === "lineart"
                        ? "Pencil / Line Art"
                        : style === "renaissance"
                          ? "Renaissance"
                          : "Watercolor"}{" "}
                    style
                  </p>
                </div>
              </div>

              <GenerateButton
                disabled={!file || !style}
                loading={loading}
                onClick={handleGenerate}
              />
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
              <ProductSelector imageId={imageId} onError={setError} />
              {showAbandonmentCapture && !portraitEmailCaptured && (
                <BrowseAbandonmentCapture
                  imageId={imageId}
                  onCaptured={() => setPortraitEmailCaptured(true)}
                />
              )}
            </div>
          )}
        </div>

        {/* Error display */}
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
            <p className="text-amber-700 text-sm mb-4">
              Your portrait is still saved. Ready to try again?
            </p>
            <a
              href="/"
              className="inline-block bg-brand-green text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-green/90 transition-all"
            >
              Try Again
            </a>
          </div>
        )}
      </div>

      {/* How It Works — only visible on landing */}
      {step === "upload" && (
        <section id="how-it-works" className="bg-white border-y border-gray-100 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-3">How It Works</h2>
            <p className="text-gray-500 mb-12 max-w-md mx-auto">Three simple steps to a portrait you&apos;ll treasure forever.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Upload a Photo",
                  desc: "Pick any clear photo of your pet. We handle the rest.",
                  icon: (
                    <svg className="w-7 h-7 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  ),
                },
                {
                  step: "2",
                  title: "Choose a Style",
                  desc: "Watercolor, Oil, Renaissance, or Line Art — pick your favorite.",
                  icon: (
                    <svg className="w-7 h-7 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                    </svg>
                  ),
                },
                {
                  step: "3",
                  title: "Download & Print",
                  desc: "Get your full-res portrait instantly. Print or frame it.",
                  icon: (
                    <svg className="w-7 h-7 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-green/10 flex items-center justify-center">
                    {item.icon}
                  </div>
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

      {/* Styles showcase — only visible on landing */}
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

      {/* Reviews — only visible on landing */}
      {step === "upload" && (
        <section id="reviews" className="bg-white border-t border-gray-100 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-3">What Pet Parents Say</h2>
            <p className="text-gray-500 mb-12 max-w-md mx-auto">Thousands of happy customers and counting.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  name: "Sarah M.",
                  review: "I cried when I saw my dog Charlie as an oil painting. It&apos;s now framed above my fireplace. Absolutely stunning.",
                  stars: 5,
                  pet: "Golden Retriever mom",
                },
                {
                  name: "James T.",
                  review: "Ordered the watercolor style for my cat&apos;s birthday (yes, I&apos;m that person). It was ready in 30 seconds and looks incredible.",
                  stars: 5,
                  pet: "Cat dad",
                },
                {
                  name: "Priya K.",
                  review: "Used this as a holiday gift for my sister. She called me crying. Best gift idea ever. The line art was chef&apos;s kiss.",
                  stars: 5,
                  pet: "Gift giver",
                },
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
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.pet}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
            <a href="mailto:cosmic.company.llc@gmail.com" className="hover:text-brand-green transition-colors">
              cosmic.company.llc@gmail.com
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
