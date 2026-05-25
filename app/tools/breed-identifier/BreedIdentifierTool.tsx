"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";

type Confidence = "high" | "medium" | "low";

interface BreedResult {
  species: "dog" | "cat" | "unknown";
  primaryBreed: string;
  primaryConfidence: Confidence;
  description: string;
  recommendedStyles: string[];
  alternatives: { breed: string; why: string }[];
  funFact: string;
}

const STYLE_META: Record<
  string,
  { label: string; slug: string; emoji: string }
> = {
  watercolor: { label: "Watercolor", slug: "watercolor-pet-portrait", emoji: "🎨" },
  oil: { label: "Oil Painting", slug: "oil-painting-pet-portrait", emoji: "🖼️" },
  renaissance: { label: "Renaissance", slug: "renaissance-pet-portrait", emoji: "👑" },
  lineart: { label: "Line Art", slug: "line-art-pet-portrait", emoji: "✒️" },
};

const CONFIDENCE_LABEL: Record<Confidence, { text: string; tone: string }> = {
  high: { text: "High confidence", tone: "bg-brand-green/10 text-brand-green" },
  medium: { text: "Medium confidence", tone: "bg-amber-50 text-amber-700" },
  low: { text: "Best guess", tone: "bg-gray-100 text-gray-600" },
};

export default function BreedIdentifierTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BreedResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const onFile = useCallback((f: File | null) => {
    setError(null);
    setResult(null);
    setStatus("idle");
    if (!f) {
      setFile(null);
      setPreviewUrl((u) => {
        if (u) URL.revokeObjectURL(u);
        return null;
      });
      return;
    }
    if (!/^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(f.type)) {
      setError("Please upload a JPG, PNG, WebP, or HEIC photo.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File is too large — please upload a photo under 10 MB.");
      return;
    }
    setFile(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }, []);

  const identify = useCallback(async () => {
    if (!file) return;
    setStatus("loading");
    setError(null);
    track({ name: "portrait_generation_start", style: "breed_identifier" });
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch("/api/identify-breed", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Identification failed");
      }
      setResult(data.result);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Identification failed");
    }
  }, [file]);

  const reset = () => {
    setFile(null);
    setResult(null);
    setStatus("idle");
    setError(null);
    setPreviewUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });
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

  if (status === "ready" && result) {
    const conf = CONFIDENCE_LABEL[result.primaryConfidence];
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        {previewUrl ? (
          <div className="relative aspect-[3/2] bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Your pet"
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <span
              className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${conf.tone} mb-3`}
            >
              {conf.text}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-brand-green leading-tight mb-3">
              {result.primaryBreed}
            </h2>
            {result.description ? (
              <p className="text-gray-700 leading-relaxed">{result.description}</p>
            ) : null}
          </div>

          {result.funFact ? (
            <div className="bg-brand-gold/8 border border-brand-gold/25 rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-1">
                Fun fact
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{result.funFact}</p>
            </div>
          ) : null}

          {result.alternatives.length > 0 ? (
            <div>
              <p className="text-xs font-display font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Could also be:
              </p>
              <ul className="space-y-1.5">
                {result.alternatives.map((alt, i) => (
                  <li key={i} className="text-sm text-gray-600">
                    <strong className="text-gray-800">{alt.breed}</strong>
                    {alt.why ? <span> — {alt.why}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.recommendedStyles.length > 0 ? (
            <div>
              <p className="text-xs font-display font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Best portrait styles for this breed
              </p>
              <div className="grid grid-cols-2 gap-2">
                {result.recommendedStyles
                  .filter((s) => STYLE_META[s])
                  .slice(0, 4)
                  .map((styleKey) => {
                    const m = STYLE_META[styleKey];
                    return (
                      <Link
                        key={styleKey}
                        href={`/styles/${m.slug}`}
                        className="flex items-center gap-2 bg-cream hover:bg-brand-green/8 border border-gray-200 hover:border-brand-green/30 rounded-xl px-3 py-2.5 transition-colors"
                      >
                        <span className="text-xl">{m.emoji}</span>
                        <span className="text-sm font-display font-semibold text-brand-green">
                          {m.label}
                        </span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ) : null}

          {/* Primary CTA — drive into the portrait creator */}
          <div className="pt-2">
            <Link
              href="/"
              className="block w-full text-center bg-brand-green text-cream px-6 py-4 rounded-full text-base font-display font-semibold hover:bg-brand-green/90 transition-colors"
            >
              See {result.primaryBreed} as a portrait — free preview
            </Link>
            <button
              onClick={reset}
              className="block w-full text-center text-xs text-gray-400 mt-3 hover:text-gray-600 transition-colors"
            >
              Try a different photo
            </button>
          </div>

          {/* Share */}
          <ShareRow breed={result.primaryBreed} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
      <div
        ref={dropRef}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className="cursor-pointer border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center transition-all ring-4 ring-transparent hover:border-brand-green/40"
      >
        {previewUrl ? (
          <div className="space-y-3">
            <div className="relative aspect-[4/3] max-w-sm mx-auto bg-gray-100 rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Selected pet photo"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-gray-500">
              {file?.name}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFile(null);
                }}
                className="ml-2 text-xs text-brand-green hover:underline"
              >
                Change
              </button>
            </p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-3">🐾</div>
            <p className="font-display text-lg text-brand-green mb-1">
              Drop a photo here or click to browse
            </p>
            <p className="text-xs text-gray-500">
              JPG, PNG, WebP, or HEIC · up to 10 MB · best results with the face in focus
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

      {error ? (
        <p className="text-red-500 text-sm text-center mt-4">{error}</p>
      ) : null}

      <button
        onClick={identify}
        disabled={!file || status === "loading"}
        className="w-full mt-5 bg-brand-green text-cream py-4 rounded-full text-base font-display font-semibold hover:bg-brand-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Identifying…" : "Identify the breed"}
      </button>
      <p className="text-[11px] text-gray-400 text-center mt-3">
        Your photo is processed once and discarded — we don&apos;t store or train on it.
      </p>
    </div>
  );
}

function ShareRow({ breed }: { breed: string }) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/tools/breed-identifier`
      : "https://pawmasterpiece.com/tools/breed-identifier";
  const text = `I just found out my pet is a ${breed} — identified by Paw Masterpiece's free AI tool. Try it:`;

  const links = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(url)}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: "Pinterest",
      href: `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(
        url
      )}&description=${encodeURIComponent(text)}`,
    },
  ];

  return (
    <div className="border-t border-gray-100 pt-4">
      <p className="text-xs text-gray-500 mb-2">Share the tool</p>
      <div className="flex gap-2">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-brand-green/40 hover:text-brand-green transition-colors"
          >
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}
