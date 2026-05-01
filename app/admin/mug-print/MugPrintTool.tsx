"use client"

import { useCallback, useRef, useState } from "react"

const PRESETS = [
  { name: "Warm Cream", hex: "#F5E6D3" },
  { name: "Dusty Rose", hex: "#D4A5A5" },
  { name: "Sage Green", hex: "#B8C5A6" },
  { name: "Soft Navy", hex: "#2C3E50" },
] as const

const HEX_RE = /^#[0-9a-fA-F]{6}$/

type Status = "idle" | "uploading" | "generating" | "ready" | "error"

export default function MugPrintTool() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [presetName, setPresetName] = useState<string>(PRESETS[0].name)
  const [customHex, setCustomHex] = useState<string>("")
  const [useCustom, setUseCustom] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const onFile = useCallback((f: File | null) => {
    setError(null)
    setResultUrl((u) => {
      if (u) URL.revokeObjectURL(u)
      return null
    })
    if (!f) {
      setFile(null)
      setPreviewUrl((u) => {
        if (u) URL.revokeObjectURL(u)
        return null
      })
      return
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("File must be JPG, PNG, or WebP")
      return
    }
    if (f.size > 15 * 1024 * 1024) {
      setError("File is too large — 15MB max")
      return
    }
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
    setStatus("idle")
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      dropRef.current?.classList.remove("ring-brand-green")
      const f = e.dataTransfer.files?.[0] ?? null
      onFile(f)
    },
    [onFile]
  )

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dropRef.current?.classList.add("ring-brand-green")
  }, [])

  const onDragLeave = useCallback(() => {
    dropRef.current?.classList.remove("ring-brand-green")
  }, [])

  const generate = useCallback(async () => {
    if (!file) return
    setError(null)
    setStatus("uploading")

    if (useCustom && !HEX_RE.test(customHex.trim())) {
      setError("Custom color must be a 6-digit hex like #2C3E50")
      setStatus("idle")
      return
    }

    try {
      setStatus("generating")
      const fd = new FormData()
      fd.append("image", file)
      if (useCustom) {
        fd.append("backgroundHex", customHex.trim())
      } else {
        fd.append("backgroundName", presetName)
      }
      const res = await fetch("/api/admin/generate-mug", {
        method: "POST",
        body: fd,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Server returned ${res.status}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
      setStatus("ready")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed")
      setStatus("error")
    }
  }, [file, useCustom, customHex, presetName])

  const downloadFilename = `mug-print-${Date.now()}.png`

  return (
    <div className="space-y-6">
      {/* Step 1 — drop zone */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center">1</span>
          <h2 className="font-display text-lg font-semibold text-brand-green">Pet photo</h2>
        </div>
        <div
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className="relative rounded-xl border-2 border-dashed border-gray-300 ring-2 ring-transparent transition-colors p-8 text-center cursor-pointer hover:border-brand-green/40"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          {previewUrl ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Selected pet"
                className="mx-auto max-h-64 rounded-xl object-contain"
              />
              <p className="text-xs text-gray-500">
                {file?.name} · {file ? Math.round(file.size / 1024) : 0} KB
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onFile(null)
                  if (inputRef.current) inputRef.current.value = ""
                }}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-700">Drop a photo here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WebP · 15MB max</p>
            </div>
          )}
        </div>
      </section>

      {/* Step 2 — background */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center">2</span>
          <h2 className="font-display text-lg font-semibold text-brand-green">Background color</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {PRESETS.map((p) => {
            const active = !useCustom && presetName === p.name
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  setUseCustom(false)
                  setPresetName(p.name)
                }}
                className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                  active ? "border-brand-green ring-2 ring-brand-green/20" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className="w-full h-12 rounded-lg mb-2"
                  style={{ backgroundColor: p.hex }}
                />
                <p className="text-xs font-display font-semibold text-brand-green">{p.name}</p>
                <p className="text-[10px] text-gray-400 font-mono">{p.hex}</p>
              </button>
            )
          })}
        </div>
        <div className="border-t border-gray-100 pt-4">
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={useCustom}
              onChange={(e) => setUseCustom(e.target.checked)}
              className="w-4 h-4 rounded text-brand-green focus:ring-brand-green/30"
            />
            <span className="text-sm text-gray-600">Use a custom hex color</span>
          </label>
          {useCustom && (
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={customHex}
                onChange={(e) => setCustomHex(e.target.value)}
                placeholder="#2C3E50"
                maxLength={7}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
              {HEX_RE.test(customHex.trim()) && (
                <div
                  className="w-10 h-10 rounded-lg border border-gray-200"
                  style={{ backgroundColor: customHex.trim() }}
                />
              )}
            </div>
          )}
        </div>
      </section>

      {/* Step 3 — generate */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center">3</span>
          <h2 className="font-display text-lg font-semibold text-brand-green">Generate</h2>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={generate}
          disabled={!file || status === "uploading" || status === "generating"}
          className="bg-brand-green text-white px-6 py-3 rounded-full text-sm font-display font-semibold hover:bg-brand-green/90 disabled:opacity-50 transition-colors"
        >
          {status === "generating"
            ? "Generating (~30–50s)…"
            : status === "uploading"
            ? "Uploading…"
            : "Generate Mug Print"}
        </button>
        {status === "generating" && (
          <p className="text-xs text-gray-500 mt-3">
            Gemini is rendering the portrait, then we composite it onto a 2700×1050 banner. Don't refresh.
          </p>
        )}
      </section>

      {/* Step 4 — result */}
      {resultUrl && (
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-brand-gold text-white text-xs font-bold flex items-center justify-center">✓</span>
            <h2 className="font-display text-lg font-semibold text-brand-green">Ready</h2>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resultUrl}
            alt="Generated mug banner"
            className="w-full rounded-xl border border-gray-200 mb-4"
          />
          <a
            href={resultUrl}
            download={downloadFilename}
            className="inline-flex items-center gap-2 bg-brand-green text-white px-6 py-3 rounded-full text-sm font-display font-semibold hover:bg-brand-green/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PNG (2700×1050, 300 DPI)
          </a>
        </section>
      )}
    </div>
  )
}
