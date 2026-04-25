// Data for occasion-based gift landing pages. Each occasion targets a
// specific SEO search cluster ("mothers day dog mom gift", "christmas pet
// portrait", etc.) AND serves as a campaign anchor we can link from emails
// and ads during that window.
//
// Copy is intentionally unique per occasion, not templated — thin/duplicate
// content gets filtered out of search. If you add a new occasion, write the
// body text yourself rather than copy-paste-swap a previous one.

import type { StyleKey } from "./gemini";

export interface GiftOccasion {
  slug: string;
  displayName: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  heroHeadline: string;
  heroSubhead: string;
  heroTrust: string;
  heroImage: string;
  heroImageAlt: string;
  /** CTA button label. Defaults to "Start Your Portrait" when unset. */
  heroCta?: string;
  /** Three unique content sections that appear in order below the hero. */
  sections: [
    { heading: string; body: string },
    { heading: string; body: string },
    { heading: string; body: string },
  ];
  recommendedStyles: { key: StyleKey; why: string }[];
  faqs: { q: string; a: string }[];
  closingHeadline: string;
  closingSubhead: string;
  /** Lucide-style relevance keywords used in metadata keywords and hero micro-copy. */
  keywords: string[];
}

export const GIFT_OCCASIONS: GiftOccasion[] = [
  {
    slug: "mothers-day",
    displayName: "Mother's Day",
    metaTitle: "Mother's Day Pet Portrait Gifts — Ready in 30 Seconds",
    metaDescription:
      "A Mother's Day gift the dog mom in your life will actually display. Turn her pet's photo into a gallery-quality portrait. Digital download in 30 seconds or framed canvas shipped to her door.",
    eyebrow: "Mother's Day Gifts",
    heroHeadline: "Make her cry (happy tears, promise).",
    heroSubhead:
      "Custom portrait, ready in 30 seconds. Free 11×14 display print with any order — through May 10.",
    heroTrust: "★ 4.9 · Ships in 3–5 days · Free preview",
    heroImage: "/ads/mothers-day-renaissance-reveal-v1.png",
    heroImageAlt: "Mom reacting to her framed pet portrait — Mother's Day gift reveal",
    heroCta: "Shop Mother's Day",
    sections: [
      {
        heading: "The gift dog moms actually want.",
        body:
          "Ask any dog mom what she'd frame and hang in her house, and it's not a mug, not a tote, not another pair of pet-print socks. It's a real piece of art that shows her pet the way she sees them. Paw Masterpiece turns the photo already on her phone into that piece of art — watercolor, oil painting, Renaissance, or line art — and delivers it as a full-resolution digital file she can print herself, or as a framed canvas you order shipped directly to her door.",
      },
      {
        heading: "Forgot Mother's Day is this weekend? Good — you're fine.",
        body:
          "The digital portrait is ready to email within 30 seconds of upload. You can buy the full-resolution file Mother's Day morning, forward her the download link, and she'll have a framed piece of art printed at her local print shop before brunch. For gifters planning ahead, the framed canvas prints ship in 3–5 business days within the United States.",
      },
      {
        heading: "Pair with a printable card for a complete gift.",
        body:
          "Many gifters buy two things together: the digital portrait to email, and the framed canvas to ship ahead. That way there's something for her to open on the day and something beautiful that arrives later. The portrait itself can pull double duty — one order covers both the digital file and a shipped canvas through our bundle option, with unlimited revisions if the first version doesn't capture her pet quite right.",
      },
    ],
    recommendedStyles: [
      { key: "watercolor", why: "Soft and emotional — the single most-gifted style for Mother's Day." },
      { key: "oil", why: "Rich, timeless, feels like a real heirloom painting." },
      { key: "renaissance", why: "Playful and unexpected — works if she has a sense of humor about her pet." },
    ],
    faqs: [
      {
        q: "How fast can I get a Mother's Day pet portrait?",
        a: "The digital download is ready in about 30 seconds. You can forward the full-resolution file to her directly from your phone. Framed canvas prints ship within 3–5 business days inside the United States — order by the Tuesday before Mother's Day to be safe.",
      },
      {
        q: "What if I don't have a photo of her pet?",
        a: "Check her Instagram, her Facebook, her camera roll if you share it, or just ask — \"send me your favorite photo of Max, I have something in mind.\" The AI works with any clear photo, even a casual phone snapshot.",
      },
      {
        q: "Can I include a printable gift card?",
        a: "Yes. Many customers forward a printable art card along with the digital download — we'll send you a link in the confirmation email. You can print it at home on cardstock or attach it to the framed canvas box.",
      },
      {
        q: "Does this work for cat moms too?",
        a: "Absolutely. Cats are half our orders. All four styles — watercolor, oil painting, Renaissance, line art — work on cats just as well as dogs.",
      },
      {
        q: "Is there a bundle of digital + framed canvas?",
        a: "Yes — our Complete Bundle ($79) includes both the framed canvas and the full-resolution digital file at no extra cost. The digital comes free with the canvas.",
      },
    ],
    closingHeadline: "Give her the gift she'll point to and say, 'my husband/wife/kid got me this.'",
    closingSubhead:
      "Preview free in 30 seconds. No account required. Framed canvas ships in 3–5 business days inside the United States.",
    keywords: ["mothers day pet portrait", "mothers day dog mom gift", "mothers day cat mom gift", "mothers day gift for pet lover"],
  },

  {
    slug: "fathers-day",
    displayName: "Father's Day",
    metaTitle: "Father's Day Pet Portrait Gifts — For the Dog Dad in Your Life",
    metaDescription:
      "A Father's Day gift for the dog dad who has everything. Turn his pet's photo into a custom portrait — framed canvas for his office, digital file for his phone. Preview free in 30 seconds.",
    eyebrow: "Father's Day Gifts",
    heroHeadline: "A Father's Day gift for the dog dad who has everything.",
    heroSubhead:
      "He doesn't need another tie. Turn his pet's photo into a framed portrait for his desk, his office, his man cave — a gift that says \"I noticed.\" Ready to preview in 30 seconds.",
    heroTrust: "Free preview · Framed canvas ships 3–5 days · 100% satisfaction guarantee",
    heroImage: "/examples/oil.png",
    heroImageAlt: "Father's Day pet portrait gift — oil painting of a dog",
    sections: [
      {
        heading: "The cheat code for Father's Day gifts.",
        body:
          "Most men say they don't want anything for Father's Day. What they mean is: don't get them another tie. A framed oil painting of his dog on his office wall is a different category of gift — personal, unexpected, the kind of thing coworkers ask about for the next three years. If he has a dog (or cat), this is the move.",
      },
      {
        heading: "Office-ready, man-cave-ready, garage-ready.",
        body:
          "Oil painting and line art are our two top-performing styles for Father's Day. Oil painting feels gallery-serious — the kind of thing that looks right framed above a desk. Line art is clean, modern, minimalist — works in a garage workbench or a home office with a monitor setup. Preview all four free before you commit.",
      },
      {
        heading: "A gift that doesn't require guessing his size or color.",
        body:
          "No returns, no exchanges, no 'this is too big' or 'he already has three of these.' A portrait of his dog can't be the wrong size or the wrong color. It's just his dog, on his wall, forever. If the first version doesn't capture the pet, we redo it free.",
      },
    ],
    recommendedStyles: [
      { key: "oil", why: "Top seller for Father's Day — gallery-serious, office-ready." },
      { key: "lineart", why: "Clean and modern — works in a home office or garage workbench." },
      { key: "renaissance", why: "The joke-gift-that's-actually-great option." },
    ],
    faqs: [
      {
        q: "When do I need to order by for Father's Day?",
        a: "For the digital file, 30 seconds before you send it. For the 8×12 framed canvas, aim for the Tuesday of the week before — we ship in 3–5 business days inside the United States.",
      },
      {
        q: "Renaissance portrait — joke or actually good?",
        a: "Both. It started as a joke and became one of our top three styles. A dog in a royal ruff and velvet robes in a gold frame is the kind of gift that lives above the fireplace for 20 years.",
      },
      {
        q: "Do you ship outside the US?",
        a: "Framed canvas prints currently ship only within the United States. Digital downloads are delivered instantly by email to any country.",
      },
      {
        q: "What if the first version doesn't capture his pet's personality?",
        a: "We redo it free. Unlimited revisions — reply to the confirmation email with what's off and we'll make a new version. No time limit on the guarantee.",
      },
    ],
    closingHeadline: "Better than another tie.",
    closingSubhead: "Preview free in 30 seconds. Framed canvas ships in 3–5 business days inside the United States.",
    keywords: ["fathers day pet portrait", "fathers day dog dad gift", "fathers day cat dad gift", "unique fathers day gift"],
  },

  {
    slug: "christmas",
    displayName: "Christmas",
    metaTitle: "Christmas Pet Portrait Gifts — Order by Dec 15 for US Delivery",
    metaDescription:
      "A Christmas gift the whole family will gather around. Turn any pet photo into a framed canvas portrait shipped in time for Christmas morning. Order by Dec 15 for standard US delivery.",
    eyebrow: "Christmas Gifts",
    heroHeadline: "The Christmas gift that lives above the mantel for 20 years.",
    heroSubhead:
      "Most pet-themed Christmas gifts end up in a drawer by February. A framed portrait of their pet ends up on the wall — and gets pointed at every time someone visits. Preview free in 30 seconds.",
    heroTrust: "Order by Dec 15 for US delivery · Free digital preview · Love-it-or-redo-it guarantee",
    heroImage: "/examples/renaissance.png",
    heroImageAlt: "Christmas pet portrait gift — renaissance painting of a dog",
    sections: [
      {
        heading: "Not another mug. Not another tote. Actual art.",
        body:
          "Every December, the same problem: what do you get the person who already has everything, for the dog they love more than they love you? The answer is a framed portrait of their dog. Not a cutout on a keychain, not a photo print, not a novelty pillow — a real piece of art, in one of four gallery-quality styles, printed on canvas and framed for hanging. The kind of gift that actually makes the wall.",
      },
      {
        heading: "Order by Dec 15 for delivery before Christmas.",
        body:
          "Framed canvas prints ship in 3–5 business days within the United States. To land on the doorstep before Christmas morning, order by December 15. If you're reading this after December 15, the digital download still works — forward them the full-resolution file Christmas morning and they'll have something beautiful to print in January. Many gifters give the digital preview on the day and ship the canvas to arrive early January as a second surprise.",
      },
      {
        heading: "Order multiple — family gets the same pet, four ways.",
        body:
          "If there are multiple people in the family who'd love the same portrait (parents, grandparents, adult kids), order once and get a digital download that prints at any size. Frame the same image four different ways for four different households. Our bundle option ($79) includes one framed 8×12 canvas plus the full-resolution digital file at no extra cost.",
      },
    ],
    recommendedStyles: [
      { key: "renaissance", why: "Top seller for Christmas — feels like a Renaissance masterpiece under the tree." },
      { key: "oil", why: "Traditional and timeless — pairs beautifully with holiday decor." },
      { key: "watercolor", why: "Soft and warm — the style most grandparents respond to best." },
    ],
    faqs: [
      {
        q: "What's the last day to order for Christmas delivery?",
        a: "For framed canvas prints: December 15 for standard US shipping. December 18 with expedited shipping. Digital downloads are instant — order Christmas morning and email it to them before breakfast.",
      },
      {
        q: "Can I order from outside the United States?",
        a: "Yes for digital downloads (delivered instantly by email). Framed canvas prints currently ship only within the United States — international customers typically purchase the digital file and print locally.",
      },
      {
        q: "Can I wrap the canvas myself?",
        a: "Yes. The canvas arrives in a clean shipping box — no Paw Masterpiece branding on the outside. Many gifters wrap it themselves or put it under the tree in the box it arrives in.",
      },
      {
        q: "Can I order one portrait for multiple family members?",
        a: "Yes. The digital download is a full-resolution file you can print at any size, as many times as you want — so one purchase can cover portraits for four different households.",
      },
      {
        q: "What if I need a last-minute gift and I missed the shipping cutoff?",
        a: "Buy the digital download ($6), email the recipient the full-resolution file Christmas morning, and follow up with a printed version in January. Many customers do this — the on-day gift plus the follow-up-arrival-gift often lands better than one box on Christmas morning.",
      },
    ],
    closingHeadline: "Order by Dec 15 for Christmas morning. After that, digital still works.",
    closingSubhead: "Framed canvas prints ship in 3–5 business days within the United States. Digital downloads are instant.",
    keywords: ["christmas pet portrait", "pet portrait christmas gift", "custom dog portrait christmas", "christmas gift for pet lovers"],
  },

  {
    slug: "birthday",
    displayName: "Birthday",
    metaTitle: "Birthday Pet Portrait Gifts — Unique Custom Art from Photo",
    metaDescription:
      "A birthday gift for the pet lover who has everything. Turn their pet's photo into a custom portrait — digital download in 30 seconds or framed canvas shipped to their door.",
    eyebrow: "Birthday Gifts",
    heroHeadline: "A birthday gift that beats another gift card.",
    heroSubhead:
      "For the friend who's shown you 40 photos of their dog this year: turn one of those photos into a framed portrait. Ready to preview in 30 seconds.",
    heroTrust: "Free preview · Instant digital delivery · Framed canvas ships 3–5 days",
    heroImage: "/examples/lineart.png",
    heroImageAlt: "Birthday pet portrait gift — line art drawing of a dog",
    sections: [
      {
        heading: "For the person who's hard to shop for.",
        body:
          "Every friend group has one: the person who already has everything, whose apartment is full, who returns half of what you get them. The move isn't another object — it's a portrait of their pet. It's one of a kind, it can't be duplicated, and it costs less than most mid-tier birthday gifts.",
      },
      {
        heading: "Same-day digital delivery for last-minute birthdays.",
        body:
          "Upload the photo, pick the style, get a preview in about 30 seconds. Purchase the full-resolution digital download and email it directly to their inbox with a note. For birthdays where you had more lead time, add a framed canvas that ships in 3–5 business days within the United States.",
      },
      {
        heading: "Works for first birthdays too.",
        body:
          "A portrait of a friend's new puppy, commissioned for the puppy's first birthday, is the kind of thoughtful gift people remember for years. Same for adoption anniversaries (\"Gotcha Day\" in the pet community). One photo, one portrait, one gift that actually gets hung on the wall.",
      },
    ],
    recommendedStyles: [
      { key: "watercolor", why: "The easiest style to love — works for almost any taste." },
      { key: "lineart", why: "Clean and modern — suits minimalist decor and younger gift recipients." },
      { key: "renaissance", why: "The funny-but-actually-serious gift — royal portrait of their dog." },
    ],
    faqs: [
      {
        q: "Can I send the digital download directly to the recipient's email?",
        a: "Yes. After purchase, we send the full-resolution file to the email address on the order — or you can forward it yourself with a personal note. Many gifters BCC themselves so they get it too.",
      },
      {
        q: "What if they don't like the first version?",
        a: "We redo it free. Forward them the confirmation email and let them tell us what's off — different expression, different background, more focus on the pet. Unlimited revisions, no questions.",
      },
      {
        q: "Can I do a Gotcha Day (adoption anniversary) portrait?",
        a: "Yes. Many of our gift orders are for adoption anniversaries — use the photo from the day they came home, or a recent photo, either works.",
      },
      {
        q: "What's the best last-minute birthday option?",
        a: "Buy the digital download ($6), preview appears in about 30 seconds, full-resolution file arrives by email within minutes. Email it to them with a birthday message. Total time: under 10 minutes.",
      },
    ],
    closingHeadline: "One photo. One portrait. One gift they'll hang on the wall.",
    closingSubhead: "Preview free in 30 seconds. Digital delivery is instant. Framed canvas ships in 3–5 business days inside the United States.",
    keywords: ["birthday pet portrait gift", "custom birthday gift pet lover", "birthday dog portrait", "pet birthday present"],
  },

  {
    slug: "dog-mom-gift",
    displayName: "Dog Mom Gifts",
    metaTitle: "Dog Mom Gifts — Custom Portrait from Her Dog's Photo",
    metaDescription:
      "The perfect dog mom gift. Turn her dog's photo into a gallery-quality custom portrait — watercolor, oil, Renaissance, or line art. Ships in 3–5 days inside the US, or instant digital download.",
    eyebrow: "For Dog Moms",
    heroHeadline: "For the dog mom who talks about her dog like he's her son.",
    heroSubhead:
      "She's shown you photos of Charlie 400 times. Turn one of those photos into a framed portrait. She'll hang it where people will see it — and talk about it for years.",
    heroTrust: "Free preview · Framed canvas ships 3–5 days · Unlimited revisions",
    heroImage: "/examples/watercolor.png",
    heroImageAlt: "Dog mom gift — custom watercolor portrait of a dog",
    sections: [
      {
        heading: "The gift that matches how she actually feels about her dog.",
        body:
          "Dog moms don't want another \"dog mom\" branded mug. They want something that treats their dog the way they treat their dog — seriously, with love, as a real family member. A framed watercolor or oil painting of her dog is that gift. It's the first pet-themed gift in a decade that won't go in the donation pile.",
      },
      {
        heading: "Works for any occasion you need a dog mom gift.",
        body:
          "Birthday, housewarming, engagement, \"just because\" — the portrait is occasion-agnostic. Many customers buy it as a thinking-of-you gift: a friend moved to a new apartment, or went through something hard, and a portrait of their dog shows up at their door. That's a different category of kindness than another gift card.",
      },
      {
        heading: "Not sure which style she'd like? Get the digital bundle.",
        body:
          "If you're debating between watercolor and oil painting, the digital download ($6) works as a preview — you can show it to her, see which she responds to, and then order the framed canvas in her preferred style. Or order the Complete Bundle ($79) — same price as the canvas alone, but includes the full-resolution digital file free.",
      },
    ],
    recommendedStyles: [
      { key: "watercolor", why: "The highest-converting style for dog mom gifts." },
      { key: "oil", why: "Feels like a real oil painting — suits anyone who loves traditional art." },
      { key: "renaissance", why: "For the dog mom with a sense of humor about her dog." },
    ],
    faqs: [
      {
        q: "What if she has multiple dogs?",
        a: "Upload one photo of each dog and we'll compose them together in a single portrait. No extra charge for up to four pets in one piece.",
      },
      {
        q: "What if her dog recently passed away?",
        a: "We take extra care with memorial portraits — see our <a href=\"/memorial\" class=\"text-brand-green underline\">memorial portrait page</a> for details on tone, revision policy, and gift handling. Any photo of her dog, no matter how old, can be the source.",
      },
      {
        q: "How do I get her dog's photo without asking?",
        a: "Check her Instagram, Facebook, or group chats — dog moms usually have 100+ public photos of their dog. A screenshot from a phone is plenty for the AI to work with.",
      },
      {
        q: "Can I order multiple portraits as a gift?",
        a: "Yes. Many families commission a portrait for each of her dogs, or multiple sizes of the same portrait for different rooms. Bulk discounts apply on orders of 2+ portraits.",
      },
    ],
    closingHeadline: "Give her the one pet-themed gift that won't end up in a donation pile.",
    closingSubhead: "Preview free in 30 seconds. Framed canvas ships in 3–5 business days inside the United States. Unlimited revisions if the first version doesn't feel like her dog.",
    keywords: ["dog mom gift", "dog mom gifts for her", "unique dog mom gift", "gifts for dog moms", "dog lover gift"],
  },
];

export function giftOccasionBySlug(slug: string): GiftOccasion | undefined {
  return GIFT_OCCASIONS.find((o) => o.slug === slug);
}
