"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

interface Props {
  imageId: string;
  onCaptured: () => void;
}

export default function BrowseAbandonmentCapture({ imageId, onCaptured }: Props) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "browse-abandonment", imageId }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
      track({ name: "sign_up", source: "browse-abandonment" });
      onCaptured();
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-6 p-5 bg-brand-green/5 border border-brand-green/20 rounded-2xl text-center animate-fade-in-up">
        <p className="text-brand-green font-medium text-sm">
          ✓ Portrait saved! We&apos;ll send it to your email.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-2xl animate-fade-in-up">
      <p className="font-display text-base font-semibold text-amber-900 mb-0.5">
        Don&apos;t lose your portrait!
      </p>
      <p className="text-amber-700 text-xs mb-3">
        Enter your email and we&apos;ll save this portrait for 7 days — no purchase required.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 transition-all disabled:opacity-60 whitespace-nowrap"
        >
          {submitting ? "…" : "Save It"}
        </button>
      </form>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
