"use client";

import type { StyleKey } from "@/lib/gemini";

const STYLES: { key: StyleKey; name: string; tagline: string; gradient: string; emoji: string }[] = [
  {
    key: "watercolor",
    name: "Watercolor",
    tagline: "Soft, dreamy, gift-perfect",
    gradient: "from-sky-200 via-pink-100 to-violet-200",
    emoji: "🎨",
  },
  {
    key: "oil",
    name: "Oil Painting",
    tagline: "Rich, classic, museum-worthy",
    gradient: "from-amber-800 via-orange-700 to-yellow-800",
    emoji: "🖼️",
  },
  {
    key: "renaissance",
    name: "Renaissance",
    tagline: "Royal, regal, shareable",
    gradient: "from-red-900 via-amber-800 to-yellow-700",
    emoji: "👑",
  },
  {
    key: "lineart",
    name: "Pencil / Line Art",
    tagline: "Clean, modern, minimal",
    gradient: "from-gray-300 via-gray-200 to-gray-300",
    emoji: "✏️",
  },
];

interface StylePickerProps {
  selected: StyleKey | null;
  onSelect: (style: StyleKey) => void;
}

export default function StylePicker({ selected, onSelect }: StylePickerProps) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl text-brand-green mb-2">
          Choose your style
        </h2>
        <p className="text-gray-500">
          Each style creates a unique masterpiece
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {STYLES.map((style) => (
          <button
            key={style.key}
            onClick={() => onSelect(style.key)}
            className={`group relative flex flex-col rounded-2xl overflow-hidden border-2 transition-all hover:-translate-y-1 hover:shadow-xl bg-white ${
              selected === style.key
                ? "border-brand-green shadow-xl ring-4 ring-brand-green/10"
                : "border-gray-200 hover:border-brand-green/30"
            }`}
          >
            {/* Style preview gradient */}
            <div className={`h-36 bg-gradient-to-br ${style.gradient} relative flex items-center justify-center`}>
              <span className="text-4xl opacity-80 group-hover:scale-110 transition-transform">
                {style.emoji}
              </span>
              {selected === style.key && (
                <div className="absolute top-3 right-3 w-7 h-7 bg-brand-green rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-4 text-left">
              <p className="font-display text-base font-semibold text-brand-green">
                {style.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{style.tagline}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
