// Single source of truth for programmatic SEO — used by the sitemap, the
// style landing pages, the pet category pages, and the breed-x-style matrix.
// Keep everything keyed by URL-safe slugs so links generate cleanly.

import type { StyleKey } from "@/lib/gemini"

// ── Styles ───────────────────────────────────────────────────────────────
export type StyleSeo = {
  key: StyleKey
  slug: string
  shortName: string
  fullName: string
  tagline: string
  description: string
  gift: string
  image: string
}

export const STYLE_SEO: Record<StyleKey, StyleSeo> = {
  watercolor: {
    key: "watercolor",
    slug: "watercolor-pet-portrait",
    shortName: "Watercolor",
    fullName: "Watercolor Pet Portrait",
    tagline: "Soft, dreamy, gift-perfect",
    description:
      "Loose expressive brushwork on white paper, delicate ink outlines, and a pastel palette. Watercolor portraits feel airy and intimate — the perfect keepsake for pet lovers who want something modern and heartfelt.",
    gift: "birthdays, engagements, first-home housewarmings",
    image: "/examples/watercolor.png",
  },
  oil: {
    key: "oil",
    slug: "oil-painting-pet-portrait",
    shortName: "Oil Painting",
    fullName: "Oil Painting Pet Portrait",
    tagline: "Rich, classic, museum-worthy",
    description:
      "Rich impasto brushwork in the Flemish portrait tradition. Warm dramatic lighting and a deep jewel-toned background turn your pet into a classical subject — gallery-quality and timeless.",
    gift: "anniversaries, graduations, retirement, a grown-up gift for a dog dad",
    image: "/examples/oil.png",
  },
  renaissance: {
    key: "renaissance",
    slug: "renaissance-pet-portrait",
    shortName: "Renaissance",
    fullName: "Renaissance Pet Portrait",
    tagline: "Royal, regal, shareable",
    description:
      "Your pet in a 16th-century royal court portrait — velvet robes, jeweled collars, gold leaf, burgundy drapery. Equal parts hilarious and beautiful. This is the style that breaks Instagram.",
    gift: "Christmas, housewarmings, a jokey-but-stunning gift for a best friend",
    image: "/examples/renaissance.png",
  },
  lineart: {
    key: "lineart",
    slug: "line-art-pet-portrait",
    shortName: "Line Art",
    fullName: "Line Art Pet Portrait",
    tagline: "Clean, modern, minimalist",
    description:
      "Precise graphite linework with cross-hatched depth on a clean white background. No color, just the soul of your pet in a few confident strokes. Elegant for modern interiors.",
    gift: "minimalists, designers, someone with a crisp black-and-white home",
    image: "/examples/lineart.png",
  },
}

export const STYLE_SLUGS = Object.values(STYLE_SEO).map((s) => s.slug)
export const STYLE_KEYS_ORDERED: StyleKey[] = ["watercolor", "oil", "renaissance", "lineart"]

export function styleBySlug(slug: string): StyleSeo | null {
  return Object.values(STYLE_SEO).find((s) => s.slug === slug) ?? null
}

// ── Pet categories ───────────────────────────────────────────────────────
export type PetCategory = {
  slug: string
  singular: string
  plural: string
  headline: string
  description: string
}

export const PET_CATEGORIES: Record<string, PetCategory> = {
  dogs: {
    slug: "dogs",
    singular: "dog",
    plural: "dogs",
    headline: "Custom Dog Portraits from Your Photo",
    description:
      "Turn any photo of your dog into gallery-quality art. Watercolor, oil painting, Renaissance royalty, or minimalist line art — delivered in seconds, printable at home or shipped as a framed canvas.",
  },
  cats: {
    slug: "cats",
    singular: "cat",
    plural: "cats",
    headline: "Custom Cat Portraits from Your Photo",
    description:
      "Every cat deserves to be painted like royalty. Upload any photo, choose a style, and get a stunning portrait — from dreamy watercolor to museum-grade oil to full Renaissance regalia.",
  },
}

export function petCategoryBySlug(slug: string): PetCategory | null {
  return PET_CATEGORIES[slug] ?? null
}

