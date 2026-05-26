import type { Metadata } from "next";
import LandingHeader from "@/components/LandingHeader";
import LandingFooterCTA from "@/components/LandingFooterCTA";
import MultiPetStudio from "./MultiPetStudio";

// Multi-pet portrait flow — parallel to /start. Supports 2-4 pets in a
// single composed portrait, optional names rendered on the artwork,
// across all 4 styles. Surcharge is +$15 per additional pet, applied
// at checkout via the multi-prefixed imageId.

export const metadata: Metadata = {
  title: "Multi-Pet Portraits — All Your Pets in One Custom Artwork",
  description:
    "Upload photos of 2, 3, or 4 pets and we'll compose them into a single gallery-quality portrait. Watercolor, oil painting, Renaissance, or line art. Free preview, +$15 per additional pet.",
  alternates: { canonical: "/start/multi" },
  openGraph: {
    title: "Multi-Pet Portraits — All Your Pets in One Custom Artwork",
    description:
      "Up to 4 pets composed into one portrait. Free preview in 30 seconds. +$15 per additional pet.",
    type: "website",
    url: "/start/multi",
    images: [
      {
        url: "/examples/renaissance.png",
        width: 1200,
        height: 900,
        alt: "Multi-pet portrait example",
      },
    ],
  },
};

export default function MultiPetPage() {
  return (
    <main className="min-h-screen bg-cream">
      <LandingHeader />
      <MultiPetStudio />
      <LandingFooterCTA
        headline="Make your whole crew into one piece of art."
        subhead="Up to 4 pets in a single portrait. Free preview, no signup. Only +$15 per additional pet."
        ctaLabel="Start a multi-pet portrait"
        ctaHref="/start/multi"
      />
    </main>
  );
}
