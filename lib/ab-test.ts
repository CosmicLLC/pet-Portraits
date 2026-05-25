// Lightweight client-side A/B testing — no external dependency, no SaaS bill.
// Picks a variant on first visit, persists it in a cookie, and emits a GA4
// custom event + user-property so cohort analysis happens in GA4 directly.
//
// This is fine for the volume we're at. Move to GrowthBook or PostHog only
// when we need: cross-device user matching, multi-experiment exposure stats,
// or programmatic kill-switches.
//
// Usage:
//   import { useExperiment } from "@/lib/ab-test";
//   const variant = useExperiment("hero_headline", ["control", "speed_flex"]);
//
// Variant assignment is hash-based on the cookie's anonymous user id, so a
// given user always sees the same variant — no flicker between page loads.

"use client";

import { useEffect, useState } from "react";

const COOKIE_NAME = "pm_ab";
const COOKIE_DAYS = 365;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return match?.split("=")[1];
}

function writeCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const exp = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${exp}; path=/; SameSite=Lax`;
}

// FNV-1a 32-bit. Tiny, deterministic, no crypto needed for cohort hashing.
function hash32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function getOrCreateUserId(): string {
  let id = readCookie(COOKIE_NAME);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    writeCookie(COOKIE_NAME, id, COOKIE_DAYS);
  }
  return id;
}

/**
 * Picks a variant deterministically from `variants` for the current visitor.
 * The first variant in the array is treated as the control.
 *
 * Returns the chosen variant. While the component is hydrating it returns the
 * control variant (variants[0]) so server-rendered HTML is stable and there's
 * no layout flicker — the real variant takes over on first client render.
 */
export function useExperiment<T extends string>(
  experimentId: string,
  variants: readonly T[]
): T {
  const [variant, setVariant] = useState<T>(variants[0]);

  useEffect(() => {
    const userId = getOrCreateUserId();
    const idx = hash32(`${experimentId}:${userId}`) % variants.length;
    const chosen = variants[idx];
    setVariant(chosen);

    // GA4 user-property: enables segmenting any report by this experiment's
    // variant. Custom event also fires so funnel-step CR comparison is one
    // SQL query away if exported to BigQuery.
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("set", "user_properties", {
        [`exp_${experimentId}`]: chosen,
      });
      window.gtag("event", "experiment_exposed", {
        experiment_id: experimentId,
        variant: chosen,
      });
    }
  }, [experimentId, variants]);

  return variant;
}

/**
 * Server-safe variant picker. Use in a Server Component when the variant
 * decision needs to be made before HTML is sent (e.g. picking which of two
 * hero copies to render). Pass the cookie value from cookies().get(...).
 */
export function pickVariantFromCookie<T extends string>(
  experimentId: string,
  variants: readonly T[],
  userId: string | undefined
): T {
  if (!userId) return variants[0];
  const idx = hash32(`${experimentId}:${userId}`) % variants.length;
  return variants[idx];
}

export const AB_COOKIE_NAME = COOKIE_NAME;
