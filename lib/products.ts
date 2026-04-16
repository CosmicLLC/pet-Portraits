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
  canvas: {
    label: "Canvas Print 8×10",
    price: "$79",
    description: "Gallery-quality, shipped to your door",
  },
  bundle: {
    label: "Complete Bundle",
    price: "$89",
    originalPrice: "$98",
    description: "Digital download + canvas print",
  },
} as const;

export type ProductType = keyof typeof PRODUCTS;
