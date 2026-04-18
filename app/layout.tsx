import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://pawmasterpiece.com"
  ),
  title: "Paw Masterpiece — Fine Art Portraits of Your Pet",
  description:
    "Transform your pet's photo into a stunning fine art portrait. Watercolor, oil painting, Renaissance, and line art styles. Delivered instantly.",
  openGraph: {
    title: "Paw Masterpiece — Fine Art Portraits of Your Pet",
    description:
      "Transform your pet's photo into a stunning fine art portrait. Ready in seconds.",
    siteName: "Paw Masterpiece",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Paw Masterpiece",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Paw Masterpiece — Fine Art Portraits of Your Pet",
    description:
      "Transform your pet's photo into a stunning fine art portrait. Ready in seconds.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="bg-cream font-body text-gray-800 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
