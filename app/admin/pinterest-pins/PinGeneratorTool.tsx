"use client";

import { useState } from "react";

type Style = "watercolor" | "oil" | "renaissance" | "lineart";
type Layout = "overlay" | "split";

const STYLES: { key: Style; label: string }[] = [
  { key: "watercolor", label: "Watercolor" },
  { key: "oil", label: "Oil Painting" },
  { key: "renaissance", label: "Renaissance" },
  { key: "lineart", label: "Line Art" },
];

const LAYOUTS: { key: Layout; label: string; hint: string }[] = [
  { key: "overlay", label: "Overlay", hint: "Text over sample image — dramatic, scroll-stopping" },
  { key: "split", label: "Split", hint: "Text on cream + image below — easier to read" },
];

export default function PinGeneratorTool() {
  const [title, setTitle] = useState("Turn your dog into a Renaissance masterpiece");
  const [eyebrow, setEyebrow] = useState("Paw Masterpiece");
  const [tagline, setTagline] = useState("Preview free · Watercolor, Oil, Renaissance, Line Art");
  const [style, setStyle] = useState<Style>("renaissance");
  const [layout, setLayout] = useState<Layout>("overlay");

  const previewUrl = `/api/admin/pinterest-pin?title=${encodeURIComponent(
    title
  )}&eyebrow=${encodeURIComponent(eyebrow)}&tagline=${encodeURIComponent(
    tagline
  )}&style=${style}&layout=${layout}`;

  const filename = `pin-${style}-${layout}-${slugify(title)}.png`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
      {/* Preview pane */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sticky top-4 self-start">
        <div className="aspect-[2/3] bg-gray-100 rounded-xl overflow-hidden relative">
          {/* Cache-bust via key=URL so prop changes trigger a fresh fetch */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={previewUrl}
            src={previewUrl}
            alt="Pin preview"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="mt-4 flex gap-2">
          <a
            href={previewUrl}
            download={filename}
            className="flex-1 text-center bg-brand-green text-cream px-4 py-2.5 rounded-full text-sm font-display font-semibold hover:bg-brand-green/90 transition-colors"
          >
            Download PNG
          </a>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-brand-green px-4 py-2.5 border border-gray-200 rounded-full transition-colors"
          >
            Open
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          1000 × 1500 · PNG · Pinterest-ready
        </p>
      </div>

      {/* Controls pane */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-5">
        <Field label="Title" hint="Pinterest deboosts clickbait. Front-load keywords. Under 100 chars.">
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
            maxLength={120}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-display focus:outline-none focus:border-brand-green/40"
          />
          <CharCount value={title} max={100} />
        </Field>

        <Field label="Eyebrow (small caps label)" hint="Usually the brand or a category label.">
          <input
            value={eyebrow}
            onChange={(e) => setEyebrow(e.target.value)}
            maxLength={40}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-green/40"
          />
        </Field>

        <Field label="Tagline" hint="Optional supporting line. Empty string to hide.">
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={140}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-green/40"
          />
        </Field>

        <Field label="Background style">
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStyle(s.key)}
                className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                  style === s.key
                    ? "border-brand-green bg-brand-green/8 text-brand-green font-semibold"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Layout">
          <div className="space-y-2">
            {LAYOUTS.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setLayout(l.key)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                  layout === l.key
                    ? "border-brand-green bg-brand-green/8"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p
                  className={`text-sm ${
                    layout === l.key ? "font-semibold text-brand-green" : "text-gray-700"
                  }`}
                >
                  {l.label}
                </p>
                <p className="text-xs text-gray-500">{l.hint}</p>
              </button>
            ))}
          </div>
        </Field>

        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed">
            Pin draft titles in{" "}
            <code className="bg-gray-100 px-1 py-0.5 rounded">docs/marketing/pinterest/30-starter-pins.md</code>.
            Paste the title above, pick the best style + layout, hit Download. Upload to
            Pinterest manually or batch through Tailwind.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
        {label}
      </label>
      {hint ? <p className="text-xs text-gray-400 mb-2">{hint}</p> : null}
      {children}
    </div>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <p className={`text-[11px] mt-1 ${over ? "text-red-500" : "text-gray-400"}`}>
      {value.length} / {max} chars
    </p>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}
