export const PRODUCTS = {
  digital: {
    label: "Digital Download",
    price: "$25",
    description: "Full resolution PNG, instant delivery",
  },
  wallpaper: {
    label: "Phone Wallpaper",
    price: "$15",
    description: "Optimized for mobile screens",
  },
  canvas: {
    label: "Canvas Print 8×10",
    price: "$77",
    description: "Printed & shipped to your door",
  },
} as const;

export type ProductType = keyof typeof PRODUCTS;