// ── Breeds (programmatic SEO) ────────────────────────────────────────────
// Each breed is a landing page × 4 styles = 4 programmatic URLs per breed.
// The content template in app/pet-portrait/[breed]/[style]/page.tsx consumes
// these fields. Descriptions are short (80-140 words) but unique — not
// templated — to avoid thin-content penalties.

export type Breed = {
  slug: string
  displayName: string
  pet: "dog" | "cat"
  description: string // 60-100 words, unique, keyword-rich
  traits: string[] // 3-4 personality traits, used in copy
  coatNote: string // one sentence about coat/colors, used in style pairing copy
}

export const BREEDS: Breed[] = [
  // ── Dog breeds (top-searched, AKC popularity leaders) ─────────────
  {
    slug: "labrador-retriever",
    displayName: "Labrador Retriever",
    pet: "dog",
    description:
      "The Labrador is America's most loved family dog — warm, patient, and endlessly expressive. A good Labrador portrait has to catch that half-smile they give when they know you're home, and the soft intelligence behind the eyes. Any photo with decent light works; they photograph beautifully.",
    traits: ["friendly", "loyal", "playful"],
    coatNote: "Their short coat takes every style well, but black Labradors especially shine in oil painting's dramatic lighting.",
  },
  {
    slug: "french-bulldog",
    displayName: "French Bulldog",
    pet: "dog",
    description:
      "Compact, stubborn, charming in a way only Frenchies can pull off. Their iconic bat ears and wide-set eyes are made for portraits — the style almost doesn't matter, they're always the subject. Renaissance is especially fun for a Frenchie; the contrast of regal robes against that goofy face is pure magic.",
    traits: ["charming", "stubborn", "affectionate"],
    coatNote: "Brindles and fawns render with real texture in watercolor; pied Frenchies pop in line art.",
  },
  {
    slug: "golden-retriever",
    displayName: "Golden Retriever",
    pet: "dog",
    description:
      "The golden's coat is the subject. All that warm, wavy fur catches light like nothing else, which is why oil painting is our top recommendation for this breed — the impasto brushwork renders their texture in a way photos simply can't. But a watercolor Golden is just as stunning, all loose warmth.",
    traits: ["gentle", "devoted", "joyful"],
    coatNote: "The long gold-to-cream coat is breathtaking in oil; watercolor captures the airiness.",
  },
  {
    slug: "german-shepherd",
    displayName: "German Shepherd",
    pet: "dog",
    description:
      "The German Shepherd has the most cinematic face in dogs — those alert eyes, the expressive eyebrows, the structured jawline. Black and tan coats look commanding in oil painting; Renaissance portraits land with particular power on a shepherd's noble profile.",
    traits: ["intelligent", "loyal", "courageous"],
    coatNote: "The black-and-tan double coat has striking contrast — oil painting brings out every tonal shift.",
  },
  {
    slug: "poodle",
    displayName: "Poodle",
    pet: "dog",
    description:
      "Poodles — whether Standard, Miniature, or Toy — are the most elegant dog in the room. Their curled coat has a painted quality already, which makes watercolor and oil portraits feel remarkably natural. Line art works beautifully if their coat is clipped short; the silhouette alone carries the portrait.",
    traits: ["refined", "intelligent", "playful"],
    coatNote: "Apricot, silver, black — all photograph cleanly; the curls render almost like brushstrokes already.",
  },
  {
    slug: "bulldog",
    displayName: "Bulldog",
    pet: "dog",
    description:
      "The English Bulldog's wrinkles tell a story, and the right portrait style brings them out. Oil painting is made for this breed — every fold and jowl is rendered with dramatic depth. Renaissance dress turns the bulldog's grump into full comedy-royalty.",
    traits: ["stoic", "affectionate", "stubborn"],
    coatNote: "Short coats in brindle or fawn show every contour in oil painting's strong lighting.",
  },
  {
    slug: "beagle",
    displayName: "Beagle",
    pet: "dog",
    description:
      "The beagle's tri-color coat and those big, expressive brown eyes make them naturals in front of a camera. Watercolor portraits suit beagles best — the soft wash style echoes their relaxed energy, and the iconic tricolor patterns render beautifully in loose brushwork.",
    traits: ["curious", "friendly", "merry"],
    coatNote: "White, tan, and black tricolor markings feel painterly in watercolor's wet-on-wet style.",
  },
  {
    slug: "rottweiler",
    displayName: "Rottweiler",
    pet: "dog",
    description:
      "A Rottweiler portrait should respect the breed's presence — confident, watchful, quietly powerful. Oil painting is the obvious choice; the black coat with tan markings turns deeply dramatic under portrait lighting. A Renaissance Rottweiler in a dark velvet robe is quietly perfect.",
    traits: ["confident", "loyal", "watchful"],
    coatNote: "The black-and-rust coat is stunning against the oil style's deep jewel-toned backgrounds.",
  },
  {
    slug: "dachshund",
    displayName: "Dachshund",
    pet: "dog",
    description:
      "Dachshunds have more personality per pound than any other dog, and a good portrait captures the attitude. Line art loves a dachshund — that elongated silhouette is instantly recognizable in a few strokes. Renaissance dress takes them from sausage dog to Habsburg royalty.",
    traits: ["bold", "affectionate", "mischievous"],
    coatNote: "Smooth, long-haired, or wirehaired — each rewards a different style; watercolor suits the long coats especially.",
  },
  {
    slug: "welsh-corgi",
    displayName: "Welsh Corgi",
    pet: "dog",
    description:
      "Stubby-legged, big-eared, impossibly charming. Corgis are the Queen's own, so a Renaissance Corgi portrait practically writes itself. The tri-color Pembroke and the red-and-white Cardigan both render beautifully in watercolor, too — the fluffy fox-face coat is a watercolorist's dream.",
    traits: ["bold", "friendly", "herding"],
    coatNote: "Red-and-white and sable coats are especially vivid in watercolor.",
  },
  {
    slug: "siberian-husky",
    displayName: "Siberian Husky",
    pet: "dog",
    description:
      "The Husky was made for portraiture — ice-blue eyes, expressive mask markings, thick double coat. Every style works for this breed, but oil painting captures the wolf-like regality best. Line art brings out the breed's architectural face structure in a completely different way.",
    traits: ["energetic", "vocal", "intelligent"],
    coatNote: "Black-and-white, agouti, red — Husky coats have dramatic contrast that photographs superbly.",
  },
  {
    slug: "australian-shepherd",
    displayName: "Australian Shepherd",
    pet: "dog",
    description:
      "Aussies wear their intelligence on their face, and their merle coats and heterochromia make them the most painterly dogs alive. Watercolor is especially gorgeous for this breed — the blue and red merle patterns feel like someone already did a watercolor pass on them.",
    traits: ["intelligent", "athletic", "intense"],
    coatNote: "Blue merle and red merle coats are unmatched in watercolor's fluid washes.",
  },
  {
    slug: "yorkshire-terrier",
    displayName: "Yorkshire Terrier",
    pet: "dog",
    description:
      "Yorkies have the bravado of a dog ten times their size, and a good portrait shows it. Their silky steel-blue-and-tan coat is a texture made for oil painting, but line art — clean and elegant — captures the breed's dignity in a way that feels true to their self-image.",
    traits: ["brave", "loyal", "feisty"],
    coatNote: "Long steel-blue and tan coats have real flow — oil painting and line art both work beautifully.",
  },
  {
    slug: "great-dane",
    displayName: "Great Dane",
    pet: "dog",
    description:
      "You cannot overstate the dignity of a Great Dane. They carry themselves like ambassadors. Renaissance portraits make perfect sense on this breed — the scale of the dog matches the scale of the ceremony. Oil painting works for the same reason: commanding subject meets commanding style.",
    traits: ["gentle", "regal", "patient"],
    coatNote: "Harlequin, black, fawn, blue — every Great Dane color lends itself to dramatic oil treatment.",
  },
  {
    slug: "bernese-mountain-dog",
    displayName: "Bernese Mountain Dog",
    pet: "dog",
    description:
      "Berners are the warm hug of the dog world. Their tri-color mask and flowing coat are a gift to painters — watercolor in particular catches the softness and the faintly Swiss-mountain-cottage vibe these dogs carry. Oil brings out the depth of their black coat beautifully.",
    traits: ["gentle", "affectionate", "calm"],
    coatNote: "The black-white-rust tricolor is iconic — watercolor washes render the breed's gentleness.",
  },

  // ── Cat breeds (top-searched) ──────────────────────────────────────
  {
    slug: "maine-coon",
    displayName: "Maine Coon",
    pet: "cat",
    description:
      "The Maine Coon is a gentle giant — long ruffed coat, tufted ears, huge soulful eyes. Oil painting does the most justice to all that fur; the dramatic lighting carves out the texture in a way a photograph never can. Renaissance portraits work too — this cat was made to wear robes.",
    traits: ["friendly", "vocal", "majestic"],
    coatNote: "The long shaggy coat in brown tabby, black, or cream is a masterclass in oil painting texture.",
  },
  {
    slug: "ragdoll",
    displayName: "Ragdoll",
    pet: "cat",
    description:
      "Ragdolls have those famous blue eyes and color-point coats that look like they were lit by a photographer. Watercolor portraits are transcendent for this breed — the soft washes echo the softness of their coat, and the blue eye color pops against pastel paper.",
    traits: ["docile", "affectionate", "calm"],
    coatNote: "Seal point, blue point, chocolate point — all soften beautifully in watercolor.",
  },
  {
    slug: "persian",
    displayName: "Persian",
    pet: "cat",
    description:
      "The Persian cat's flat face and luxuriant coat are operatic. Oil painting is a natural fit — every strand of that dense coat renders with almost sculptural depth. Renaissance dress turns a Persian into a cat Medici, which is probably what they imagine they are anyway.",
    traits: ["gentle", "quiet", "regal"],
    coatNote: "The dense long coat in white, silver, or blue takes oil painting's brushwork like oil on canvas.",
  },
  {
    slug: "siamese",
    displayName: "Siamese",
    pet: "cat",
    description:
      "Siamese cats have one of the most distinct faces in the animal kingdom — pale body, dark mask, piercing blue almond eyes. Line art loves a Siamese; the contrast between the pale fur and the dark points becomes architecture. Oil painting does equal justice.",
    traits: ["vocal", "intelligent", "intense"],
    coatNote: "The seal-point color contrast is extreme — line art and oil painting both exploit it.",
  },
  {
    slug: "british-shorthair",
    displayName: "British Shorthair",
    pet: "cat",
    description:
      "British Shorthairs have a round face and dense coat that looks, honestly, like plush. The blue British Shorthair especially is a dream subject — watercolor captures the softness of the coat, oil painting captures the dignity of their unreadable expression.",
    traits: ["placid", "easygoing", "dignified"],
    coatNote: "The iconic blue-gray coat is subtle and rich — watercolor renders it with real atmosphere.",
  },
  {
    slug: "bengal",
    displayName: "Bengal",
    pet: "cat",
    description:
      "A Bengal is a housecat wearing a leopard's coat, and their rosetted pattern is extraordinary on canvas. Watercolor suits them best — the loose washes imitate the wild irregularity of their markings. Oil painting brings out the intensity of their gold-green eyes.",
    traits: ["wild", "energetic", "athletic"],
    coatNote: "Brown spotted and marble Bengal coats are unmatched in watercolor — the rosettes become brushwork.",
  },
]

export function breedBySlug(slug: string): Breed | null {
  return BREEDS.find((b) => b.slug === slug) ?? null
}

// Convenience for sitemap generation
export function allProgrammaticUrls(base: string): string[] {
  const urls: string[] = []
  for (const style of Object.values(STYLE_SEO)) {
    urls.push(`${base}/styles/${style.slug}`)
  }
  for (const pet of Object.values(PET_CATEGORIES)) {
    urls.push(`${base}/pet-portraits/${pet.slug}`)
  }
  for (const breed of BREEDS) {
    for (const style of Object.values(STYLE_SEO)) {
      urls.push(`${base}/pet-portrait/${breed.slug}/${style.slug}`)
    }
  }
  return urls
}
