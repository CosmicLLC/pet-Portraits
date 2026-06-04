// Pre-generate all 30 starter Pinterest pins as 1000×1500 PNGs.
//
// Reads the briefs encoded below (originally from
// docs/marketing/pinterest/30-starter-pins.md), renders each pin as a styled
// composite using Sharp + SVG text overlays, and writes the output PNGs +
// an upload-ready CSV to docs/marketing/pinterest/generated/.
//
// Usage:
//   node scripts/generate-pinterest-pins.mjs
//
// The companion CSV has the Pinterest-format columns (title, description,
// link, alt text) so you can bulk-upload via Tailwind or Pinterest's batch
// uploader without touching the studio admin tool 30 times.

import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SAMPLES_DIR = path.join(ROOT, "public", "examples");
const OUT_DIR = path.join(ROOT, "docs", "marketing", "pinterest", "generated");

const W = 1000;
const H = 1500;

// Brand palette
const CREAM = "#FAF7F2";
const GREEN = "#2D4A3E";
const GOLD = "#C9A671";

// Style key → sample file in public/examples/
const STYLE_FILE = {
  watercolor: "watercolor.png",
  oil: "oil.png",
  renaissance: "renaissance.png",
  lineart: "lineart.png",
};

// On-pin display title is shorter than the Pinterest SEO title — punchier
// hook for the visual scroll-stop. The full Pinterest title still goes in
// the upload metadata CSV for SEO.
const PINS = [
  // ─── Renaissance Pet Portraits (5) ─────────────────────────────────────
  {
    n: 1, board: "Renaissance Pet Portraits",
    seoTitle: "Renaissance Pet Portrait — Turn Your Dog Into a 17th Century Oil Painting",
    description: "Custom Renaissance pet portraits in the style of Rembrandt and Vermeer. Upload one photo, see a 30-second preview free, then download or order framed. Watercolor, oil, and line art styles available. Loved by 487 verified reviewers. #renaissancepetportrait #custompetportrait #petportraitart #dogwallart #petartgift",
    altText: "Golden retriever painted in dramatic Renaissance oil style, wearing a dark velvet doublet with white lace collar, deep chiaroscuro lighting against a moody brown background, museum-quality framed print hanging above a console table.",
    url: "/styles/renaissance-pet-portrait",
    style: "renaissance",
    eyebrow: "RENAISSANCE PORTRAITS",
    titleA: "Your dog as a", titleB: "17th-century oil painting",
    tagline: "Preview free in 30 seconds",
  },
  {
    n: 2, board: "Renaissance Pet Portraits",
    seoTitle: "How to Make a Renaissance Portrait of Your Pet From One Phone Photo",
    description: "A step-by-step look at turning a regular pet photo into a museum-style Renaissance portrait. Upload, pick a style, preview in 30 seconds. Digital download $6, framed print $79 with US shipping in 3-5 days. #renaissanceart #petportraitstudio #customdogart #oldmasterstyle #dogportraitpainting",
    altText: "Side-by-side comparison showing an iPhone snapshot of a black pug on the left and a finished Renaissance oil painting of the same pug in royal blue robes on the right, with arrows between them.",
    url: "/styles/renaissance-pet-portrait",
    style: "renaissance",
    eyebrow: "FROM PHONE TO PAINTING",
    titleA: "How to turn one photo", titleB: "into a Renaissance portrait",
    tagline: "30 seconds. No signup.",
  },
  {
    n: 3, board: "Renaissance Pet Portraits",
    seoTitle: "5 Renaissance Pet Portrait Ideas That Look Like Real Museum Paintings",
    description: "Five Renaissance pet portrait directions inspired by Vermeer, Rembrandt, and Holbein. Includes the \"Girl With a Pearl Earring\" treatment, the noble hunter pose, and the formal courtly portrait. See your pet rendered in any of them. #renaissancepetportrait #vermeer #rembrandt #petartideas #classicalportrait",
    altText: "Grid of five Renaissance pet portrait variations — a tabby cat as Girl With a Pearl Earring, a beagle in a hunting jerkin, a corgi in courtly robes, a husky in armor, and a poodle in lace ruff. Cream parchment background.",
    url: "/styles/renaissance-pet-portrait",
    style: "renaissance",
    eyebrow: "FIVE PORTRAIT IDEAS",
    titleA: "Pet portraits that", titleB: "look like museum art",
    tagline: "Vermeer, Rembrandt, Holbein",
  },
  {
    n: 4, board: "Renaissance Pet Portraits",
    seoTitle: "Custom Oil Painting of Your Dog in the Style of the Old Masters",
    description: "Renaissance-style oil portraits painted from your pet photo. Deep glazes, classical pose, museum aesthetic. Preview free, no signup. Add a custom frame and ship in under a week. Memorial portraits available with a gentle approach. #oilpaintingdog #renaissancedog #custompetart #dogoilpainting #petportraitcommission",
    altText: "Chocolate labrador rendered in classical oil painting style, three-quarter pose with one paw resting on a leather-bound book, draped burgundy curtain in the background, soft golden side-light.",
    url: "/styles/oil-painting-pet-portrait",
    style: "oil",
    eyebrow: "OIL PAINTING STYLE",
    titleA: "Your dog in the style", titleB: "of the Old Masters",
    tagline: "Free preview · Ships 3-5 days",
  },
  {
    n: 5, board: "Renaissance Pet Portraits",
    seoTitle: "Renaissance Cat Portraits — Tabby, Tuxedo and Calico in Period Costume",
    description: "Cats wearing Tudor ruffs, velvet capes, and pearl chokers, rendered like 16th century court paintings. Pick from four styles and four sizes. Cats only — this collection is cat-specific. #renaissancecat #catportrait #catart #tudorcat #customcatpainting",
    altText: "Three Renaissance cat portraits in a triptych — a tabby in a starched white ruff, a tuxedo cat in a black velvet cape with gold chain, and a calico wearing a pearl choker against deep teal velvet drapes.",
    url: "/styles/renaissance-pet-portrait",
    style: "renaissance",
    eyebrow: "RENAISSANCE CATS",
    titleA: "Tabbies in ruffs.", titleB: "Tuxedos in capes.",
    tagline: "Period costume. Real cats.",
  },

  // ─── Royal Dog Portraits (4) ───────────────────────────────────────────
  {
    n: 6, board: "Royal Dog Portraits",
    seoTitle: "Royal Dog Portrait Ideas — Crowns, Capes and Coronation Robes",
    description: "Playful Renaissance-meets-royalty portraits of dogs wearing the full coronation kit. Ermine cape, gold crown, scepter optional. The internet's silliest take on classical portraiture, taken very seriously. #royaldogportrait #dogincrown #funnydogart #regaldogportrait #kingdogart",
    altText: "French bulldog wearing a tall gold crown and red ermine-trimmed cape, posed on a velvet throne with a tiny scepter resting against one paw, gold drape background, dramatic spotlight.",
    url: "/styles/renaissance-pet-portrait",
    style: "renaissance",
    eyebrow: "ROYAL DOG PORTRAITS",
    titleA: "Crown. Cape.", titleB: "Coronation robes.",
    tagline: "The internet's silliest classics",
  },
  {
    n: 7, board: "Royal Dog Portraits",
    seoTitle: "Turn Your Dog Into a King — Custom Royal Portrait From One Photo",
    description: "Upload a regular photo of your dog, get back a fully regal coronation portrait with crown, robe and palace backdrop. Free preview, no signup. Framed prints ship in 3-5 days. Bring the dignity your dog has always demanded. #royaldogart #regalpet #dogportrait #funnydoggift #customdogart",
    altText: "Side-by-side of a yellow lab — left frame the dog mid-yawn on a couch, right frame the same dog as a regal monarch in a jeweled crown, ermine cape, holding a scepter, against a palace interior.",
    url: "/styles/renaissance-pet-portrait",
    style: "renaissance",
    eyebrow: "ROYAL TRANSFORMATION",
    titleA: "Turn your dog", titleB: "into a king",
    tagline: "One photo. Full regalia.",
  },
  {
    n: 8, board: "Royal Dog Portraits",
    seoTitle: "Queen of the House — Royal Portrait Ideas for Dog Moms",
    description: "A regal portrait that captures who actually runs the household. Tiara, pearls, jeweled collar, palace setting. Looks great above the fireplace, looks even better when guests do a double take. #queendog #royalpetportrait #dogmomart #regaldoggy #petportraitfunny",
    altText: "Miniature schnauzer in a delicate silver tiara and triple-strand pearl necklace, seated regally on a crimson cushion with palace columns and chandelier behind her.",
    url: "/gifts/dog-mom-gift",
    style: "renaissance",
    eyebrow: "FOR THE DOG MOM",
    titleA: "Queen", titleB: "of the house",
    tagline: "Tiara. Pearls. Palace background.",
  },
  {
    n: 9, board: "Royal Dog Portraits",
    seoTitle: "Funny Royal Dog Art for People Who Take Their Pets Too Seriously",
    description: "Coronation portraits, knighting ceremonies, royal hunt scenes — all starring your dog. The joke is the dignity. Available as a $6 digital download or $79 framed print. #funnydogposter #royaldoghumor #dogwallart #petartfunny #customdogportrait",
    altText: "Three-panel comic gallery — a corgi being knighted with a sword, a dachshund signing a royal decree with a quill, and a great dane on horseback leading a royal hunt, all in oil painting style.",
    url: "/styles/oil-painting-pet-portrait",
    style: "oil",
    eyebrow: "ROYAL DOG HUMOR",
    titleA: "Knighting ceremonies", titleB: "Royal hunts. Decrees.",
    tagline: "The joke is the dignity",
  },

  // ─── Custom Cat Art Gift Ideas (3) ─────────────────────────────────────
  {
    n: 10, board: "Custom Cat Art Gift Ideas",
    seoTitle: "Custom Cat Portrait Ideas — Watercolor, Oil and Line Art Styles",
    description: "Cat-only portraits in four hand-painted styles. Watercolor for soft and dreamy, oil for moody and rich, line art for clean and modern, Renaissance for full drama. Made from your photo in 30 seconds. #customcatportrait #catart #catlovergift #catmomgift #catpainting",
    altText: "Four-panel composite of the same orange tabby rendered in four art styles — loose watercolor, dark oil painting, single-line continuous drawing, and Renaissance portrait — arranged in a 2x2 grid.",
    url: "/",
    style: "watercolor",
    eyebrow: "CUSTOM CAT PORTRAITS",
    titleA: "Your cat,", titleB: "four ways.",
    tagline: "Watercolor · Oil · Line · Renaissance",
  },
  {
    n: 11, board: "Custom Cat Art Gift Ideas",
    seoTitle: "Best Gifts for Cat Lovers Who Already Own Everything",
    description: "Custom portraits of their actual cat in their actual favorite art style. Personal, specific, and the only cat gift that can't be duplicated. Digital download $6 or framed print $79. Ships in 3-5 days US. #catlovergiftideas #catmom #catportraitgift #catart #personalizedcatgift",
    altText: "A framed watercolor portrait of a gray Russian blue cat hanging in a sunlit reading nook, beside a stack of books, a coffee mug and a sleeping real-life cat curled on the windowsill.",
    url: "/styles/watercolor-pet-portrait",
    style: "watercolor",
    eyebrow: "CAT LOVER GIFTS",
    titleA: "For the cat lover", titleB: "who has everything.",
    tagline: "Their actual cat. Their actual style.",
  },
  {
    n: 12, board: "Custom Cat Art Gift Ideas",
    seoTitle: "Why a Custom Portrait Is the Cat Gift That Actually Gets Hung Up",
    description: "Most cat gifts end up in a drawer. A portrait of their cat doesn't. Specific, framed, ready to display. Four art styles, four sizes, no subscription. Preview in 30 seconds before paying anything. #catportrait #catwallart #cathomedecor #catlover #catartgift",
    altText: "A black cat watercolor portrait in a thin gold frame mounted on a sage green wall above a mid-century sideboard, with a small ceramic vase and a single trailing pothos vine beside it.",
    url: "/styles/watercolor-pet-portrait",
    style: "watercolor",
    eyebrow: "CAT WALL ART",
    titleA: "The cat gift", titleB: "that actually gets hung up.",
    tagline: "Specific. Framed. Display-ready.",
  },

  // ─── Pet Memorial Art (4) — gentle tone, no exclamation, no urgency ───
  {
    n: 13, board: "Pet Memorial Art",
    seoTitle: "Pet Memorial Portrait Ideas in a Quiet, Painterly Style",
    description: "A soft, hand-painted way to keep a pet's memory close. Watercolor and oil styles work especially well for memorial portraits. Made carefully from any photo you have, including older or lower-resolution images. #petmemorial #petmemorialart #petlossart #petportrait #remembermypet",
    altText: "A soft watercolor portrait of an elderly golden retriever resting peacefully, gentle light from the left, neutral cream background, displayed in a thin natural-wood frame on a quiet shelf with a single white flower.",
    url: "/memorial",
    style: "watercolor",
    eyebrow: "MEMORIAL PORTRAITS",
    titleA: "A quiet way", titleB: "to keep them close.",
    tagline: "Watercolor. Oil. Made carefully.",
  },
  {
    n: 14, board: "Pet Memorial Art",
    seoTitle: "A Gentle Watercolor Portrait to Remember a Pet By",
    description: "Watercolor is forgiving with older photos and feels less formal than a traditional oil portrait. The studio works with whatever image you have. There is no rush, and you can preview the portrait before deciding anything. #petmemorial #watercolorportrait #petremembrance #memorialart #petlosssupport",
    altText: "A loose watercolor study of a tabby cat curled in a sunbeam, painted in warm muted ochres and soft grays with deliberate paper texture showing through, untouched white space around the figure.",
    url: "/memorial",
    style: "watercolor",
    eyebrow: "WATERCOLOR MEMORIAL",
    titleA: "Gentle.", titleB: "Painterly. Quiet.",
    tagline: "Older photos welcome.",
  },
  {
    n: 15, board: "Pet Memorial Art",
    seoTitle: "Keeping a Pet's Memory in the Home — Quiet Portrait Ideas",
    description: "A small framed portrait on a bookshelf, a print in a hallway, a soft watercolor on a bedside table. A few quiet ways people choose to keep a pet present in the home, without making it a centerpiece. #petmemorialideas #petportrait #petremembrance #petloss #memorialportrait",
    altText: "A hallway shelf with a small framed watercolor portrait of a black labrador, a smooth gray river stone, a sprig of dried lavender, and a small candle, photographed in soft natural afternoon light.",
    url: "/memorial",
    style: "watercolor",
    eyebrow: "QUIET DISPLAY IDEAS",
    titleA: "A bookshelf.", titleB: "A hallway. A bedside.",
    tagline: "Quiet places they can rest.",
  },
  {
    n: 16, board: "Pet Memorial Art",
    seoTitle: "Older Photos Are Enough — Pet Memorial Portraits From Any Image",
    description: "Phone photos, scanned prints, blurry snapshots — most are workable. The painted style helps. If a photo isn't usable, the studio will say so before any payment. Watercolor, oil, line art, and Renaissance styles are all available for memorial portraits. #petmemorialportrait #petloss #petremembrance #memorialart #petportraitfromphoto",
    altText: "Reference photo and finished portrait pairing — a faded film snapshot of a chihuahua from years ago on the left, and a clean watercolor portrait of the same dog on the right, both displayed flat on a wooden table.",
    url: "/memorial",
    style: "oil",
    eyebrow: "ANY PHOTO WORKS",
    titleA: "Older photos", titleB: "are enough.",
    tagline: "Scanned. Faded. Workable.",
  },

  // ─── Dog Mom Gift Ideas (5) ─────────────────────────────────────────────
  {
    n: 17, board: "Dog Mom Gift Ideas",
    seoTitle: "Dog Mom Gift Ideas — Custom Portraits She'll Actually Hang Up",
    description: "The dog mom gift that doesn't end up in a drawer. Choose from watercolor, oil, Renaissance, or line art and see a free 30-second preview before paying. Digital from $6, framed print from $79, US shipping in 3-5 days. #dogmomgift #dogmomgiftideas #custompetportrait #dogmom #dogportraitgift",
    altText: "A bright kitchen scene with a framed watercolor portrait of a goldendoodle hanging above the coffee station, a mug reading \"Dog Mom\" and a leash on the counter, all in soft morning light.",
    url: "/gifts/dog-mom-gift",
    style: "watercolor",
    eyebrow: "DOG MOM GIFTS",
    titleA: "The dog mom gift", titleB: "that gets hung up.",
    tagline: "Not another mug.",
  },
  {
    n: 18, board: "Dog Mom Gift Ideas",
    seoTitle: "What to Get the Dog Mom Who Says She Doesn't Want Anything",
    description: "She probably means it — except for a portrait of her dog. Specific to her pet, framed, ready to hang. Four art styles. No subscription. Free preview before you pay. #giftsfordogmoms #dogmomlife #petportrait #dogloversgift #personalizeddoggift",
    altText: "An overhead flat lay of gift wrap, a brown paper-wrapped framed print with a small dog tag tied to the bow, a card reading \"for the dog mom,\" and a sprig of eucalyptus on a linen background.",
    url: "/gifts/dog-mom-gift",
    style: "watercolor",
    eyebrow: "GIFTS FOR DOG MOMS",
    titleA: "She says she", titleB: "doesn't want anything.",
    tagline: "Except this.",
  },
  {
    n: 19, board: "Dog Mom Gift Ideas",
    seoTitle: "Mother's Day Gift Ideas for Dog Moms — Custom Pet Portraits",
    description: "A custom watercolor or oil portrait of her dog, ordered from your phone, delivered framed. Free preview in 30 seconds. Digital download arrives same day. Framed prints ship in 3-5 days in the US. #mothersdaygift #dogmomgift #petportrait #mothersdayideas #custompetart",
    altText: "A small jewelry-style gift box sitting on a kitchen counter beside a coffee mug, with a phone screen propped against the box showing a finished watercolor portrait of a corgi as a preview.",
    url: "/gifts/mothers-day",
    style: "watercolor",
    eyebrow: "MOTHER'S DAY GIFTS",
    titleA: "The Mother's Day gift", titleB: "for the dog mom.",
    tagline: "Order from your phone.",
  },
  {
    n: 20, board: "Dog Mom Gift Ideas",
    seoTitle: "Birthday Gift Ideas for the Dog Mom in Your Life",
    description: "A framed portrait of her actual dog, in her favorite art style. Watercolor for soft and pretty, line art for minimalist, oil for dramatic, Renaissance for absurd in the best way. Four sizes. #birthdaygiftideas #dogmombirthday #petportrait #birthdaygiftforher #personalizedgift",
    altText: "A small birthday cake with a single candle on a table next to a framed line art portrait of a beagle, a \"happy birthday\" card, and a bouquet of pink peonies in a glass jar.",
    url: "/gifts/birthday",
    style: "lineart",
    eyebrow: "BIRTHDAY GIFTS",
    titleA: "Her dog.", titleB: "Her favorite style.",
    tagline: "Framed. Specific. Personal.",
  },
  {
    n: 21, board: "Dog Mom Gift Ideas",
    seoTitle: "Minimalist Line Art Dog Portrait — Modern Gift for the Dog Mom",
    description: "A single continuous line drawing of her dog. Clean, modern, fits any wall. Pairs especially well with neutral interiors and gallery walls. Digital download $6, framed print $79. #lineartdog #minimalistdogart #dogmomgift #moderndogportrait #dogwallart",
    altText: "A black single-line continuous drawing of a whippet on a white background, mounted in a thin black frame, hanging on a warm white wall above a low oak credenza with a ceramic vase.",
    url: "/styles/line-art-pet-portrait",
    style: "lineart",
    eyebrow: "MINIMALIST LINE ART",
    titleA: "One continuous line.", titleB: "Their dog.",
    tagline: "Modern. Clean. Hangable anywhere.",
  },

  // ─── Watercolor Pet Paintings (4) ──────────────────────────────────────
  {
    n: 22, board: "Watercolor Pet Paintings",
    seoTitle: "Custom Watercolor Pet Portraits From a Photo You Already Have",
    description: "Soft, hand-painted watercolor portraits of dogs, cats and other pets. Made from any clear photo. Free 30-second preview before you decide anything. Digital download $6, framed print $79, ships in 3-5 days US. #watercolorpetportrait #custompetportrait #watercolordog #watercolorcat #petart",
    altText: "A loose watercolor portrait of a King Charles spaniel with soft peach and gray washes, paper texture visible at the edges, set against an off-white background with one stem of dried wildflower beside the frame.",
    url: "/styles/watercolor-pet-portrait",
    style: "watercolor",
    eyebrow: "WATERCOLOR PORTRAITS",
    titleA: "From the photo", titleB: "you already have.",
    tagline: "Soft. Painterly. Custom.",
  },
  {
    n: 23, board: "Watercolor Pet Paintings",
    seoTitle: "What Makes a Good Watercolor Pet Portrait — Tips and Examples",
    description: "Watercolor works best with strong silhouettes, soft natural light, and a simple background. A breakdown of which pet photos translate well, which need cropping, and which are better in oil or line art. #watercolorpaintingtips #watercolordogportrait #petportraittips #watercolorart #petart",
    altText: "An educational grid showing four pet photos with red and green checkmarks indicating which translate well to watercolor — a backlit dog with green check, a dark indoor cat with red x, a tabby in window light with green check, a blurry action shot with red x.",
    url: "/styles/watercolor-pet-portrait",
    style: "watercolor",
    eyebrow: "WHAT WORKS, WHAT DOESN'T",
    titleA: "Which photos make", titleB: "a good watercolor?",
    tagline: "A quick guide.",
  },
  {
    n: 24, board: "Watercolor Pet Paintings",
    seoTitle: "Watercolor Cat Portrait Ideas — Tabbies, Tuxedos, Calicos",
    description: "Watercolor handles cat fur patterns beautifully. Tabby stripes, tuxedo contrast and calico patches all come through soft and painterly. Cat-specific examples in four sizes and four frame options. #watercolorcat #catportrait #catart #watercolorcatpainting #catwallart",
    altText: "A horizontal triptych of watercolor cat portraits — a marmalade tabby with stripe detail, a tuxedo cat with sharp black-white contrast, and a calico in cream, ginger and gray patches, each on warm-white paper.",
    url: "/styles/watercolor-pet-portrait",
    style: "watercolor",
    eyebrow: "WATERCOLOR CATS",
    titleA: "Tabby. Tuxedo.", titleB: "Calico.",
    tagline: "Fur patterns in soft washes.",
  },
  {
    n: 25, board: "Watercolor Pet Paintings",
    seoTitle: "Watercolor Dog Portrait Ideas for a Gallery Wall",
    description: "Watercolor pet portraits hang well next to botanical prints, family photos and other paper-based art. Examples of gallery wall arrangements with one, two and three pet portraits mixed in. #gallerywall #watercolordog #petportraitart #homedecorideas #dogwallart",
    altText: "A gallery wall above a linen sofa featuring three watercolor dog portraits in mixed frame sizes alongside a pressed fern print and a small landscape, hung asymmetrically on a soft white wall.",
    url: "/styles/watercolor-pet-portrait",
    style: "watercolor",
    eyebrow: "GALLERY WALL IDEAS",
    titleA: "Watercolor dogs", titleB: "on the gallery wall.",
    tagline: "Pairs with botanicals + family photos.",
  },

  // ─── Pet Wedding Portraits (2) ─────────────────────────────────────────
  {
    n: 26, board: "Pet Wedding Portraits",
    seoTitle: "Pet Wedding Portrait Ideas When Your Dog Can't Be at the Ceremony",
    description: "Custom portraits of your dog or cat in formal wedding-day style — soft watercolor, classic oil or fine line art. Print on the welcome sign, the seating chart, or the thank-you cards. Free 30-second preview. #petweddingportrait #weddingdog #weddingideas #dogofhonor #customweddingart",
    altText: "A wedding welcome sign on a wooden easel at a garden ceremony, featuring a watercolor portrait of a black labrador wearing a small floral collar, framed by white peonies and trailing greenery.",
    url: "/styles/watercolor-pet-portrait",
    style: "watercolor",
    eyebrow: "PET WEDDING PORTRAITS",
    titleA: "When your dog", titleB: "can't be at the ceremony.",
    tagline: "On the sign. On the cards.",
  },
  {
    n: 27, board: "Pet Wedding Portraits",
    seoTitle: "Including Your Dog in the Wedding — Portrait Sign and Stationery Ideas",
    description: "Ways to feature a pet who can't be there in person: a portrait on the program, a sketched portrait above the bar, an oil-style print as a guestbook accent. Digital download in any size from $6. #petsinweddings #weddingsignage #weddingstationery #dogweddingideas #petportrait",
    altText: "A flat lay of wedding stationery on cream linen — invitation, RSVP card, table number and bar menu, each featuring a small line art drawing of the couple's golden retriever in the top corner.",
    url: "/styles/line-art-pet-portrait",
    style: "lineart",
    eyebrow: "WEDDING STATIONERY",
    titleA: "Include your dog", titleB: "in every detail.",
    tagline: "Programs. Menus. Signage.",
  },

  // ─── Funny Dog Posters (3) ─────────────────────────────────────────────
  {
    n: 28, board: "Funny Dog Posters",
    seoTitle: "Funny Dog Posters for the Living Room — Renaissance Pet Portraits",
    description: "Your dog as a Renaissance noble, an 18th century admiral, or a bored aristocrat. Hangs straight, ages well, gets a reaction from every guest. Digital download $6, framed print $79. #funnydogposter #renaissancedog #dogwallart #funnypetart #livingroomdecor",
    altText: "A framed Renaissance-style portrait of a pug dressed as an 18th century admiral with bicorn hat and gold-braided coat, hanging in a wood-paneled living room above a leather chesterfield sofa.",
    url: "/styles/renaissance-pet-portrait",
    style: "renaissance",
    eyebrow: "FUNNY DOG POSTERS",
    titleA: "Your dog as", titleB: "an 18th-century admiral.",
    tagline: "Played completely straight.",
  },
  {
    n: 29, board: "Funny Dog Posters",
    seoTitle: "Is a Renaissance Dog Portrait a Real Gift Idea? Yes, and Here's Why",
    description: "A formal oil-style portrait of someone's dog dressed as a 17th century noble is genuinely funnier the longer it hangs there. People show it to every guest for years. Four styles available. #funnygift #renaissancedog #funnydogportrait #conversationpiece #customdogart",
    altText: "A french bulldog rendered in formal Renaissance oil style wearing a starched white ruff and dark velvet doublet, with one paw resting on a velvet pillow, displayed in a heavy gold ornate frame against a navy wall.",
    url: "/styles/oil-painting-pet-portrait",
    style: "oil",
    eyebrow: "CONVERSATION PIECE",
    titleA: "Funnier the longer", titleB: "it hangs there.",
    tagline: "Shown to every guest. For years.",
  },
  {
    n: 30, board: "Funny Dog Posters",
    seoTitle: "Funny Dog Wall Art Ideas for the Bathroom, Office and Bar Cart",
    description: "A small framed oil portrait of your dog above the bar cart. A line art print of your dog in the powder room. A Renaissance pug behind your desk. Three spots people don't think to decorate, three easy wins. #funnydogart #dogwallart #homedecorideas #petposter #funnyhomedecor",
    altText: "A horizontal triptych of three home settings — a bar cart with a tiny framed oil portrait of a corgi, a powder room with a line art dachshund print, and a home office with a Renaissance pug portrait above the desk.",
    url: "/",
    style: "oil",
    eyebrow: "UNEXPECTED PLACES",
    titleA: "Bar cart.", titleB: "Powder room. Office.",
    tagline: "Three spots you forget to decorate.",
  },
];

