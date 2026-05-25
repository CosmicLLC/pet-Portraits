// Competitor comparison page data. Each entry powers a /vs/[slug] page that
// captures "[us] vs [them]" search intent. Tone: factually accurate, no
// trash-talk, no false claims. Comparisons must be defensible — they live on
// a public site indexed by Google and read by the competitor's lawyers.
//
// Trademark note: using a competitor's name in editorial/comparison content
// is permissible "nominative fair use" as long as the content is accurate
// and doesn't suggest affiliation. Bidding on their name in Google Ads is a
// different question — don't.

export interface ComparisonRow {
  feature: string;
  /** What we deliver. Plain text, ≤ 8 words. */
  ours: string;
  /** What the competitor delivers. Plain text, ≤ 8 words. Sourced from their public site. */
  theirs: string;
  /** True when our value is the consumer-preferred one for this row. Drives the visual checkmark. */
  oursBetter: boolean;
}

export interface Comparison {
  slug: string;
  competitor: string;
  competitorShort: string;
  metaTitle: string;
  metaDescription: string;
  /** Short intro paragraph after the H1. ≤ 60 words. */
  intro: string;
  /** Three "if you want X, choose them; if Y, choose us" framing paragraphs. */
  whenToChoose: { headline: string; body: string }[];
  /** The comparison table rows. Order matters — put the rows most consumers care about first. */
  table: ComparisonRow[];
  /** 3-5 honest disclosures — when their option is genuinely the better fit. */
  whereTheyWin: string[];
  /** FAQ pairs that capture long-tail comparison queries. */
  faqs: { q: string; a: string }[];
  /** As of date for the comparison data — shown on the page for credibility. */
  asOf: string;
}

