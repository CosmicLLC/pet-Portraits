// The 9 pre-drafted pet blogger contacts from
// docs/marketing/outreach/pet-blogger-outreach.md.
// Seeded into the OutreachContact table on demand (admin page button).
// Idempotent — re-running won't duplicate.

export interface SeedContact {
  name: string;
  channel: "blogger" | "instagram" | "tiktok" | "podcast" | "youtube" | "other";
  handle: string;
  email: string | null;
  url: string | null;
  niche: string | null;
  priority: 1 | 2 | 3;
  subject: string;
  body: string;
  notes: string;
}

export const PET_BLOGGER_SEED: SeedContact[] = [
  {
    name: "Paris Permenter",
    channel: "blogger",
    handle: "DogTipper.com",
    email: "paris@dogtipper.com",
    url: "https://dogtipper.com",
    niche: "Sponsored giveaways, dog products",
    priority: 1,
    subject: "Sponsored giveaway idea for DogTipper readers",
    body: `Hi Paris,

I run Paw Masterpiece, a small pet portrait studio — owners upload a photo and we turn it into a watercolor, oil painting, Renaissance, or line-art portrait, with a preview ready in about 30 seconds. I saw on your FAQ that you host sponsored giveaways for products like ours, and DogTipper feels like exactly the right room for this. [Reference their recent post about a specific dog product review or giveaway here.]

I'd love to sponsor a giveaway — happy to provide a framed 11x14 canvas (retail $79) as the prize, plus a digital portrait code for every entrant who doesn't win, so nobody walks away empty-handed. Could you share your current sponsored giveaway rates and lead times?

If a free portrait for you to try first would help you decide, just send a favorite photo of your dog and I'll get one back to you this week.

Thanks for considering,
Erinc
Paw Masterpiece — pawmasterpiece.com`,
    notes: "Lead with the giveaway since their FAQ explicitly invites it. Personalize with a recent giveaway or product review post so it's clear this isn't a mass send.",
  },
  {
    name: "Modern Dog Magazine",
    channel: "blogger",
    handle: "Modern Dog Magazine",
    email: "advertising@moderndogmagazine.com",
    url: "https://moderndogmagazine.com/advertise",
    niche: "Friday Freebie program, marketplace placements",
    priority: 1,
    subject: "Friday Freebie partnership — Paw Masterpiece",
    body: `Hi there,

I'm Erinc, founder of Paw Masterpiece — we do hand-styled pet portraits (watercolor, oil, Renaissance, line art) with a 30-second preview and a 3-5 day turnaround on framed canvases. I came across the Friday Freebie program on your advertise page and it looks like a natural fit for the kind of gift our buyers are usually shopping for. [Reference a recent Modern Dog feature or Friday Freebie post here.]

For a Friday Freebie I could offer a framed 11x14 canvas portrait ($79 retail) as the prize and a discount code for everyone who enters. I'd also love to hear about your marketplace placements if that's a separate conversation.

Could you share current Friday Freebie rates and the next few open slots? Happy to send you a complimentary portrait first so you can see the finish in person.

Best,
Erinc
pawmasterpiece.com`,
    notes: "Lead with Friday Freebie (their named program), marketplace ad is the soft second ask. Personalize with whatever Friday Freebie ran most recently so the pitch matches their cadence.",
  },
  {
    name: "Andrea Huspeni",
    channel: "blogger",
    handle: "This Dog's Life",
    email: "admin@thisdogslife.co",
    url: "https://thisdogslife.co",
    niche: "Sponsored reviews, gift guides, Brooklyn voice, affiliate via Lasso",
    priority: 2,
    subject: "Sponsored review pitch for This Dog's Life",
    body: `Hi Andrea,

I've been a quiet reader of This Dog's Life for a while — the Brooklyn-grounded voice is what keeps me coming back, and the gift guides have a level of curation most pet blogs skip. [Reference a recent This Dog's Life gift guide or product review here.]

I run Paw Masterpiece, a small pet portrait studio. Owners upload a photo, pick a style (watercolor, oil, Renaissance, line art), and get a preview in about 30 seconds; digital downloads are $6 and framed canvases are $79 with 3-5 day US shipping. I'd love to send you a free portrait of your dog — no obligation — and if it earns a spot in a sponsored review or guide, I'm happy to talk rates.

I also run an affiliate program at 15% on the first sale and 8% on repeat orders through the same customer, in case that's a better fit than a one-off review.

Thanks for the work you do,
Erinc
pawmasterpiece.com`,
    notes: "Sponsored review is the ask, affiliate is the optional second beat per the brief. Personalize with a specific gift guide or review she's written.",
  },
  {
    name: "PetGuide.com team",
    channel: "blogger",
    handle: "PetGuide.com",
    email: "hello@petguideplus.com",
    url: "https://petguide.com",
    niche: "Editorial gift guides, trend pieces, paid placements",
    priority: 2,
    subject: "Editorial pitch — AI pet portraits, 30-second preview",
    body: `Hi PetGuide team,

I'm Erinc, founder of Paw Masterpiece. We turn a phone photo into a watercolor, oil painting, Renaissance, or line-art portrait with the preview ready in roughly 30 seconds — meaningfully faster than the 1-7 day turnaround most studios in this category quote — and prices start at $6 for the digital. [Reference a recent PetGuide gift guide, gear roundup, or trend piece here.]

I think it'd fit naturally into a gift guide or a "what's new in pet gifting" piece, and I'd love to send you a free framed canvas portrait so you can evaluate the actual product, not just renders. If editorial works better as a paid placement, please point me at the rate card.

Open to whichever format is easiest on your side.

Thanks,
Erinc
pawmasterpiece.com`,
    notes: "Editorial-first ask, with paid-placement option named so they don't have to fish for it. Personalize with a gift guide or roundup so they see the angle right away.",
  },
  {
    name: "Rover Marketing",
    channel: "blogger",
    handle: "Rover Blog (The Dog People)",
    email: "marketing-inquiries@rover.com",
    url: "https://rover.com/blog",
    niche: "Co-marketing, sitter partnerships, large audience",
    priority: 2,
    subject: "Co-marketing idea for The Dog People",
    body: `Hi Rover marketing team,

I'm Erinc at Paw Masterpiece, a pet portrait studio. The reason I'm reaching out specifically to The Dog People (rather than ads) is that our customer overlap with Rover is unusually high — almost every order includes a sitter or boarding story in the notes field, often as the reason for the portrait. [Reference a recent Dog People post — e.g., a gift guide, a Rover study, or a sitter-story feature.]

I'd love to explore a co-marketing angle: a custom Rover-branded portrait style, a discount code for Rover customers, or a charitable tie-in around National Pet Month. Happy to ship you a framed sample portrait first so the conversation is grounded in the real product.

If there's a better contact for partnerships on the editorial side, I'd appreciate a forward.

Thanks,
Erinc
pawmasterpiece.com`,
    notes: "Co-marketing angle as instructed. The sitter-story observation is real positioning, not invented urgency. Personalize with a Dog People post that supports the overlap claim.",
  },
  {
    name: "Dogster team",
    channel: "blogger",
    handle: "Dogster.com (Pangolia)",
    email: null,
    url: "https://www.dogster.com/contact-us-now",
    niche: "Paid editorial (~$75/post), display ads",
    priority: 3,
    subject: "Paid editorial inquiry — Paw Masterpiece pet portraits",
    body: `Hi Dogster team,

I'm Erinc, founder of Paw Masterpiece. We do pet portraits in four styles (watercolor, oil, Renaissance, line art) with a 30-second preview, $6 digital and $79 framed canvas. I'd like to inquire about your paid editorial program — I understand placements start around $75 and I'd love to see the current media kit and any topical roundups coming up. [Reference a recent Dogster post or roundup that would be a natural fit here.]

I'd be glad to send a free portrait so the writer can see the finish before drafting. If display placements are sold separately I'd appreciate that rate card too.

Thanks for the time,
Erinc
pawmasterpiece.com`,
    notes: "Straight paid-editorial inquiry — short and transactional because the contact form is the gate, not a relationship. Personalize with a recent Dogster roundup or column.",
  },
  {
    name: "Dogington Post team",
    channel: "blogger",
    handle: "The Dogington Post",
    email: "info@dogingtonpost.com",
    url: "https://www.dogingtonpost.com",
    niche: "Display ads only (no editorial)",
    priority: 3,
    subject: "Media kit request — display ads on The Dogington Post",
    body: `Hi there,

I run a small pet portrait studio called Paw Masterpiece — happy to share more, but I know you don't run editorial submissions so I won't pitch one. I'd just like to request your current media kit and display ad rates. [Reference a recent Dogington Post section or feature here so they know the request is targeted.]

Q4 is our biggest window and I'm mapping out paid placements early. If you have any seasonal sponsorship packages around the holidays, I'd love to see those alongside the standard rates.

Thanks,
Erinc
pawmasterpiece.com`,
    notes: "Pure FYI + media kit ask — they don't take editorial. Personalize with any section reference (Health, Lifestyle, etc.) so it doesn't read like a blast.",
  },
  {
    name: "Fido Friendly team",
    channel: "blogger",
    handle: "Fido Friendly",
    email: null,
    url: "https://fidofriendly.com/mediakit.pdf",
    niche: "Print/digital magazine, sponsored editorial, travel + lifestyle",
    priority: 2,
    subject: "Sponsored editorial inquiry — Paw Masterpiece",
    body: `Hi Fido Friendly team,

I've gone through the media kit and wanted to inquire specifically about sponsored editorial — a featured product piece or inclusion in an upcoming themed issue would be the ideal fit. I run Paw Masterpiece, a pet portrait studio with a 30-second preview, four hand-styled options, and a memorial portrait line that's been growing meaningfully this year. [Reference a recent Fido Friendly issue theme or travel feature here.]

Could you share the current sponsored editorial rates and the editorial calendar for the next two issues? I'd be happy to send a complimentary framed portrait of your dog ahead of any commitment so the team can see the product firsthand.

Thanks,
Erinc
pawmasterpiece.com`,
    notes: "Treats the media kit as homework done — references their issue cadence. Memorial portrait mention is honest. Personalize with an issue theme. Email address is in the media kit PDF.",
  },
  {
    name: "BlogPaws team",
    channel: "blogger",
    handle: "BlogPaws",
    email: null,
    url: "https://blogpaws.com/events/write-for-us",
    niche: "Pet blogger network, sponsored posts ~$75, affiliate-friendly",
    priority: 2,
    subject: "Ongoing partner inquiry — Paw Masterpiece for BlogPaws network",
    body: `Hi BlogPaws team,

I'm Erinc, founder of Paw Masterpiece. Rather than a one-off sponsored post, I'm interested in becoming an ongoing partner for the BlogPaws network — recurring sponsored placements, an open affiliate offer for your bloggers (currently 15% first sale, 8% recurring), and a steady supply of free portraits for writers who want to review the product honestly. [Reference a recent BlogPaws community post, conference recap, or featured blogger here.]

If there's a partner tier or annual package, I'd love to see it. Otherwise, I'd appreciate a starting place — maybe one sponsored post and a handful of writer samples — so we can build from there.

Thanks for the work you do connecting brands with the right voices,
Erinc
pawmasterpiece.com`,
    notes: "Frames as a relationship, not a transaction — fits their network model. Affiliate terms are explicit because their writers will ask. Personalize with a community member or recent recap.",
  },
];
