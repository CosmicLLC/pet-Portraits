"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Client-side multi-portrait cart, persisted to localStorage. Holds the
// generated portraits a customer wants to buy together. The server re-prices
// everything from Stripe Price IDs at checkout, so the only fields that matter
// for billing are imageId + productType; preview/petCount are display-only.

export interface CartLine {
  imageId: string;
  productType: string;
  preview?: string; // watermarked data URL — thumbnail only
  petCount?: number;
}

interface CartContextValue {
  items: CartLine[];
  add: (line: CartLine) => void;
  remove: (imageId: string) => void;
  setProductType: (imageId: string, productType: string) => void;
  clear: () => void;
  has: (imageId: string) => boolean;
  count: number;
  hydrated: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "pm_cart_v1";
export const MAX_CART = 10;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load once on mount (client only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.slice(0, MAX_CART));
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  // Persist on change (after hydration so we don't clobber storage on first paint).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* quota / private mode — non-fatal */
    }
  }, [items, hydrated]);

  const add = useCallback((line: CartLine) => {
    setItems((prev) => {
      if (prev.some((i) => i.imageId === line.imageId)) return prev; // dedupe
      if (prev.length >= MAX_CART) return prev;
      return [...prev, line];
    });
  }, []);

  const remove = useCallback((imageId: string) => {
    setItems((prev) => prev.filter((i) => i.imageId !== imageId));
  }, []);

  const setProductType = useCallback((imageId: string, productType: string) => {
    setItems((prev) =>
      prev.map((i) => (i.imageId === imageId ? { ...i, productType } : i))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const has = useCallback((imageId: string) => items.some((i) => i.imageId === imageId), [items]);

  return (
    <CartContext.Provider
      value={{ items, add, remove, setProductType, clear, has, count: items.length, hydrated }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
