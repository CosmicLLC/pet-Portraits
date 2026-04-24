import { NextResponse } from "next/server";
import { PRICE_IDS } from "@/lib/stripe";
import { PRODUCTS } from "@/lib/products";

// Returns the list of product keys that are fully configured (Stripe price
// ID set). ProductSelector calls this on mount to decide which tiles to
// render — so new products auto-appear the moment their env var lands in
// Vercel and the deploy rolls out. No code change needed to activate.

export const dynamic = "force-dynamic";

export async function GET() {
  const enabled = Object.keys(PRODUCTS).filter((key) => {
    const priceId = PRICE_IDS[key];
    return typeof priceId === "string" && priceId.length > 0;
  });
  return NextResponse.json({ enabled });
}
