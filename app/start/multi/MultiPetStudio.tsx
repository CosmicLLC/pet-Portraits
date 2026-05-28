"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import UploadStep from "@/components/UploadStep";
import PortraitPreview from "@/components/PortraitPreview";
import ProductSelector from "@/components/ProductSelector";
import PostGenerationEmailCapture from "@/components/PostGenerationEmailCapture";
import { track } from "@/lib/analytics";
import { fetchJson } from "@/lib/fetch-json";

// Multi-pet portrait flow. Parallel to QuickStudio.tsx — they don't
// share state. Workflow: pick count → upload N photos (optional names)
// → pick style → generate → preview + product picker. After generate,
// imageId is multi-prefixed so /api/create-checkout knows to add the
// per-extra-pet surcharge automatically.

type StyleKey = "watercolor" | "oil" | "renaissance" | "lineart";
const STYLE_KEYS: StyleKey[] = ["watercolor", "oil", "renaissance", "lineart"];

const STYLE_LABELS: Record<
  StyleKey,
  { label: string; image: string; emoji: string }
> = {
  watercolor: { label: "Watercolor", image: "/examples/watercolor.png", emoji: "🎨" },
  oil: { label: "Oil Painting", image: "/examples/oil.png", emoji: "🖼️" },
  renaissance: { label: "Renaissance", image: "/examples/renaissance.png", emoji: "👑" },
  lineart: { label: "Line Art", image: "/examples/lineart.png", emoji: "✒️" },
};

const PET_COUNT_OPTIONS = [2, 3, 4] as const;
type PetCount = (typeof PET_COUNT_OPTIONS)[number];

const SURCHARGE_PER_EXTRA = 15;

type Step = "pre" | "loading" | "preview";

type PetSlot = { file: File | null; name: string };

function makeSlots(n: number): PetSlot[] {
  return Array.from({ length: n }, () => ({ file: null, name: "" }));
}

