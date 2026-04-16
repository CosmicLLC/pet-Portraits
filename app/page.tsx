"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import UploadStep from "@/components/UploadStep";
import StylePicker from "@/components/StylePicker";
import GenerateButton from "@/components/GenerateButton";
import PortraitPreview from "@/components/PortraitPreview";
import ProductSelector from "@/components/ProductSelector";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import FooterNewsletter from "@/components/FooterNewsletter";
import BrowseAbandonmentCapture from "@/components/BrowseAbandonmentCapture";
import type { StyleKey } from "@/lib/gemini";

type Step = "upload" | "style" | "generate" | "preview";

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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center">
          <Link href="/">
            <h1 className="font-display text-2xl text-brand-green tracking-tight cursor-pointer">
              Pet Portraits
            </h1>
          </Link>
        </div>
      </header>

      {/* Hero section — only show on upload step */}
      {step === "upload" && (
        <section className="bg-white border-b border-gray-100">
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
        {/* Progress steps */}
        <div className="flex items-center justify-center gap-3 mb-12">
          {(["upload", "style", "generate", "preview"] as Step[]).map((s, i) => {
            const stepIndex = ["upload", "style", "generate", "preview"].indexOf(step);
            const isActive = s === step;
            const isComplete = i < stepIndex;
            const labels = ["Upload", "Style", "Generate", "Preview"];
            return (
              <div key={s} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-brand-green text-white scale-110"
                        : isComplete
                          ? "bg-brand-green text-white"
                          : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {isComplete ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? "text-brand-green" : "text-gray-400"}`}>
                    {labels[i]}
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
            <StylePicker selected={style} onSelect={handleStyleSelect} />
          )}

          {step === "generate" && (
            <div className="w-full flex flex-col items-center gap-8">
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
