"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import UploadStep from "@/components/UploadStep";
import PortraitPreview from "@/components/PortraitPreview";
import ProductSelector from "@/components/ProductSelector";
import PostGenerationEmailCapture from "@/components/PostGenerationEmailCapture";
import AddToCartButton from "@/components/AddToCartButton";
import { track } from "@/lib/analytics";
import { fetchJson } from "@/lib/fetch-json";

// Inlined here (instead of importing from lib/gemini) because the gemini
// module pulls in node:fs/path which can't run in a Client Component.
type StyleKey = "watercolor" | "oil" | "renaissance" | "lineart";
const STYLE_KEYS: StyleKey[] = ["watercolor", "oil", "renaissance", "lineart"];

// Streamlined version of the home page wizard. Everything fits in one
// viewport: 4-style chip picker, upload zone, generate button. After
// generation, the preview + product selector takes over the screen
// (same components as the main flow — only the entry experience differs).

type Step = "pre" | "loading" | "preview";

const STYLE_LABELS: Record<StyleKey, { label: string; image: string; emoji: string }> = {
  watercolor: { label: "Watercolor", image: "/examples/watercolor.png", emoji: "🎨" },
  oil: { label: "Oil Painting", image: "/examples/oil.png", emoji: "🖼️" },
  renaissance: { label: "Renaissance", image: "/examples/renaissance.png", emoji: "👑" },
  lineart: { label: "Line Art", image: "/examples/lineart.png", emoji: "✒️" },
};

