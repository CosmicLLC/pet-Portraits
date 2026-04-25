"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import PhoneWallpaperPreview from "@/components/PhoneWallpaperPreview";
import UploadStep from "@/components/UploadStep";
import { track } from "@/lib/analytics";
import type { StyleKey } from "@/lib/gemini";

type Step = "email" | "style" | "upload" | "generating" | "done";

const STYLES: { key: StyleKey; name: string; tagline: string; image: string }[] = [
  { key: "watercolor", name: "Watercolor", tagline: "Soft & dreamy", image: "/examples/watercolor.png" },
  { key: "oil", name: "Oil Painting", tagline: "Rich & classic", image: "/examples/oil.png" },
  { key: "renaissance", name: "Renaissance", tagline: "Royal & regal", image: "/examples/renaissance.png" },
  { key: "lineart", name: "Line Art", tagline: "Clean & modern", image: "/examples/lineart.png" },
];

export default function WallpaperFlow() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [petName, setPetName] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSubmitting, setEmailSubmitting] = useState(false);

  const [style, setStyle] = useState<StyleKey | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSubmitting(true);
    try {
      const res = await fetch("/api/lead-magnet/wallpaper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, petName: petName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error || "Couldn't subscribe — try again.");
        setEmailSubmitting(false);
        return;
      }
      track({ name: "sign_up", source: "free_wallpaper_lead_magnet" });
      setStep("style");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Couldn't subscribe.");
      setEmailSubmitting(false);
    }
  };

  const handleStyle = useCallback((s: StyleKey) => {
    setStyle(s);
    setStep("upload");
  }, []);

  const handleFile = useCallback(
    async (f: File) => {
      if (!style) return;
      setStep("generating");
      setGenerating(true);
      setGenError(null);
      track({ name: "portrait_generation_start", style });
      try {
        const formData = new FormData();
        formData.append("image", f);
        formData.append("style", style);
        const res = await fetch("/api/generate", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generation failed");
        setWatermarkedImage(data.watermarkedImage);
        track({ name: "portrait_generated", style, imageId: data.imageId });
        setStep("done");
      } catch (err) {
        setGenError(err instanceof Error ? err.message : "Generation failed");
        setStep("upload");
      } finally {
        setGenerating(false);
      }
    },
    [style],
  );

  const downloadWallpaper = useCallback(() => {
    if (!watermarkedImage) return;
    const a = document.createElement("a");
    a.href = watermarkedImage;
    a.download = `pet-wallpaper-${petName || "preview"}.png`;
    a.click();
  }, [watermarkedImage, petName]);

  // ── Email gate ───────────────────────────────────────────────────
  if (step === "email") {
    return (
      <form
        onSubmit={submitEmail}
        className="max-w-md mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm p-7 space-y-4"
      >
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@email.com"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Pet&apos;s name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="Charlie"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
          />
        </div>
        {emailError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {emailError}
          </p>
        )}
        <button
          type="submit"
          disabled={emailSubmitting}
          className="w-full bg-brand-green text-cream py-3.5 rounded-xl font-display font-semibold hover:bg-brand-green/90 transition-all disabled:opacity-60"
        >
          {emailSubmitting ? "Saving…" : "Make My Wallpaper"}
        </button>
        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
          We send occasional notes about new styles + seasonal launches. Unsubscribe anytime.
        </p>
      </form>
    );
  }

  // ── Style picker ─────────────────────────────────────────────────
  if (step === "style") {
    return (
      <div>
        <p className="text-center text-sm text-gray-600 mb-6">
          {petName ? `Pick a style for ${petName}` : "Pick a style for your pet"}.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {STYLES.map((s) => (
            <button
              key={s.key}
              onClick={() => handleStyle(s.key)}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] shadow-sm ring-1 ring-gray-100 hover:ring-brand-green hover:ring-2 transition-all"
            >
              <Image
                src={s.image}
                alt={`${s.name} pet portrait example`}
                fill
                sizes="(max-width: 640px) 45vw, 22vw"
                className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
              />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 text-white text-left">
                <p className="font-display font-bold text-base sm:text-lg leading-tight">{s.name}</p>
                <p className="text-[11px] sm:text-xs opacity-90">{s.tagline}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Upload step ──────────────────────────────────────────────────
  if (step === "upload") {
    return (
      <div className="max-w-md mx-auto">
        <p className="text-center text-sm text-gray-600 mb-6">
          Upload {petName ? `${petName}'s` : "your pet's"} photo to render in{" "}
          <strong className="text-brand-green">{STYLES.find((s) => s.key === style)?.name}</strong>.
        </p>
        <UploadStep onFileSelected={handleFile} />
        {genError && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-center">
            {genError}
          </p>
        )}
      </div>
    );
  }

  // ── Generating ───────────────────────────────────────────────────
  if (step === "generating" || generating) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm p-10 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-brand-green flex items-center justify-center animate-pulse">
          <svg className="w-6 h-6 text-cream animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h3 className="font-display text-xl text-brand-green mb-2">Painting {petName || "your pet"}…</h3>
        <p className="text-sm text-gray-500">About 30 seconds. Don&apos;t close this tab.</p>
      </div>
    );
  }

  // ── Done ─────────────────────────────────────────────────────────
  if (step === "done" && watermarkedImage) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-2">
          Your wallpaper is ready
        </p>
        <h2 className="font-display text-3xl text-brand-green mb-6">
          Long-press → Set as Wallpaper.
        </h2>

        <div className="flex justify-center mb-8">
          <PhoneWallpaperPreview imageUrl={watermarkedImage} size="lg" />
        </div>

        <button
          onClick={downloadWallpaper}
          className="bg-brand-green text-cream px-8 py-3.5 rounded-full font-display font-semibold hover:bg-brand-green/90 transition-all mb-3"
        >
          Download Wallpaper
        </button>
        <p className="text-xs text-gray-400 mb-8">PNG · with watermark · iPhone-optimized</p>

        <div className="bg-brand-green/5 border border-brand-green/15 rounded-2xl p-6 text-left">
          <p className="text-[11px] font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-2">
            Want it on your wall too?
          </p>
          <h3 className="font-display text-xl text-brand-green mb-2">
            Get the framed canvas — and the unwatermarked digital file.
          </h3>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Your wallpaper is yours to keep, free, watermarked. The full-resolution file (no watermark) and the gallery-quality framed canvas ship together as the Complete Bundle. Through May 10, every order also includes a <strong>FREE 11×14 display print</strong>.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/"
              className="bg-brand-green text-cream px-5 py-2.5 rounded-full text-sm font-display font-semibold hover:bg-brand-green/90 transition-colors"
            >
              See Canvas Options
            </a>
            <a
              href="/gifts/mothers-day"
              className="bg-white border border-brand-green text-brand-green px-5 py-2.5 rounded-full text-sm font-display font-semibold hover:bg-brand-green hover:text-cream transition-colors"
            >
              Mother&apos;s Day Gifts
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
