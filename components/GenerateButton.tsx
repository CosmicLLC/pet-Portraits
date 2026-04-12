"use client";

interface GenerateButtonProps {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

export default function GenerateButton({
  disabled,
  loading,
  onClick,
}: GenerateButtonProps) {
  return (
    <div className="w-full flex flex-col items-center gap-4">
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`w-full max-w-sm py-4 px-8 rounded-full text-lg font-display font-semibold transition-all ${
          disabled || loading
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-brand-green text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] animate-shimmer"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Painting your portrait...
          </span>
        ) : (
          "Create My Portrait"
        )}
      </button>
      {loading && (
        <p className="text-sm text-gray-400">
          This usually takes 20&ndash;30 seconds
        </p>
      )}
      {!loading && !disabled && (
        <p className="text-xs text-gray-400">
          Free to generate &middot; Only pay if you love it
        </p>
      )}
    </div>
  );
}
