export const PRODUCTS = {
  digital: {
    label: "Digital Download",
    price: "$19",
    description: "Full-res PNG, instant email delivery",
  },
  wallpaper: {
    label: "Phone Wallpaper",
    price: "$15",
    description: "Optimized for mobile screens",
  },
  display: {
    label: "Display Print 11×14",
    price: "$15.99",
    description: "Fine art print on backing board, bagged ready to frame",
  },
  mounted: {
    label: "Mounted Print 11×14",
    price: "$33",
    description: "Gallery-matted fine art print — window mount + backing",
  },
  canvas: {
    label: "Framed Canvas Print 8×12",
    price: "$79",
    description: "Gallery-quality framed canvas, shipped to your door",
  },
  bundle: {
    label: "Complete Bundle",
    price: "$89",
    originalPrice: "$98",
    description: "Digital download + framed canvas print",
  },
} as const;

export type ProductType = keyof typeof PRODUCTS;

// Physical products shipped via Prodigi (require a US shipping address).
const PHYSICAL_PRODUCT_TYPES = new Set<string>([
  "display",
  "mounted",
  "canvas",
  "bundle",
]);

export function isPhysicalProduct(type: string): boolean {
  return PHYSICAL_PRODUCT_TYPES.has(type);
}
