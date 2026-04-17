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
    process.env.NEXT_PUBLIC_BASE_URL || "https://pet-portraits.vercel.app"
  ),
  title: "Paw Masterpiece — Fine Art Portraits of Your Pet",
  description:
    "Transform your pet's photo into a stunning fine art portrait. Watercolor, oil painting, Renaissance, and line art styles. Delivered instantly.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "Paw Masterpiece — Fine Art Portraits of Your Pet",
    description:
      "Transform your pet's photo into a stunning fine art portrait. Ready in seconds.",
    siteName: "Paw Masterpiece",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paw Masterpiece — Fine Art Portraits of Your Pet",
    description:
      "Transform your pet's photo into a stunning fine art portrait. Ready in seconds.",
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
