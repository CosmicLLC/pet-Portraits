// Brand-, voice-, and campaign-aware defaults for the Ad Studio. Every new
// ad starts from a preset here, so creative stays on-brand even when the
// person iterating isn't the brand owner. Update the presets when the
// marketing plan shifts — adding a new occasion or seasonal angle is one
// new entry.

export const BRAND = {
  green: "#2D4A3E",
  gold: "#C4A35A",
  cream: "#FAF7F2",
  muted: "#666666",
  ink: "#1C1C1C",
} as const;

export const DEFAULT_BADGE = "★ 4.9  ·  Ships in 3–5 days";
export const DEFAULT_URL = "pawmasterpiece.com";
// Aggregate rating + volume claim — matches homepage JSON-LD. If lib/reviews
// AGGREGATE_RATING drifts from these numbers, update both together.
export const TRUST_SIGNALS = {
  rating: "4.9★",
  reviewCount: "40,000+",
  guarantee: "Love it or we redo it free",
  shipping: "Ships in 3–5 days",
  speed: "Preview free in 30 seconds",
};

export interface AdCopy {
  headline: string; // Multi-line, \n separated. Each line is a row.
  subhead: string;
  cta: string;
  url: string;
  badge: string;
}

export interface Preset {
  id: string;
  name: string;
  tagline: string;
  copy: AdCopy;
  // Optional prompt for generating the base image, paste-able into
  // ImageFX / Midjourney / Sora.
  imagePrompt?: string;
}