export default function MultiPetStudio() {
  const [petCount, setPetCount] = useState<PetCount>(2);
  const [slots, setSlots] = useState<PetSlot[]>(() => makeSlots(2));
  const [style, setStyle] = useState<StyleKey | null>(null);
  const [step, setStep] = useState<Step>("pre");
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-select style from ?style= param if provided (e.g. from style page CTA)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("style") as StyleKey | null;
    if (requested && STYLE_KEYS.includes(requested)) {
      setStyle(requested);
    }
  }, []);

  // When pet count changes, resize the slots array — preserve files+names
  // for indices that survive the resize so the user doesn't lose uploads
  // when they bump count up or down.
  const handlePetCountChange = useCallback((n: PetCount) => {
    setPetCount(n);
    setSlots((prev) => {
      const next = makeSlots(n);
      for (let i = 0; i < Math.min(prev.length, n); i++) {
        next[i] = prev[i];
      }
      return next;
    });
  }, []);

  const handleFileSelected = useCallback((index: number) => {
    return (file: File) => {
      setError(null);
      setSlots((prev) => {
        const next = prev.slice();
        next[index] = { ...next[index], file };
        return next;
      });
    };
  }, []);

  const handleNameChange = useCallback((index: number, value: string) => {
    setSlots((prev) => {
      const next = prev.slice();
      next[index] = { ...next[index], name: value };
      return next;
    });
  }, []);

  const allFilesUploaded = slots.every((s) => s.file !== null);
  const canGenerate = allFilesUploaded && !!style && step === "pre";

  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !style) return;
    setStep("loading");
    setError(null);
    track({ name: "portrait_generation_start", style: `${style}-multi${petCount}` });
    try {
      const formData = new FormData();
      formData.append("style", style);
      formData.append("petCount", String(petCount));
      slots.forEach((slot, i) => {
        if (slot.file) formData.append(`image${i}`, slot.file);
        formData.append(`name${i}`, slot.name.trim());
      });
      const data = await fetchJson<{ watermarkedImage: string; imageId: string }>(
        "/api/generate-multi",
        { method: "POST", body: formData }
      );
      setWatermarkedImage(data.watermarkedImage);
      setImageId(data.imageId);
      setStep("preview");
      track({
        name: "portrait_generated",
        style: `${style}-multi${petCount}`,
        imageId: data.imageId,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Generation failed — please try again or use clearer photos."
      );
      setStep("pre");
    }
  }, [canGenerate, slots, style, petCount]);

  const resetToStart = useCallback(() => {
    setStep("pre");
    setWatermarkedImage(null);
    setImageId(null);
    setError(null);
  }, []);

  // ── Preview step ─────────────────────────────────────────────────
  if (step === "preview" && watermarkedImage && imageId) {
    return (
      <section className="py-8 sm:py-12">
        <PostGenerationEmailCapture trigger imageType="multipet" />
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-gray-500">
              {petCount}-pet portrait · +${SURCHARGE_PER_EXTRA * (petCount - 1)} surcharge
            </p>
            <button
              onClick={resetToStart}
              className="text-xs text-gray-500 hover:text-brand-green transition-colors"
            >
              Start over
            </button>
          </div>
          <PortraitPreview watermarkedImage={watermarkedImage} />
          <div className="mt-6">
            <ProductSelector
              imageId={imageId}
              onError={setError}
              wallpaperSelected={false}
              petCount={petCount}
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center mt-4">{error}</p>
          )}
        </div>
      </section>
    );
  }

  // ── Pre + loading step ───────────────────────────────────────────
  const surchargeText =
    petCount > 1
      ? ` (+$${SURCHARGE_PER_EXTRA * (petCount - 1)} surcharge applied at checkout)`
      : "";

  return (
    <section className="py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-7">
          <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-3">
            Multi-Pet Portrait
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-brand-green leading-tight mb-3">
            All your pets, one custom portrait.
          </h1>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            Up to 4 pets composed into a single piece of art. Optional names
            rendered on the portrait. Free preview in about 30 seconds.
          </p>
        </div>

        {/* Step 1 — How many pets? */}
        <div className="mb-6">
          <p className="text-[11px] font-display font-semibold uppercase tracking-wider text-brand-gold mb-2">
            1. How many pets?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PET_COUNT_OPTIONS.map((n) => {
              const selected = petCount === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => handlePetCountChange(n)}
                  className={`py-3 rounded-xl border-2 transition-all text-center ${
                    selected
                      ? "border-brand-green bg-brand-green/5 shadow-sm"
                      : "border-gray-200 hover:border-brand-green/40"
                  }`}
                >
                  <p className="font-display text-base font-semibold text-brand-green">
                    {n} pets
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {n === 2 ? "+$15" : n === 3 ? "+$30" : "+$45"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2 — Upload N pet photos + optional names */}
        <div className="mb-6">
          <p className="text-[11px] font-display font-semibold uppercase tracking-wider text-brand-gold mb-2">
            2. Upload a clear photo of each pet
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Best results: each pet centered in their own photo, eyes visible,
            soft natural light. Names are optional — leave blank to skip the
            nameplate.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {slots.map((slot, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 p-4"
              >
                <p className="font-display text-sm font-semibold text-brand-green mb-2">
                  Pet {i + 1}
                </p>
                <UploadStep onFileSelected={handleFileSelected(i)} />
                <label className="block mt-3">
                  <span className="text-[11px] text-gray-500 font-medium">
                    Name (optional)
                  </span>
                  <input
                    type="text"
                    value={slot.name}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                    placeholder={`e.g. ${
                      ["Bear", "Luna", "Mochi", "Olive"][i] ?? "Pet name"
                    }`}
                    maxLength={32}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3 — Style */}
        <div className="mb-6">
          <p className="text-[11px] font-display font-semibold uppercase tracking-wider text-brand-gold mb-2">
            3. Pick a style
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STYLE_KEYS.map((key) => {
              const meta = STYLE_LABELS[key];
              const selected = style === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStyle(key)}
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
                    <p className="font-display text-xs font-bold leading-tight">
                      {meta.emoji} {meta.label}
                    </p>
                  </div>
                  {selected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-green flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-cream"
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
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4 — Generate */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={`w-full py-4 rounded-full text-base font-display font-semibold transition-all ${
            canGenerate
              ? "bg-brand-green text-cream hover:bg-brand-green/90 shadow-lg hover:-translate-y-0.5"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {step === "loading"
            ? `Generating ${petCount}-pet portrait — this takes about 30 seconds…`
            : !allFilesUploaded
            ? `Upload all ${petCount} pet photos to continue`
            : !style
            ? "Pick a style to continue"
            : `Generate ${petCount}-pet ${STYLE_LABELS[style].label} portrait — free preview`}
        </button>

        {error && (
          <p className="text-red-500 text-sm text-center mt-3">{error}</p>
        )}

        <p className="text-[11px] text-gray-400 text-center mt-4">
          Free to preview. Pay only if you love it. Surcharge for {petCount}{" "}
          pets:{" "}
          <span className="text-brand-green font-semibold">
            +${SURCHARGE_PER_EXTRA * (petCount - 1)}
          </span>{" "}
          on top of any product price{surchargeText && ""}.{" "}
          <Link href="/start" className="underline hover:text-brand-green">
            Just one pet?
          </Link>
        </p>
      </div>
    </section>
  );
}
