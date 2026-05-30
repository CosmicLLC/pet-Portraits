import { isPhysicalProduct } from "./products";

// Shared, framework-agnostic cart helpers (no React) — imported by the cart
// checkout route, the Stripe webhook, and the client cart store.
//
// SECURITY: the server only ever trusts { imageId, productType } per item.
// Prices come exclusively from server-side Stripe Price IDs — never from the
// client — so a tampered cart can't change what's charged.

export interface CartItem {
  imageId: string;
  productType: string;
}

// What we persist on Order.cartItems after the webhook fulfills each line.
export interface FulfilledCartItem {
  imageId: string;
  productType: string;
  blobUrl: string;
  prodigiOrderId?: string;
  prodigiStatus?: string;
}

// Cap cart size so the encoded line items stay well within Stripe's metadata
// limits (50 keys / 500 chars each) and bound per-checkout fulfillment work.
export const MAX_CART_ITEMS = 10;

const IMAGEID_RE = /^(multi[2-4]_)?[A-Za-z0-9-]+$/;

export function isValidCartItem(it: unknown): it is CartItem {
  if (!it || typeof it !== "object") return false;
  const { imageId, productType } = it as Record<string, unknown>;
  return (
    typeof imageId === "string" &&
    IMAGEID_RE.test(imageId) &&
    typeof productType === "string" &&
    productType.length > 0 &&
    productType.length < 40
  );
}

export function cartHasPhysical(items: CartItem[]): boolean {
  return items.some((it) => isPhysicalProduct(it.productType));
}

// ── Stripe metadata (de)serialization ──────────────────────────────────────
// One key per item ("ci_<n>" = "<imageId>|<productType>") plus a count. imageIds
// never contain "|", so the split is unambiguous. Stays under 50 keys / 500
// chars per value for any cart up to MAX_CART_ITEMS.
export function cartToMetadata(items: CartItem[]): Record<string, string> {
  const md: Record<string, string> = {
    cartCheckout: "true",
    cartCount: String(items.length),
  };
  items.forEach((it, k) => {
    md[`ci_${k}`] = `${it.imageId}|${it.productType}`;
  });
  return md;
}

export function cartFromMetadata(
  md: Record<string, string> | null | undefined
): CartItem[] {
  if (!md || md.cartCheckout !== "true") return [];
  const count = parseInt(md.cartCount || "0", 10);
  if (!Number.isFinite(count) || count <= 0) return [];
  const items: CartItem[] = [];
  for (let k = 0; k < count && k < MAX_CART_ITEMS; k++) {
    const v = md[`ci_${k}`];
    if (!v) continue;
    const sep = v.indexOf("|");
    if (sep < 0) continue;
    const item = { imageId: v.slice(0, sep), productType: v.slice(sep + 1) };
    if (isValidCartItem(item)) items.push(item);
  }
  return items;
}
