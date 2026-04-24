"use client";

import { useEffect } from "react";

// Captures a ?ref=CODE param on any page load and writes it to a cookie so
// the rest of the flow (checkout, webhook) can attribute the sale without
// propagating query params through the UI. Safe to mount globally — does
// nothing unless ?ref= is present. A user who lands with a valid code
// overwrites any previous code (latest-touch attribution, matching the
// way most ecom stores handle this).
export default function RefCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref) return;
    const clean = ref.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length !== 8) return;
    const maxAge = 60 * 60 * 24 * 30; // 30 days
    document.cookie = `pm_ref=${encodeURIComponent(clean)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  }, []);
  return null;
}
