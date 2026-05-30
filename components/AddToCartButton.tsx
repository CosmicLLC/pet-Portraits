"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

// Adds a just-generated portrait to the multi-portrait cart so the customer can
// generate more and check out together. Defaults the line to "digital"; the
// actual product (canvas/print/etc.) is chosen per item on the /cart page.
export default function AddToCartButton({
  imageId,
  preview,
  petCount,
}: {
  imageId: string;
  preview?: string;
  petCount?: number;
}) {
  const { add, has, count } = useCart();
  const inCart = has(imageId);

  if (inCart) {
    return (
      <div className="flex items-center justify-center gap-3 text-sm">
        <span className="text-brand-green font-semibold">✓ Added to cart</span>
        <Link href="/cart" className="text-brand-green underline hover:no-underline">
          View cart ({count})
        </Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => add({ imageId, preview, petCount, productType: "digital" })}
      className="w-full text-center text-sm text-brand-green border border-brand-green/40 rounded-full py-2.5 px-4 hover:bg-brand-green/5 transition-colors font-display font-semibold"
    >
      + Add to cart &amp; create another
    </button>
  );
}