export default function QuickStudio() {
  const [step, setStep] = useState<Step>("pre");
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState<StyleKey | null>(null);
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const generateBtnRef = useRef<HTMLButtonElement | null>(null);

  // Read ?style= from URL once mounted, pre-select if valid
  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const requestedStyle = params.get("style") as StyleKey | null;
    if (requestedStyle && STYLE_KEYS.includes(requestedStyle)) {
      setStyle(requestedStyle);
    }
  }, []);

  const handleFileSelected = useCallback((f: File) => {
    setFile(f);
    setError(null);
    // After upload, scroll the generate button into view so it's the next
    // thing the user sees. The viewport is small on mobile and the button
    // can slide below the fold once the preview thumbnail loads.
    setTimeout(() => {
      generateBtnRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  }, []);

  const handleStyleClick = useCallback((s: StyleKey) => {
    setStyle(s);
    setError(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!file || !style) return;
    setStep("loading");
    setError(null);
    track({ name: "portrait_generation_start", style });
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("style", style);
      const data = await fetchJson<{ watermarkedImage: string; imageId: string }>(
        "/api/generate",
        { method: "POST", body: formData }
      );
      setWatermarkedImage(data.watermarkedImage);
      setImageId(data.imageId);
      setStep("preview");
      track({ name: "portrait_generated", style, imageId: data.imageId });
    } catch (err) {
      // fetchJson throws FetchJsonError with isUserFriendly messages
      // for Vercel HTML error pages + timeouts + rate limits, so we
      // can show the .message verbatim instead of the cryptic raw
      // browser error ("Unexpected token A, An error o...").
      setError(
        err instanceof Error
          ? err.message
          : "Generation failed — please try again with a clearer photo."
      );
      setStep("pre");
    }
  }, [file, style]);

  // ─── Preview step — once generated, show preview + product picker ───────
  if (step === "preview" && watermarkedImage && imageId && style) {
    return (
      <main className="min-h-screen bg-cream">
        <PostGenerationEmailCapture trigger imageType="portrait" />
        <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.jpg" alt="Paw Masterpiece" width={32} height={32} className="rounded-lg" />
              <span className="font-display text-base text-brand-green font-semibold">Paw Masterpiece</span>
            </Link>
            <button
              onClick={() => { setStep("pre"); setFile(null); setWatermarkedImage(null); setImageId(null); }}
              className="text-xs text-gray-500 hover:text-brand-green transition-colors"
            >
              Start over
            </button>
          </div>
        </header>
        <section className="py-6 sm:py-10">
          <div className="max-w-2xl mx-auto px-4">
            <PortraitPreview watermarkedImage={watermarkedImage} />
            <div className="mt-6">
              <ProductSelector imageId={imageId} onError={setError} wallpaperSelected={false} />
            </div>
            <div className="mt-4 bg-white border border-gray-200 rounded-xl px-4 py-4">
              <AddToCartButton imageId={imageId} preview={watermarkedImage ?? undefined} />
              <p className="text-[11px] text-gray-400 text-center mt-2">
                Want portraits of more pets, or gifts? Add to cart and check out together.
              </p>
            </div>
            {error && (
              <p className="text-red-500 text-sm text-center mt-4">{error}</p>
            )}
          </div>
        </section>
      </main>
    );
  }

  // ─── Pre + loading step — single viewport, no scroll required ───────────
  const canGenerate = !!file && !!style && step === "pre";

  return (
    <main className="min-h-screen bg-cream flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.jpg" alt="Paw Masterpiece" width={32} height={32} className="rounded-lg" />
            <span className="font-display text-base text-brand-green font-semibold">Paw Masterpiece</span>
          </Link>
          <p className="text-xs text-gray-500 hidden sm:block">
            ★ 4.9 · 487 reviews · Preview free
          </p>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center py-6">
        <div className="max-w-2xl w-full mx-auto px-4">
          {/* Compact intro — single line, no fluff */}
          <div className="text-center mb-5">
            <h1 className="font-display text-2xl sm:text-3xl text-brand-green leading-tight mb-1">
              {style
                ? `Your pet as ${/^[aeiou]/i.test(STYLE_LABELS[style].label) ? "an" : "a"} ${STYLE_LABELS[style].label.toLowerCase()} portrait`
                : "Your pet, as a custom portrait"}
            </h1>
            <p className="text-sm text-gray-500">
              Free preview in about 30 seconds · No signup
            </p>
          </div>

          {/* Step 1 — Upload */}
          <div className="mb-4">
            <p className="text-[11px] font-display font-semibold uppercase tracking-wider text-brand-gold mb-2">
              1. Upload your pet's photo
            </p>
            <UploadStep onFileSelected={handleFileSelected} />
          </div>

          {/* Step 2 — Style picker (compact chips, not full cards) */}
          <div className="mb-5">
            <p className="text-[11px] font-display font-semibold uppercase tracking-wider text-brand-gold mb-2">
              2. Pick a style
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(STYLE_LABELS) as StyleKey[]).map((key) => {
                const meta = STYLE_LABELS[key];
                const selected = style === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleStyleClick(key)}
                    type="button"
                    className={`relative aspect-[4/5] rounded-xl overflow-hidden ring-2 transition-all ${
                      selected
                        ? "ring-brand-green ring-offset-2 scale-[1.02] shadow-lg"
                        : "ring-transparent hover:ring-gray-300"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={meta.image}
                      alt={`${meta.label} style example`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
                    <div className="absolute bottom-0 inset-x-0 p-2 text-white">
                      <p className="font-display text-xs font-bold leading-tight">{meta.emoji} {meta.label}</p>
                    </div>
                    {selected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-green flex items-center justify-center">
                        <svg className="w-3 h-3 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3 — Generate */}
          <button
            ref={generateBtnRef}
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`w-full py-4 rounded-full text-base font-display font-semibold transition-all ${
              canGenerate
                ? "bg-brand-green text-cream hover:bg-brand-green/90 shadow-lg hover:-translate-y-0.5"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {step === "loading"
              ? "Generating your portrait…"
              : !file
              ? "3. Upload a photo to start"
              : !style
              ? "3. Pick a style"
              : `3. Generate ${STYLE_LABELS[style].label} portrait — free`}
          </button>

          {error && (
            <p className="text-red-500 text-sm text-center mt-3">{error}</p>
          )}

          <p className="text-[11px] text-gray-400 text-center mt-3">
            Free to preview. Pay $6 for the digital download or $79 for a framed canvas if you love it.
          </p>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-100 py-3">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
          <span>★ 4.9 of 5</span>
          <span>·</span>
          <span>487 reviews</span>
          <span>·</span>
          <span>Loved by 40,000+ pet parents</span>
          <span>·</span>
          <span>Ships 3-5 days inside US</span>
          <span>·</span>
          <Link href="/memorial" className="hover:text-brand-green">Memorial portraits</Link>
          <span>·</span>
          <Link href="/how-it-works" className="hover:text-brand-green">How it works</Link>
        </div>
      </footer>

      {/* Reserve mounted state to avoid hydration warnings */}
      {!mounted ? null : null}
    </main>
  );
}