export const PRESETS: Preset[] = [
  {
    id: "variant-a-renaissance",
    name: "Variant A — Renaissance Reveal",
    tagline: "The pattern-break hook. Uses our unique Renaissance style to scroll-stop past competitors' line-art feed saturation.",
    copy: {
      headline: "She Saw Him In Oil Paint\nAnd Cried Harder Than\nOur Wedding.",
      subhead: "Real reactions. Real pet moms. 4.9★ from 40,000+ pet parents.",
      cta: "Preview Free — 30 Seconds",
      url: "pawmasterpiece.com",
      badge: "★ 4.9  ·  Ships in 3–5 days",
    },
    imagePrompt:
      "Cinematic lifestyle photo of a woman in her late 30s sitting on a cream linen sofa in a warm modern living room, mid-reaction to unwrapping a large framed gift. Her hands are pressed to her mouth, eyes shimmering with tears, soft smile breaking through. Tissue paper still mid-air around the frame. Her partner sits beside her smiling gently at her reaction, not at the gift. The gift is an 11x14 framed Renaissance-style oil painting of a golden retriever wearing a red velvet royal robe with a white lace ruff collar, gold chain, deep burgundy draped background, painted in the style of 17th century Flemish portraiture. Natural afternoon daylight, warm cream and olive color palette, subtle gold accents, shallow depth of field, shot on 50mm lens, photoreal, editorial lifestyle photography, candid but polished.",
  },
  {
    id: "variant-b-four-styles",
    name: "Variant B — Four-Style Grid",
    tagline: "Lean into our unique four-style range. Competitor ships one style; this pitch is 'why pick when you can try all four?'.",
    copy: {
      headline: "I Couldn't Pick.\nSo I Got All Four.",
      subhead: "Four artistic styles. One pet. 30-second preview, free.",
      cta: "Try All Four Free",
      url: "pawmasterpiece.com",
      badge: "★ 4.9  ·  Ships in 3–5 days",
    },
    imagePrompt:
      "2x2 grid of four framed pet portraits on a cream wall, same golden retriever subject in four distinct art styles: (1) soft watercolor with loose expressive brushwork, (2) rich oil painting in Flemish portraiture style with dramatic chiaroscuro, (3) royal Renaissance oil with velvet robes and gold leaf, (4) minimalist continuous-line black ink drawing. Each portrait in a thin matching frame, hung close together as a gallery wall. Natural daylight from left, editorial lifestyle photography, photoreal, Kinfolk magazine aesthetic.",
  },
  {
    id: "variant-c-speed-hook",
    name: "Variant C — Speed Hook",
    tagline: "The POV video opener. Leans into our 30-second preview — the one differentiator no competitor can match. TikTok / Reels.",
    copy: {
      headline: "30 Seconds.\nThat's How Long\nThis Took.",
      subhead: "Upload the photo. Pick the style. Preview before you pay.",
      cta: "Preview Free Now",
      url: "pawmasterpiece.com",
      badge: "★ 4.9  ·  Instant digital · Ships in 3–5 days",
    },
    imagePrompt:
      "Close-up POV shot of hands holding an iPhone in warm natural daylight, screen showing the Paw Masterpiece portrait generation interface with a golden retriever watercolor preview just rendered. Cream interior background slightly out of focus, coffee mug and open laptop visible. Editorial lifestyle photography, shot on 50mm lens, shallow depth of field, photoreal.",
  },
  {
    id: "mothers-day",
    name: "Mother's Day (generic)",
    tagline: "Gift-giver POV. Warm, specific, no 'Mom' cliché. Ships in the 16 days before May 10.",
    copy: {
      headline: "Flowers Wilt.\nHer Dog Doesn't.",
      subhead: "The Mother's Day gift pet moms actually display. Preview free.",
      cta: "Shop Mother's Day Gifts",
      url: "pawmasterpiece.com/gifts/mothers-day",
      badge: "Ships by May 10 · Order by May 3",
    },
    imagePrompt:
      "Cinematic lifestyle photo of an older woman (60s, cream cashmere sweater) on a warm beige linen sofa, holding a recently-unwrapped 11x14 watercolor portrait of her golden retriever. Tears visible. Her adult daughter beside her, hand on her back, filming on iPhone. Afternoon daylight, cream and rose palette, editorial warmth, photoreal, 50mm lens, candid family-moment aesthetic.",
  },
  {
    id: "fathers-day",
    name: "Father's Day",
    tagline: "Dog-dad oil-painting energy. Office-ready, no tropes.",
    copy: {
      headline: "Better Than\nAnother Tie.",
      subhead: "The Father's Day gift he'll actually hang in his office.",
      cta: "Shop Father's Day Gifts",
      url: "pawmasterpiece.com/gifts/fathers-day",
      badge: "★ 4.9  ·  Ships in 3–5 days",
    },
    imagePrompt:
      "Cinematic photo of a man in his 40s in a dark wood-paneled home office, hanging a framed oil painting of his black labrador on the wall above his desk. Warm amber lighting from a desk lamp. Leather chair, laptop visible, golden hour through window blinds. Editorial lifestyle, photoreal, shot on 50mm lens.",
  },
  {
    id: "christmas",
    name: "Christmas",
    tagline: "Gather-around-the-tree moment. Renaissance style is the Christmas flagship — funny AND beautiful under the tree.",
    copy: {
      headline: "The Gift The Whole\nFamily Gathers Around.",
      subhead: "Order by Dec 15 for Christmas morning delivery.",
      cta: "Shop Christmas Gifts",
      url: "pawmasterpiece.com/gifts/christmas",
      badge: "Order by Dec 15  ·  Free preview",
    },
    imagePrompt:
      "Warm Christmas morning family scene, adult son handing a wrapped rectangular gift to his mother on a rust-red velvet sofa next to a decorated Christmas tree. Partial reveal showing a framed Renaissance-style pet portrait peeking out. Warm golden fairy lights, soft wool throws, editorial holiday lifestyle photography, photoreal, cinematic.",
  },
  {
    id: "memorial",
    name: "Memorial (gentle tone)",
    tagline: "Different tone discipline than the rest. Slow-paced. No countdown, no urgency, no price. Uses grief-aware language from the memorial page.",
    copy: {
      headline: "A Gentle Way\nTo Keep\nThem Close.",
      subhead: "Hand-finished memorial portraits. Unlimited revisions. No time limit.",
      cta: "Begin Your Portrait",
      url: "pawmasterpiece.com/memorial",
      badge: "Love it or we redo it free",
    },
    imagePrompt:
      "Quiet still life of a framed watercolor pet portrait on a rustic mantel beside a lit white candle, a sprig of eucalyptus, and a folded soft grey wool throw. Soft morning light from a side window. Desaturated warm palette, no people, no urgency signals, shallow depth of field, editorial lifestyle photography, 50mm lens, photoreal, quiet and reverent mood.",
  },
  {
    id: "birthday",
    name: "Birthday",
    tagline: "Impossible-to-shop-for friend. Year-round evergreen.",
    copy: {
      headline: "One Photo.\nOne Portrait.\nOne Gift They'll Hang.",
      subhead: "The birthday gift that beats another gift card.",
      cta: "Shop Birthday Gifts",
      url: "pawmasterpiece.com/gifts/birthday",
      badge: "★ 4.9  ·  Instant digital download",
    },
    imagePrompt:
      "Close-up of a woman in her 30s opening a small wrapped rectangular gift at a Brooklyn brownstone kitchen counter in morning light. She is laughing in surprise, revealing a framed line-art portrait of her tabby cat. Exposed brick, eucalyptus in a vase, coffee cup beside her. Editorial lifestyle, photoreal, cream and terracotta palette.",
  },
  {
    id: "custom",
    name: "Custom (blank)",
    tagline: "Start from scratch. Use when none of the campaign presets fit.",
    copy: {
      headline: "Your Pet.\nYour Art.",
      subhead: "Custom portrait in 30 seconds. Free to preview.",
      cta: "Preview Free",
      url: "pawmasterpiece.com",
      badge: "★ 4.9  ·  40,000+ pet parents",
    },
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
