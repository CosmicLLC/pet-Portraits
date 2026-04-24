"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PRESETS, getPreset, type AdCopy } from "./presets";
import { FORMATS, drawAd, type FormatId } from "./render";

// Client-side ad compositor. All state lives here; no server round-trips.
// The canvas elements are real-sized (e.g. 1080x1080) but CSS-scaled down
// so the preview grid fits in the viewport. Downloads use the native
// pixel size for Meta-ready output.

interface PreviewCanvasProps {
  formatId: FormatId;
  copy: AdCopy;
  baseImage: HTMLImageElement | null;
  logoImage: HTMLImageElement | null;
  onRegister: (id: FormatId, canvas: HTMLCanvasElement | null) => void;
}

function PreviewCanvas({ formatId, copy, baseImage, logoImage, onRegister }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const format = FORMATS.find((f) => f.id === formatId)!;

  useEffect(() => {
    onRegister(formatId, canvasRef.current);
    return () => onRegister(formatId, null);
  }, [formatId, onRegister]);

  useEffect(() => {
    if (!canvasRef.current) return;
    drawAd(canvasRef.current, format, copy, baseImage, logoImage);
  }, [format, copy, baseImage, logoImage]);

  const displayCap = formatId === "9x16" || formatId === "2x3" ? 280 : 420;
  const scale = displayCap / format.W;
  const displayW = format.W * scale;
  const displayH = format.H * scale;

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-2">
        {format.label} · {format.W}×{format.H}
      </p>
      <canvas
        ref={canvasRef}
        width={format.W}
        height={format.H}
        style={{
          width: `${displayW}px`,
          height: `${displayH}px`,
          display: "block",
          background: "#FAF7F2",
          borderRadius: "12px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      />
    </div>
  );
}

const DEFAULT_FORMATS: FormatId[] = ["1x1", "4x5", "9x16"];

export default function AdStudio() {
  const [presetId, setPresetId] = useState<string>(PRESETS[0].id);
  const [copy, setCopy] = useState<AdCopy>(PRESETS[0].copy);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [baseImageName, setBaseImageName] = useState<string | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [enabledFormats, setEnabledFormats] = useState<Set<FormatId>>(new Set(DEFAULT_FORMATS));
  const [promptCopied, setPromptCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [genAspectRatio, setGenAspectRatio] = useState<"1:1" | "16:9" | "3:4" | "9:16">("16:9");
  // Editable prompt — initialized from preset when preset changes, but the
  // user can freely edit, append extra instructions, or write from scratch.
  const [customPrompt, setCustomPrompt] = useState<string>(PRESETS[0].copy ? PRESETS[0].imagePrompt ?? "" : "");
  // Brand logo stamped onto every ad output. Loaded once on mount from
  // the site's existing /logo.png asset.
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);

  const canvasRefs = useRef<Map<FormatId, HTMLCanvasElement>>(new Map());

  const registerCanvas = useCallback(
    (id: FormatId, canvas: HTMLCanvasElement | null) => {
      if (canvas) canvasRefs.current.set(id, canvas);
      else canvasRefs.current.delete(id);
    },
    [],
  );

  // Wait for brand fonts (Playfair + DM Sans) before first paint — otherwise
  // canvas measures with system fallback widths and headlines get cut off
  // on first render.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  // Load the brand logo once. Uses /logo.jpg (the current canonical logo —
  // a2bdf8f replaced the older PNG). Re-renders propagate via logoImage state.
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLogoImage(img);
    img.src = "/logo.jpg";
  }, []);

  const preset = useMemo(() => getPreset(presetId), [presetId]);

  const applyPreset = useCallback((id: string) => {
    const p = getPreset(id);
    if (!p) return;
    setPresetId(id);
    setCopy(p.copy);
    setCustomPrompt(p.imagePrompt ?? "");
    setGenerateError(null);
  }, []);

  const onImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setBaseImage(img);
      setBaseImageName(file.name);
    };
    img.src = url;
  }, []);

  const downloadOne = useCallback((formatId: FormatId) => {
    const canvas = canvasRefs.current.get(formatId);
    if (!canvas) return;
    const safePreset = (preset?.id ?? "ad").replace(/[^a-z0-9-]/gi, "-");
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${safePreset}-${formatId}.png`;
    a.click();
  }, [preset]);

  const downloadAllEnabled = useCallback(() => {
    Array.from(enabledFormats).forEach((id, i) => {
      setTimeout(() => downloadOne(id), i * 300);
    });
  }, [enabledFormats, downloadOne]);

  const copyPrompt = useCallback(() => {
    const text = customPrompt.trim();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    });
  }, [customPrompt]);

  const resetPrompt = useCallback(() => {
    if (preset?.imagePrompt) setCustomPrompt(preset.imagePrompt);
  }, [preset]);

  const generateImage = useCallback(async () => {
    const promptText = customPrompt.trim();
    if (!promptText || generating) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/admin/ad-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          aspectRatio: genAspectRatio,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      // Load the base64 PNG into an Image so canvases can draw it
      const img = new Image();
      img.onload = () => {
        setBaseImage(img);
        setBaseImageName(`Imagen · ${preset?.name ?? "custom prompt"}`);
        setGenerating(false);
      };
      img.onerror = () => {
        setGenerateError("Failed to decode generated image");
        setGenerating(false);
      };
      img.src = `data:${data.mimeType};base64,${data.imageBase64}`;
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Generation failed");
      setGenerating(false);
    }
  }, [customPrompt, preset, generating, genAspectRatio]);

  const promptIsEdited = preset?.imagePrompt
    ? customPrompt.trim() !== preset.imagePrompt.trim()
    : customPrompt.trim().length > 0;

  const toggleFormat = useCallback((id: FormatId) => {
    setEnabledFormats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-8">
      {/* ─── CONTROLS ─────────────────────────────────────────────────── */}
      <aside className="space-y-6">
        {/* Preset picker */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
            Campaign preset
          </label>
          <select
            value={presetId}
            onChange={(e) => applyPreset(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {preset && (
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">{preset.tagline}</p>
          )}
        </section>

        {/* Base image */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
            Base image
          </label>
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-200 rounded-xl px-4 py-6 text-center hover:border-brand-green/40 transition-colors">
              {baseImage ? (
                <div>
                  <p className="text-sm font-semibold text-brand-green mb-1">
                    ✓ {baseImageName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {baseImage.naturalWidth}×{baseImage.naturalHeight} · click to change
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Upload base image
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG or JPG. Landscape or square works best.
                  </p>
                </div>
              )}
            </div>
          </label>

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {/* Editable prompt */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Prompt
                </label>
                {promptIsEdited && preset?.imagePrompt && (
                  <button
                    onClick={resetPrompt}
                    className="text-[10px] text-gray-400 hover:text-brand-green transition-colors"
                  >
                    Reset to preset
                  </button>
                )}
              </div>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={6}
                placeholder="Describe the ad scene. Start from a preset or write your own."
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green resize-y font-mono"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {customPrompt.length} / 4000 chars
                {promptIsEdited && " · edited"}
              </p>
            </div>

            {/* Aspect ratio toggle */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Aspect ratio</label>
              <div className="flex items-center gap-2">
                {(["16:9", "1:1", "3:4", "9:16"] as const).map((ar) => (
                  <button
                    key={ar}
                    onClick={() => setGenAspectRatio(ar)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                      genAspectRatio === ar
                        ? "bg-brand-green text-white border-brand-green"
                        : "bg-white border-gray-200 text-gray-600 hover:border-brand-green/40"
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions: generate OR copy to clipboard */}
            <div className="flex gap-2">
              <button
                onClick={generateImage}
                disabled={generating || !customPrompt.trim()}
                className="flex-1 bg-brand-green text-cream py-2.5 rounded-xl text-sm font-display font-semibold hover:bg-brand-green/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating…
                  </>
                ) : (
                  "✨ Generate"
                )}
              </button>
              <button
                onClick={copyPrompt}
                disabled={!customPrompt.trim()}
                className="bg-white border border-gray-200 text-gray-600 py-2.5 px-4 rounded-xl text-xs font-semibold hover:border-brand-green/40 transition-colors disabled:opacity-50"
                title="Copy prompt to clipboard for use in Midjourney / Sora / etc."
              >
                {promptCopied ? "✓ Copied" : "Copy"}
              </button>
            </div>

            {generateError && (
              <p className="text-xs text-red-600">{generateError}</p>
            )}
            <p className="text-[10px] text-gray-400">
              Uses Imagen 4 via the existing Gemini API key. ~$0.04 per image.
            </p>
          </div>
        </section>

        {/* Copy editor */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Ad copy
          </label>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Headline <span className="text-gray-400">(use Enter for line breaks)</span>
            </label>
            <textarea
              value={copy.headline}
              onChange={(e) => setCopy({ ...copy, headline: e.target.value })}
              rows={3}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 font-display focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Subhead
            </label>
            <textarea
              value={copy.subhead}
              onChange={(e) => setCopy({ ...copy, subhead: e.target.value })}
              rows={2}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              CTA button
            </label>
            <input
              type="text"
              value={copy.cta}
              onChange={(e) => setCopy({ ...copy, cta: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                URL line
              </label>
              <input
                type="text"
                value={copy.url}
                onChange={(e) => setCopy({ ...copy, url: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Badge (top of photo)
              </label>
              <input
                type="text"
                value={copy.badge}
                onChange={(e) => setCopy({ ...copy, badge: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>
          </div>
        </section>

        {/* Format selector */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">
            Placements
          </label>
          <div className="space-y-2">
            {FORMATS.map((f) => (
              <label
                key={f.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={enabledFormats.has(f.id)}
                  onChange={() => toggleFormat(f.id)}
                  className="accent-brand-green w-4 h-4"
                />
                <span className="text-sm text-gray-700 flex-1">{f.label}</span>
                <span className="text-xs text-gray-400 font-mono">{f.W}×{f.H}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Download */}
        <section>
          <button
            onClick={downloadAllEnabled}
            disabled={!fontsReady}
            className="w-full bg-brand-green text-cream py-3.5 rounded-xl font-display font-semibold hover:bg-brand-green/90 transition-all disabled:opacity-50"
          >
            Download {enabledFormats.size} {enabledFormats.size === 1 ? "file" : "files"}
          </button>
          {!fontsReady && (
            <p className="text-xs text-gray-400 text-center mt-2">Loading brand fonts…</p>
          )}
        </section>
      </aside>

      {/* ─── PREVIEWS ─────────────────────────────────────────────────── */}
      <main>
        <div className="flex flex-wrap gap-8 items-start">
          {Array.from(enabledFormats).map((id) => (
            <div key={id} className="flex flex-col gap-3">
              <PreviewCanvas
                formatId={id}
                copy={copy}
                baseImage={baseImage}
                logoImage={logoImage}
                onRegister={registerCanvas}
              />
              <button
                onClick={() => downloadOne(id)}
                className="text-xs text-gray-500 hover:text-brand-green transition-colors self-start"
              >
                ⬇ Download {id}
              </button>
            </div>
          ))}
        </div>

        {enabledFormats.size === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400">
            Enable at least one placement to see previews.
          </div>
        )}
      </main>
    </div>
  );
}
