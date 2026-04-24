"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export default function LeadMagnetForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/lead-magnet/photo-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ kind: "error", message: data.error || "Something went wrong" });
        return;
      }
      track({ name: "sign_up", source: "lead_magnet_photo_guide" });
      setState({ kind: "success" });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  };

  if (state.kind === "success") {
    return (
      <div className="bg-brand-green/5 border-2 border-brand-green/20 rounded-3xl p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-brand-green flex items-center justify-center">
          <svg className="w-6 h-6 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display text-2xl text-brand-green mb-2">Check your inbox.</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          The 5-rule guide is on the way to <strong>{email}</strong>. Should arrive in under a minute. If you don&apos;t see it, check spam.
        </p>
        <a
          href="/"
          className="inline-block mt-6 text-sm font-display font-semibold text-brand-green hover:underline"
        >
          Try a portrait now →
        </a>
      </div>
    );
  }

  const submitting = state.kind === "submitting";

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-3xl border border-gray-200 shadow-sm p-7 space-y-4"
    >
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@email.com"
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
        />
      </div>

      {state.kind === "error" && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-brand-green text-cream py-3.5 rounded-xl font-display font-semibold hover:bg-brand-green/90 transition-all disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send Me the Guide"}
      </button>

      <p className="text-[11px] text-gray-400 text-center leading-relaxed">
        One email with the guide. Then occasional notes about new styles + seasonal launches. Unsubscribe anytime.
      </p>
    </form>
  );
}
