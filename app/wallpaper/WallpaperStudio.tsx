"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

interface PaletteColor {
  name: string;
  hex: string;
}

interface Props {
  palette: PaletteColor[];
}

type Status = "idle" | "generating" | "ready" | "checkout" | "error";

interface PreviewResult {
  imageId: string;
  bgHex: string;
  bgName: string;
  preview: string; // data URL with watermark
}

export default function WallpaperStudio({ palette }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [bgHex, setBgHex] = useState<string>(palette[0]?.hex || "#9DAF8E");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Detect post-Stripe return — Stripe sends them back to /wallpaper?success=true
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setPurchaseSuccess(true);
      track({ name: "purchase", value: 0.99, productType: "wallpaper" });
      // Clean the URL so refreshes don't re-fire the purchase event
      window.history.replaceState({}, "", "/wallpaper");
    }
  }, []);

  // Cleanup photo blob URL on unmount or replacement
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const onFile = useCallback((f: File | null) => {
    setError(null);
    setResult(null);
    if (!f) {
      setFile(null);
      setPhotoPreviewUrl((u) => {
        if (u) URL.revokeObjectURL(u);
        return null;
      });
      return;
    }
    if (!/^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(f.type)) {
      setError("Please upload a JPG, PNG, WebP, or HEIC photo.");
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setError("File is too large — please upload a photo under 15 MB.");
      return;
    }
    setFile(f);
    setPhotoPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }, []);

  const generate = useCallback(async () => {
    if (!file) return;
    setStatus("generating");
    setError(null);
    track({ name: "portrait_generation_start", style: "wallpaper" });
    try {
      const fd = new FormData();
      fd.append("photo", file);
      fd.append("bgHex", bgHex);
      const res = await fetch("/api/wallpaper-preview", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult({
        imageId: data.imageId,
        bgHex: data.bgHex,
        bgName: data.bgName,
        preview: data.preview,
      });
      track({ name: "portrait_generated", style: "wallpaper", imageId: data.imageId });
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Generation failed");
    }
  }, [file, bgHex]);

  const buy = useCallback(async () => {
    if (!result) return;
    setStatus("checkout");
    track({
      name: "begin_checkout",
      productType: "wallpaper",
      value: 0.99,
      imageId: result.imageId,
    });
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: "wallpaper",
          imageId: result.imageId,
          bgHex: result.bgHex,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      setStatus("ready");
      setError(err instanceof Error ? err.message : "Checkout failed");
    }
  }, [result]);

  const tryAnother = () => {
    setResult(null);
    setStatus("idle");
    setError(null);
  };

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      dropRef.current?.classList.remove("ring-brand-green/40");
      onFile(e.dataTransfer.files?.[0] ?? null);
    },
    [onFile]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dropRef.current?.classList.add("ring-brand-green/40");
  }, []);

  const onDragLeave = useCallback(() => {
    dropRef.current?.classList.remove("ring-brand-green/40");
  }, []);

  if (purchaseSuccess) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border-2 border-brand-green/20 p-8 sm:p-12 text-center max-w-xl mx-auto animate-fade-in-up">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-brand-green/10 flex items-center justify-center">
          <svg className="w-9 h-9 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display text-3xl text-brand-green mb-3">Your wallpaper is on its way.</h2>
        <p className="text-gray-600 leading-relaxed mb-2">
          Check your email — the full-resolution 1290×2796 wallpaper is in your inbox
          (or will be within a few minutes).
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Save it, set it as your wallpaper, and tag us if you share it.
        </p>
        <button
          onClick={() => {
            setPurchaseSuccess(false);
            setResult(null);
            setStatus("idle");
          }}
          className="bg-brand-green text-cream px-6 py-3 rounded-full text-sm font-display font-semibold hover:bg-brand-green/90 transition-colors"
        >
          Make another wallpaper
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 lg:gap-10 items-start">
      {/* Phone-shaped preview pane */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8 flex flex-col items-center">
        <PhoneFrame bgHex={bgHex} preview={result?.preview} loading={status === "generating"} />
        {result ? (
          <div className="mt-6 w-full max-w-xs space-y-3">
            <button
              onClick={buy}
              disabled={status === "checkout"}
              className="w-full bg-brand-green text-cream py-4 rounded-full text-base font-display font-semibold hover:bg-brand-green/90 transition-colors disabled:opacity-60"
            >
              {status === "checkout"
                ? "Loading checkout…"
                : "Get full HD wallpaper — $0.99"}
            </button>
            <button
              onClick={tryAnother}
              className="w-full text-center text-xs text-gray-500 hover:text-brand-green transition-colors"
            >
              Try a different photo or color
            </button>
          </div>
        ) : (
          <p className="mt-5 text-xs text-gray-400 text-center max-w-xs">
            Live preview · watermarked until you download for $0.99
          </p>
        )}
      </div>

      {/* Controls pane */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-5">
        {/* Upload */}
        <div>
          <label className="block text-xs font-display font-semibold uppercase tracking-wider text-gray-600 mb-2">
            1. Pet photo
          </label>
          <div
            ref={dropRef}
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className="cursor-pointer border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center transition-all ring-4 ring-transparent hover:border-brand-green/40"
          >
            {photoPreviewUrl ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreviewUrl}
                  alt="Selected pet photo"
                  className="w-14 h-14 rounded-xl object-cover bg-gray-100"
                />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm text-gray-700 truncate">{file?.name}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFile(null);
                    }}
                    className="text-xs text-brand-green hover:underline"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl mb-1.5">🐾</div>
                <p className="text-sm text-gray-700 font-medium mb-0.5">
                  Drop or click to upload
                </p>
                <p className="text-[11px] text-gray-400">
                  JPG, PNG, WebP, or HEIC · up to 15 MB
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {/* Color palette */}
        <div>
          <label className="block text-xs font-display font-semibold uppercase tracking-wider text-gray-600 mb-2">
            2. Background color
          </label>
          <div className="grid grid-cols-5 gap-2">
            {palette.map((c) => {
              const selected = c.hex.toLowerCase() === bgHex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setBgHex(c.hex)}
                  aria-label={c.name}
                  className={`relative aspect-square rounded-xl transition-all ${
                    selected
                      ? "ring-2 ring-brand-green ring-offset-2 scale-105"
                      : "ring-1 ring-gray-200 hover:ring-gray-300"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {selected ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white drop-shadow"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            {palette.find((c) => c.hex.toLowerCase() === bgHex.toLowerCase())?.name}
          </p>
        </div>

        {/* Generate */}
        <button
          onClick={generate}
          disabled={!file || status === "generating"}
          className="w-full bg-brand-green text-cream py-3.5 rounded-full text-sm font-display font-semibold hover:bg-brand-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "generating" ? "Generating preview…" : "3. Generate preview"}
        </button>

        {error ? (
          <p className="text-red-500 text-xs text-center">{error}</p>
        ) : null}

        <p className="text-[11px] text-gray-400 text-center pt-2 border-t border-gray-100">
          Preview is free and watermarked. You only pay if you love it.
        </p>
      </div>
    </div>
  );
}

/**
 * Phone-shaped frame that displays either the generated wallpaper preview, a
 * placeholder colored to match the currently-selected background, or a
 * loading spinner over the placeholder. Keeps the staging consistent so the
 * "before/after" feels natural.
 */
function PhoneFrame({
  bgHex,
  preview,
  loading,
}: {
  bgHex: string;
  preview?: string;
  loading: boolean;
}) {
  return (
    <div className="relative">
      <div
        className="rounded-[2.5rem] bg-black p-2 shadow-[0_20px_50px_-20px_rgba(45,74,62,0.4)]"
        style={{ width: 240, height: 480 }}
      >
        <div
          className="relative w-full h-full rounded-[2rem] overflow-hidden"
          style={{ backgroundColor: bgHex }}
        >
          {/* Camera notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-10" />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Wallpaper preview"
              className="w-full h-full object-cover"
            />
          ) : null}
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <div className="text-cream text-xs font-display font-semibold tracking-wider animate-pulse">
                Generating…
              </div>
            </div>
          ) : null}
          {/* Time / status bar mockup at top for realism */}
          {!preview && !loading ? (
            <div className="absolute top-0 left-0 right-0 px-6 pt-3 flex justify-between text-[10px] font-semibold text-white/80">
              <span>9:41</span>
              <span>● ● ●</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
