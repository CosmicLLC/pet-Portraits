import type { Metadata } from "next";
import QuickStudio from "./QuickStudio";

// Zero-scroll landing for high-intent traffic — Pinterest pins, ad clicks,
// email CTAs. The upload widget is the FIRST thing in the viewport. No
// hero, no marketing copy, no scrolling required to start generating.
//
// Supports ?style={watercolor|oil|renaissance|lineart} to pre-select a
// style based on referring context (e.g. a Renaissance Pinterest pin
// lands here with renaissance pre-picked, the user only has to upload
// their photo to start).

export const metadata: Metadata = {
  title: "Start Your Pet Portrait — Preview Free in 30 Seconds",
  description:
    "Upload your pet's photo and see a custom portrait in about 30 seconds. Watercolor, oil painting, Renaissance, or line art. Free preview, no signup, no commitment.",
  alternates: { canonical: "/start" },
  // Don't index this page — it duplicates the home page's product schema
  // and exists purely as a conversion endpoint. We want Google to send
  // organic traffic to the rich style/gift pages, not here.
  robots: { index: false, follow: true },
};

export default function StartPage() {
  return <QuickStudio />;
}
