"use client";

import { useCallback, useState } from "react";

interface UploadStepProps {
  onFileSelected: (file: File) => void;
}

export default function UploadStep({ onFileSelected }: UploadStepProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setError("Upload failed — please try a JPG or PNG under 10MB");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Upload failed — please try a JPG or PNG under 10MB");
        return;
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl text-brand-green mb-2">
          Upload your pet&apos;s photo
        </h2>
        <p className="text-gray-500">
          We&apos;ll transform it into a one-of-a-kind portrait
        </p>
      </div>

      {preview ? (
        <div className="flex flex-col items-center gap-4">
          {/* Frame mockup */}
          <div className="bg-white p-3 rounded-sm frame-shadow">
            <div className="w-72 h-72 overflow-hidden">
              <img
                src={preview}
                alt="Pet preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <button
            onClick={() => {
              setPreview(null);
              setError(null);
            }}
            className="text-sm text-gray-500 hover:text-brand-green transition-colors underline underline-offset-2"
          >
            Choose a different photo
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-2xl cursor-pointer transition-all bg-white ${
            dragActive
              ? "border-brand-green bg-brand-green/5 scale-[1.02]"
              : "border-gray-300 hover:border-brand-green/50"
          }`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-brand-green"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-1">
            <span className="text-brand-green font-semibold">Click to upload</span>{" "}
            or drag and drop
          </p>
          <p className="text-xs text-gray-400">JPG, PNG, or WebP &middot; Max 10MB</p>
        </label>
      )}

      {error && (
        <p className="text-red-500 text-sm text-center mt-4">{error}</p>
      )}

      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-brand-green mb-2 uppercase tracking-wider">Photo tips for best results</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-brand-gold rounded-full" />
            Clear view of face
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-brand-gold rounded-full" />
            Good lighting
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-brand-gold rounded-full" />
            Single pet only
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-brand-gold rounded-full" />
            Front-facing
          </span>
        </div>
      </div>
    </div>
  );
}
