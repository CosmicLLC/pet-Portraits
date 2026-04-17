"use client";

import PawLoadingAnimation from "./PawLoadingAnimation";

interface GenerateButtonProps {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

export default function GenerateButton({ disabled, loading, onClick }: GenerateButtonProps) {
  if (loading) {
    return <PawLoadingAnimation />;
  }

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full max-w-sm py-4 px-8 rounded-full text-lg font-display font-semibold transition-all ${
          disabled
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-brand-green text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] animate-shimmer"
        }`}
      >
        Create My Portrait
      </button>
      {!disabled && (
        <p className="text-xs text-gray-400">
          Free to generate &middot; Only pay if you love it
        </p>
      )}
    </div>
  );
}
