import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import ScrollRevealInit from "@/components/ScrollRevealInit";
import Analytics, { AnalyticsNoScript } from "@/components/Analytics";

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

const SEO_TITLE =
  "Custom AI Pet Portraits from Your Photo | Paw Masterpiece"
const SEO_DESCRIPTION =
  "Turn any photo into a custom pet portrait in 30 seconds. Choose watercolor, oil painting, Renaissance royalty, or line art. Instant digital download, or shipped as a framed canvas. Loved by 40,000+ pet parents."

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://pawmasterpiece.com"
  ),
  title: {
    default: SEO_TITLE,
    template: "%s | Paw Masterpiece",
  },
  description: SEO_DESCRIPTION,
  keywords: [
    "custom pet portrait",
    "pet portrait from photo",
    "AI pet portrait",
    "watercolor pet portrait",
    "oil painting pet portrait",
    "renaissance pet portrait",
    "dog portrait from photo",
    "cat portrait from photo",
    "pet portrait gift",
    "personalized pet art",
    "custom dog painting",
    "custom cat painting",
    "pet memorial portrait",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    siteName: "Paw Masterpiece",
    type: "website",
    url: "/",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Custom AI pet portrait examples — watercolor, oil painting, Renaissance, and line art",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Site-wide Organization + WebSite schema. Rich results eligibility for the
// company entity, site name in the SERPs, and a sitelinks search box hook.
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Paw Masterpiece",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.jpg`,
  description:
    "Custom AI-generated pet portraits from your photo — watercolor, oil painting, Renaissance, and line art styles delivered in 30 seconds.",
  slogan: "Turn Your Pet Into a Work of Art",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Paw Masterpiece",
  url: BASE_URL,
  description:
    "Custom AI-generated pet portraits from your photo, delivered in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="bg-cream font-body text-gray-800 antialiased">
        <AnalyticsNoScript />
        <AuthProvider>{children}</AuthProvider>
        <ScrollRevealInit />
        <Analytics />
      </body>
    </html>
  );
}
