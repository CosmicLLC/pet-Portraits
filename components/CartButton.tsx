"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

// Header cart indicator — only appears once there's something in the cart, so
// it doesn't add clutter for the common single-purchase path.
export default function CartButton() {
  const { count, hydrated } = useCart();
  if (!hydrated || count === 0) return null;
  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-brand-green/10 transition-colors"
    >
      <svg className="w-5 h-5 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-green text-cream text-[11px] font-bold flex items-center justify-center">
        {count}
      </span>
    </Link>
  );
}