// ─── Renderer ──────────────────────────────────────────────────────────────

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildOverlaySvg(spec) {
  const eyebrow = escapeXml(spec.eyebrow);
  const titleA = escapeXml(spec.titleA);
  const titleB = escapeXml(spec.titleB);
  const tagline = escapeXml(spec.tagline);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${GREEN}" stop-opacity="0.0"/>
        <stop offset="35%" stop-color="${GREEN}" stop-opacity="0.0"/>
        <stop offset="65%" stop-color="${GREEN}" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="${GREEN}" stop-opacity="0.92"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>

    <!-- Eyebrow -->
    <text x="60" y="1100"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="22" font-weight="700"
      fill="${GOLD}" letter-spacing="4">${eyebrow}</text>

    <!-- Title line A -->
    <text x="60" y="1190"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="68" font-weight="700"
      fill="${CREAM}" letter-spacing="-1">${titleA}</text>

    <!-- Title line B -->
    <text x="60" y="1270"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="68" font-weight="700"
      fill="${CREAM}" letter-spacing="-1">${titleB}</text>

    <!-- Tagline -->
    <text x="60" y="1340"
      font-family="Helvetica, Arial, sans-serif"
      font-size="26"
      fill="${CREAM}" opacity="0.88">${tagline}</text>

    <!-- URL bar -->
    <text x="60" y="1430"
      font-family="Helvetica, Arial, sans-serif"
      font-size="22" font-weight="700"
      fill="${CREAM}" opacity="0.85" letter-spacing="2">pawmasterpiece.com</text>
  </svg>`;
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 55);
}

async function renderPin(spec) {
  const samplePath = path.join(SAMPLES_DIR, STYLE_FILE[spec.style]);
  const sampleBuf = await fs.readFile(samplePath);

  // Cover-resize the sample image to fill 1000×1500 (will crop horizontally
  // or vertically as needed). Most style examples are square so this places
  // them centered with some crop on top/bottom.
  const baseImage = await sharp(sampleBuf)
    .resize(W, H, { fit: "cover", position: "centre" })
    .toBuffer();

  const overlaySvg = Buffer.from(buildOverlaySvg(spec));

  return sharp(baseImage)
    .composite([{ input: overlaySvg }])
    .png({ quality: 92 })
    .toBuffer();
}

function csvEscape(s) {
  if (s == null) return "";
  const v = String(s);
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`Rendering ${PINS.length} pins → ${OUT_DIR}`);

  const baseUrl = "https://pawmasterpiece.com";
  const csvLines = [
    [
      "pin_number",
      "board",
      "filename",
      "title",
      "description",
      "destination_url",
      "alt_text",
    ]
      .map(csvEscape)
      .join(","),
  ];

  for (const spec of PINS) {
    const slug = slugify(spec.seoTitle);
    const filename = `${String(spec.n).padStart(2, "0")}-${slug}.png`;
    const filePath = path.join(OUT_DIR, filename);

    const png = await renderPin(spec);
    await fs.writeFile(filePath, png);

    csvLines.push(
      [
        spec.n,
        spec.board,
        filename,
        spec.seoTitle,
        spec.description,
        baseUrl + spec.url,
        spec.altText,
      ]
        .map(csvEscape)
        .join(",")
    );

    console.log(`  ✓ ${filename}`);
  }

  const csvPath = path.join(OUT_DIR, "_upload-batch.csv");
  await fs.writeFile(csvPath, csvLines.join("\n"));
  console.log(`\nWrote upload CSV → ${csvPath}`);
  console.log(`\nDone. Upload to Pinterest manually or batch via Tailwind.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