export const COMPARISONS: Comparison[] = [
  {
    slug: "crown-and-paw",
    competitor: "Crown & Paw",
    competitorShort: "Crown & Paw",
    metaTitle: "Paw Masterpiece vs Crown & Paw — Honest Comparison",
    metaDescription:
      "Side-by-side comparison of Paw Masterpiece and Crown & Paw — speed, price, styles, turnaround, revisions. Updated 2026. Honest take on when each is the better choice.",
    intro:
      "Crown & Paw built the modern pet-portrait category with hand-illustrated digital pieces — they're the brand most people know. We took a different bet: AI-assisted generation with curated styles, ~30 second preview, and a price point that doesn't feel like a special-occasion gift. Both are legitimate choices. Here's the honest comparison.",
    whenToChoose: [
      {
        headline: "Choose Crown & Paw if",
        body:
          "you want a hand-illustrated portrait from a human artist, you're not in a hurry, and the brand recognition matters to you (their pieces are popular enough that a recipient might recognize the style). Their typical turnaround is 1–3 business days for digital, longer for physical.",
      },
      {
        headline: "Choose us if",
        body:
          "you want to see the portrait before you pay anything, you want it now (preview in ~30 seconds, framed canvas shipped 3–5 days inside the US), and you'd rather spend $6–79 than $50+ for the digital file. Unlimited revisions are standard on every order.",
      },
      {
        headline: "Both are honest businesses",
        body:
          "Neither service is a scam. The choice is genuinely about what you value: artisanal hand-finishing on a 1–7 day timeline, or instant AI-assisted previews at a fraction of the price.",
      },
    ],
    table: [
      { feature: "Time to first preview", ours: "~30 seconds", theirs: "1–3 business days", oursBetter: true },
      { feature: "Free preview before paying", ours: "Yes — watermarked", theirs: "No", oursBetter: true },
      { feature: "Digital download starting price", ours: "$6", theirs: "$50+", oursBetter: true },
      { feature: "Framed canvas starting price", ours: "$79", theirs: "$89+", oursBetter: true },
      { feature: "Number of styles", ours: "4 curated", theirs: "100+ costumes/themes", oursBetter: false },
      { feature: "Revisions", ours: "Unlimited, free", theirs: "Available", oursBetter: true },
      { feature: "Made by", ours: "AI-assisted, human-curated", theirs: "Human illustrators", oursBetter: false },
      { feature: "Shipping (US framed)", ours: "3–5 business days", theirs: "5–10 business days", oursBetter: true },
      { feature: "International digital", ours: "Yes — instant", theirs: "Yes", oursBetter: false },
      { feature: "Memorial portraits", ours: "Yes — gentle tone", theirs: "Yes", oursBetter: false },
      { feature: "Money-back guarantee", ours: "100% love-it-or-redo-it", theirs: "Satisfaction guarantee", oursBetter: false },
    ],
    whereTheyWin: [
      "Style library breadth — they offer 100+ themed costumes (Renaissance king, astronaut, biker, etc.) versus our 4 fine-art styles. If you want your dog as a specific Marvel character, that's their wheelhouse.",
      "Brand recognition — a Crown & Paw piece is widely identifiable. If 'looks like a Crown & Paw' is a goal, only Crown & Paw delivers that.",
      "Pure human illustration — every piece is touched by a human artist. If the AI-assisted approach is a dealbreaker philosophically, theirs is the closer match to a traditional commission.",
      "Holiday lead time — for a Christmas-morning ship, both work, but Crown & Paw has more inventory of physical formats during peak season.",
    ],
    faqs: [
      {
        q: "Is Paw Masterpiece the same as Crown & Paw?",
        a: "No. We're a separate company with a different model. Crown & Paw uses human illustrators; we use AI-assisted generation with curated styles. We're not affiliated.",
      },
      {
        q: "Why is the digital download so much cheaper than Crown & Paw?",
        a: "AI generation has dramatically lower marginal cost than a human illustrator's time. We pass that through. The trade-off is honest: ours is AI-assisted; theirs is hand-finished. If you wouldn't notice the difference (most people don't), the price gap is meaningful. If you would, theirs is genuinely the better fit.",
      },
      {
        q: "Can I get a refund if I don't like the result?",
        a: "Yes. We offer a 100% satisfaction guarantee on every order — unlimited revisions to get it right, or a full refund if we can't. Crown & Paw offers similar protections; review their policy before ordering.",
      },
      {
        q: "Does Paw Masterpiece use real artists?",
        a: "We use AI for the heavy lift, with curated styles designed by humans. Crown & Paw uses traditional human illustrators. If a fully human-touched commission is important to you, theirs is the right choice.",
      },
      {
        q: "Which is faster — Paw Masterpiece or Crown & Paw?",
        a: "Paw Masterpiece. Our preview generates in about 30 seconds; theirs typically takes 1–3 business days for a digital proof. Framed canvas shipping is comparable — our partner prints in 3–5 days inside the US.",
      },
      {
        q: "Can I compare them side-by-side before ordering?",
        a: "Yes. Generate a free preview on our site (~30 seconds, no signup), then place a low-cost test order on Crown & Paw if you want to see both before committing. Our preview is free, so it costs you nothing to compare.",
      },
    ],
    asOf: "2026-05",
  },

  {
    slug: "west-and-willow",
    competitor: "West & Willow",
    competitorShort: "West & Willow",
    metaTitle: "Paw Masterpiece vs West & Willow — Honest Comparison",
    metaDescription:
      "Paw Masterpiece vs West & Willow — minimalist hand-illustrated pet portraits vs AI-assisted multi-style. Side-by-side comparison of price, turnaround, styles, revisions.",
    intro:
      "West & Willow built a strong following on a single, distinctive minimalist illustration style — clean lines, muted backgrounds, hand-finished by their team. We're built around variety and speed: four fine-art styles, ~30 second preview, instant digital. Different philosophies, both valid.",
    whenToChoose: [
      {
        headline: "Choose West & Willow if",
        body:
          "the minimalist illustrated look is exactly what you want, you're committed to a single specific aesthetic for the long term, and you're willing to wait their typical turnaround for hand-finished work.",
      },
      {
        headline: "Choose us if",
        body:
          "you want to preview multiple styles for the same photo before deciding, you want it fast (preview in ~30 seconds), and you'd rather pay $6–79 than $90+ for the digital file. Our four styles cover watercolor, oil, Renaissance, and line art — line art is our closest visual analogue to their look.",
      },
      {
        headline: "Both make solid product",
        body:
          "West & Willow's reviews are strong and their style is distinctive. We chose a different bet on variety and turnaround. The honest question is which trade-off fits your gift or wall.",
      },
    ],
    table: [
      { feature: "Time to first preview", ours: "~30 seconds", theirs: "Multiple business days", oursBetter: true },
      { feature: "Free preview before paying", ours: "Yes — watermarked", theirs: "No", oursBetter: true },
      { feature: "Digital download starting price", ours: "$6", theirs: "$90+", oursBetter: true },
      { feature: "Framed canvas starting price", ours: "$79", theirs: "$100+", oursBetter: true },
      { feature: "Number of styles", ours: "4 distinct fine-art styles", theirs: "1 signature look", oursBetter: false },
      { feature: "Multi-pet compositions", ours: "Yes — up to 4 pets", theirs: "Yes", oursBetter: false },
      { feature: "Made by", ours: "AI-assisted, human-curated", theirs: "Human illustrators", oursBetter: false },
      { feature: "Revisions", ours: "Unlimited, free", theirs: "Limited revisions", oursBetter: true },
      { feature: "Shipping (US framed)", ours: "3–5 business days", theirs: "Multiple weeks", oursBetter: true },
      { feature: "Phone cases / accessories", ours: "Not yet", theirs: "Yes", oursBetter: false },
      { feature: "Memorial portraits", ours: "Yes — dedicated page", theirs: "Yes", oursBetter: false },
    ],
    whereTheyWin: [
      "Single-style commitment — if you've already decided you want the minimalist look and only that look, theirs is the canonical version of it.",
      "Hand-illustrated authenticity — their team works with human illustrators throughout, with no AI in the loop. If that distinction matters to you, theirs is the right call.",
      "Accessory range — they sell pet-portrait phone cases, totes, mugs, and other accessories that we don't (yet).",
      "Established gift recognition — their packaging and unboxing experience is well-reviewed for gift-giving moments.",
    ],
    faqs: [
      {
        q: "Is Paw Masterpiece the same as West & Willow?",
        a: "No. We're separate companies with different models. West & Willow uses human illustrators in a single signature style; we use AI-assisted generation across four fine-art styles. We're not affiliated.",
      },
      {
        q: "Can Paw Masterpiece replicate the West & Willow look?",
        a: "Not exactly — their aesthetic is a specific signature style that requires the West & Willow team. Our closest analogue is the Line Art style: clean, minimalist, modern. If that's the look you want, line art is the right pick on our site.",
      },
      {
        q: "Why does Paw Masterpiece cost so much less than West & Willow?",
        a: "AI-assisted generation has lower marginal cost than a human illustrator's hours. We pass that through. The trade-off is real: theirs is hand-finished; ours is AI-assisted with human-curated styles.",
      },
      {
        q: "Is West & Willow worth the higher price?",
        a: "If their specific minimalist style is what you want and the hand-illustrated process matters to you, yes — it's a different product, not a worse one. If you'd be happy with watercolor, oil, Renaissance, or line art and you don't want to wait, ours is the better fit.",
      },
      {
        q: "Which has better revision policy?",
        a: "We offer unlimited free revisions with no time limit. West & Willow offers revisions but with a more restricted policy (check their site for current terms). For high-stakes memorial or gift orders, unlimited revisions tend to feel safer.",
      },
      {
        q: "Can I preview my pet in both before deciding?",
        a: "Our preview is free and takes about 30 seconds, so you can try ours first at no cost, then place a paid order with West & Willow if their style fits better. We genuinely think comparing both is reasonable — neither is a scam.",
      },
    ],
    asOf: "2026-05",
  },
];

export function comparisonBySlug(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
