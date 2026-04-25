// Source of truth for all blog content. Each entry renders at /blog/[slug]
// and is included in the sitemap automatically. Add a new post by appending
// here — no other code changes needed.
//
// Body is HTML (not MDX) to keep the bundle small and avoid a markdown
// pipeline. Use <h2>, <p>, <ul>, <a>, and inline <strong>/<em>. Anchor
// internal links with absolute paths (e.g. /gifts/mothers-day) so SEO and
// the sitemap stay in sync.

export interface BlogPost {
  slug: string;
  title: string;
  description: string; // <meta description> + listing snippet
  publishedAt: string; // ISO date
  updatedAt?: string;
  // Lucide-style focus keywords used in the post page metadata.
  keywords: string[];
  // Hero image displayed on the post + listing. Reuse style examples until
  // we have proper post hero photography.
  heroImage: string;
  heroAlt: string;
  // Internal links to surface in a CTA panel at the end of the post.
  ctaLinks: { href: string; label: string }[];
  // Estimated read time in minutes — computed once at author time.
  readMinutes: number;
  // HTML body. Wrap any quotes/specials in &ldquo;/&rdquo; and use ' as raw.
  body: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "last-minute-mothers-day-gifts-for-pet-moms",
    title: "Last-Minute Mother's Day Gifts for Pet Moms (Digital + Fast Ship)",
    description:
      "Forgot Mother's Day? Here's the realistic timeline of what still lands on time — instant digital portraits, fast-ship canvases, and the printable card that fixes everything.",
    publishedAt: "2026-04-24",
    keywords: [
      "last minute mothers day gift",
      "mothers day gift ships fast",
      "digital mothers day gift",
      "instant mothers day gift",
      "last minute pet mom gift",
    ],
    heroImage: "/examples/watercolor.png",
    heroAlt: "Watercolor pet portrait — instant digital download for last-minute Mother's Day gift",
    ctaLinks: [
      { href: "/gifts/mothers-day", label: "Shop Mother's Day portraits" },
      { href: "/", label: "Preview your portrait — 30 seconds" },
    ],
    readMinutes: 4,
    body: `
<p>It's the week of Mother's Day. You don't have a gift. You're considering, in this order: Amazon Prime same-day delivery, a gift card, and panic-buying flowers from the gas station.</p>

<p>Pause. The honest math on each option below, plus a category that's been quietly winning the last-minute gift game for the last two years: instant digital pet portraits that arrive by email in 30 seconds and can be printed at any local print shop the morning of.</p>

<h2>How late is too late?</h2>

<p>The cutoffs that actually matter, ordered most to least urgent:</p>

<ul>
<li><strong>Anything that ships physical:</strong> last day to order with standard shipping is May 3 (USPS standard takes 3–5 business days for Mother's Day delivery). May 5 with Priority. May 7 with overnight (~$30+). After that, you're paying more for shipping than the gift.</li>
<li><strong>Florists:</strong> day-of delivery is fine but most order books close 24 hours ahead. Late on May 9 you'll be limited to whatever the grocery store has.</li>
<li><strong>Digital gifts:</strong> they don't ship. Order Sunday morning, deliver Sunday morning. The clock doesn't matter.</li>
</ul>

<p>If you're reading this on May 8 or later, the only categories that still feel personal are: digital downloads, gift cards (with care), and printable cards. Everything else is going to arrive Tuesday wrapped in a passive-aggressive shipping label.</p>

<h2>Same-day digital pet portraits</h2>

<p>This is the category we know best, so we'll be direct: a custom watercolor or oil painting of her pet, generated in 30 seconds from any phone photo, emailed to her on Mother's Day morning, is the gift that wins last-minute. Three reasons:</p>

<p><strong>1. The reaction beats anything else.</strong> A digital portrait of her dog or cat hits an emotional note that a gift card or a delivery delay can't. We've watched people cry over a $6 file emailed at 8am Mother's Day morning.</p>

<p><strong>2. She can print it instantly.</strong> CVS, Walgreens, FedEx Office, and any local frame shop will print and frame an emailed file the same day. Most have curbside pickup. So she gets the digital reveal AND a physical thing for the wall, all on Mother's Day.</p>

<p><strong>3. It pairs perfectly with a follow-up canvas.</strong> The on-the-day surprise plus a framed canvas that arrives Tuesday is, statistically, our highest-rated gift configuration. Two arrivals, one perfect gift, half the panic.</p>

<p>Our digital download is $6. Preview is free in 30 seconds. <a href="/">Upload her pet's photo here</a> and pick the style.</p>

<h2>Printable gifts she can hang today</h2>

<p>Anything that exists as a digital file you can email and she can print local: art prints, custom illustrations, photo collages, a personalized "year in pictures" PDF if you have an iPhone Memories album you can export. The throughline: <em>the file is the gift; the printing is downstream</em>.</p>

<p>Beware: a generic printable from Etsy that says "World's Best Mom" in calligraphy is not the same gift as a custom portrait of her dog. The personalization is what makes it work.</p>

<h2>The "two-arrival" play</h2>

<p>For pet moms specifically, here's the move that consistently lands harder than a single gift: order both the digital download AND the framed canvas in the same checkout. Email her the digital file Sunday morning. The canvas ships Monday and arrives Tuesday or Wednesday.</p>

<p>The Sunday email is the emotional moment. The Tuesday arrival is the surprise reinforcement. She gets two reactions for one gift, and you get the cover of "I planned this for weeks" because of course you did. (You didn't. We won't tell.)</p>

<p>Through Mother's Day 2026, our orders also include a <strong>FREE 11×14 display print</strong> automatically. So even the $6 digital includes a physical art piece on her wall — at no extra cost. <a href="/gifts/mothers-day">Details on the offer page.</a></p>

<h2>Gift cards done right (if you absolutely must)</h2>

<p>Gift cards are usually the worst possible last-minute gift, but they CAN work if framed correctly:</p>

<ul>
<li><strong>Specificity beats amount.</strong> A $50 gift card to a local pet store with "I noticed she's been wanting a new bed" beats a $200 Amazon card.</li>
<li><strong>Pair with a handwritten note that names the pet.</strong> "For Charlie's spa day" lands. "Happy Mother's Day" alone doesn't.</li>
<li><strong>Avoid printable PDF gift cards.</strong> They scream last-minute. A real card she opens, with a real handwritten note, is what makes a gift card work.</li>
</ul>

<h2>Backup: the printable card move</h2>

<p>If even ordering a digital portrait feels like too much, here's the absolute floor option: write a real handwritten card. Address it from her pet ("Dear Mom, this year I learned how to ring the bell when I want to go out. I love you. Love, Charlie"). Pair it with anything — a single grocery-store flower, a box of her favorite tea, nothing at all.</p>

<p>Pet moms care about the noticing more than the spending. A card that takes the dog seriously is sometimes the gift that makes her cry hardest.</p>

<h2>Deadlines, in plain English</h2>

<ul>
<li><strong>By May 3:</strong> order anything you want shipped. Canvas / framed prints / mounted prints / cards.</li>
<li><strong>By May 7:</strong> upgrade to Priority Mail if you missed May 3.</li>
<li><strong>May 8–10:</strong> digital downloads only. They arrive in 30 seconds. <a href="/">Start here.</a></li>
<li><strong>Sunday morning May 10:</strong> last call. You can still buy a digital portrait, write the card, frame it at CVS by noon. We've seen it work.</li>
</ul>

<p>You're going to be fine.</p>
`.trim(),
  },
  {
    slug: "mothers-day-gifts-for-cat-moms",
    title: "12 Mother's Day Gifts for Cat Moms (That Aren't Just Another Mug)",
    description:
      "She has eleven cat-themed mugs. She doesn't need a twelfth. Here's what cat moms actually want for Mother's Day — including the one gift category that consistently makes them cry.",
    publishedAt: "2026-04-24",
    keywords: [
      "mothers day gifts for cat moms",
      "cat mom gift ideas",
      "gifts for cat lovers mothers day",
      "cat mom mothers day",
      "best gift cat mom",
    ],
    heroImage: "/examples/oil.png",
    heroAlt: "Oil painting cat portrait — Mother's Day gift example",
    ctaLinks: [
      { href: "/pet-portraits/cats", label: "Shop cat portraits" },
      { href: "/gifts/mothers-day", label: "All Mother's Day gifts" },
    ],
    readMinutes: 5,
    body: `
<p>The cat mom in your life has — and we're being conservative here — eleven mugs that say "Crazy Cat Lady." She has a tote with a cartoon cat on it. She has socks. She has earrings. She has a doormat.</p>

<p>What she doesn't have: a real piece of art that takes her cat seriously.</p>

<p>Cat moms get a worse selection of gifts than dog moms, statistically. Walk through any gift shop and the dog-themed section has framed prints, embroidered linens, leather goods. The cat section has costume t-shirts. It's an injustice. Mother's Day is the year you fix it.</p>

<h2>Why cat moms are harder to shop for than dog moms</h2>

<p>Three reasons, all fixable:</p>

<p><strong>1. Cat-themed merch tends toward kitsch.</strong> Cartoon cats, cat puns, "purrfect" anything. Dog-themed merch has migrated upmarket over the last decade — cat merch is still mostly novelty store. Step around the kitsch entirely and shop the personalized-art category instead.</p>

<p><strong>2. Cats are harder to photograph.</strong> Moving targets, often hide, photograph poorly with overhead lights. Most "cat photos" people have on their phone are either far away, blurry, or the cat is asleep in a sunbeam doing nothing. <a href="/blog/how-to-photograph-your-pet-for-a-custom-portrait">Our photography guide</a> has tips, but for a portrait, even a phone-camera photo of a sleeping cat works fine — the artist captures the personality, not the photo quality.</p>

<p><strong>3. Multi-cat households complicate everything.</strong> If she has three cats, getting a gift "for the cats" usually means buying three of the same thing or an awkward shared gift. The right move is one gift that includes all of them — like a single portrait composed of all three pets together.</p>

<h2>The 12 (in priority order, with honest takes)</h2>

<p><strong>1. A custom oil painting or watercolor portrait of her cat.</strong> The category that consistently makes cat moms cry. A real piece of fine art on the wall, of <em>her</em> cat, not a generic illustrated cat. <a href="/pet-portraits/cats">Browse cat portrait styles.</a></p>

<p><strong>2. A Renaissance pet portrait.</strong> If she has a sense of humor about her cat being a tiny sociopath: get her a portrait of her cat in 16th-century royal robes with a white lace ruff collar. It's beautiful AND funny. Goes over fireplaces. Gets framed in heavy gold. <a href="/styles/renaissance-pet-portrait">See the Renaissance style.</a></p>

<p><strong>3. A line-art print of all her cats, composed together.</strong> Clean, modern, minimalist — works in apartments where wall space is precious. Single continuous line drawing in fine black ink on cream. Reads as designed, not novelty.</p>

<p><strong>4. A piece of jewelry with her cat's silhouette.</strong> A custom necklace from an actual jeweler (not Etsy mass-produced) that has a small silhouette of her cat. Etsy seller "Caitlyn Minimalist" does these well. Around $80–150.</p>

<p><strong>5. A high-quality cat tree she would actually want in her living room.</strong> Most cat trees look like dorm furniture. Tuft + Paw and Hauspanther make modernist cat furniture that doubles as design objects. ~$200–400 range.</p>

<p><strong>6. A massage / spa day for HER, not the cats.</strong> Cat moms tend to be over-givers. A treatment she has to receive (not "buy something for yourself") is the workaround.</p>

<p><strong>7. Catit Senses water fountain.</strong> If her cat is older, a circulating-water fountain is shockingly thoughtful — older cats hydrate better with running water. Practical gift that says "I noticed."</p>

<p><strong>8. A photo book of her cat from the last year.</strong> Not a generic photo book — a year-of-cat-photos. Use Chatbooks or Artifact Uprising. ~$40.</p>

<p><strong>9. A real piece of cat-friendly art from a working artist.</strong> Not a print from Society6. A real painting from someone whose Instagram you stalked for a week. Etsy is fine if you sort by "Best seller" + "shop established 2018+."</p>

<p><strong>10. A gift card to her local cat-only veterinarian.</strong> Niche but meaningful — vets are expensive and a $200 credit toward her cat's next visit lands as both practical AND emotional. Call ahead, most clinics handle gift cards privately.</p>

<p><strong>11. A donation in her cat's name to a local cat rescue.</strong> Pair with a small physical gift so she has something to open. Most rescues will send a personalized letter for ~$50.</p>

<p><strong>12. Another mug, but it has her cat's actual face on it.</strong> If you must do a mug, at least make it personal. We'll allow it.</p>

<h2>The "from the cat" angle</h2>

<p>Cards "signed by the cat" land harder than cards from you. Suggested wording:</p>

<ul>
<li>"Dear Mom, I know I bite you sometimes. It's because I love you. Happy Mother's Day. Love, Mr. Whiskers."</li>
<li>"Mom, I'm sorry about the rug. I'm not sorry. Thank you for everything else. Love, Penny."</li>
<li>"You're my favorite human. The other ones are fine. Love, Pickles."</li>
</ul>

<p>Pair with the portrait. The combination — handwritten card from the cat + framed portrait of the cat — is the move. Cat moms describe this combo as "the only Mother's Day gift that hit."</p>

<h2>What to skip</h2>

<ul>
<li>Anything that says "Cat Mom" in cursive script. She has it.</li>
<li>Cat-shaped candle holders. Dust collectors.</li>
<li>Cat-themed wine glasses. She drinks out of one mug — see above.</li>
<li>Generic Etsy "personalized" prints with cartoon cats.</li>
<li>Live plants. Cats eat them. Cat moms know which plants are toxic and you don't.</li>
</ul>

<p>Last note: Mother's Day is May 10 this year. Custom portraits ship in 3–5 business days inside the US. Order by <strong>May 3</strong> for the framed canvas; the digital download arrives in 30 seconds and can ship Mother's Day morning. <a href="/">Start her portrait here.</a></p>
`.trim(),
  },
  {
    slug: "mothers-day-gift-for-pet-mom-grieving",
    title: "Mother's Day Gifts for a Pet Mom Who Is Grieving",
    description:
      "How to acknowledge Mother's Day with a pet mom who recently lost a beloved animal — gentle gifts that comfort, words that help, and the one gift type to skip entirely.",
    publishedAt: "2026-04-24",
    keywords: [
      "mothers day gift pet loss",
      "memorial gift pet mom",
      "mothers day gift grieving pet owner",
      "pet bereavement gift",
      "memorial pet portrait mothers day",
    ],
    heroImage: "/examples/watercolor.png",
    heroAlt: "Watercolor memorial pet portrait — for a grieving pet mom on Mother's Day",
    ctaLinks: [
      { href: "/memorial", label: "About memorial portraits" },
      { href: "/gifts/mothers-day", label: "All Mother's Day options" },
    ],
    readMinutes: 4,
    body: `
<p>This post is for the people whose mom, sister, partner, or close friend lost a pet recently — within the last year, give or take — and they're now facing Mother's Day quietly devastated. They were a pet mom for years. They still are, even now. But the day will hit differently.</p>

<p>The instinct is often to skip it. Don't. Acknowledging the day is more important than getting the gift exactly right. Below: how to do that without making Mother's Day heavier than it already is.</p>

<h2>Acknowledge the day before doing anything else</h2>

<p>Send a short note the day BEFORE. Sunday morning is too late — they've already been bracing. Saturday afternoon, by text or in person:</p>

<blockquote>
<p>"Tomorrow is going to be hard. I'm thinking about you. Charlie was lucky to be loved by you. I love you."</p>
</blockquote>

<p>That's enough. You don't need a gift. You don't need to fix anything. The note alone, sent before they have to brace for the day, is the highest-value gesture you can offer.</p>

<p>If you're going to give a physical gift on top of the note, the rest of this post is about getting it right.</p>

<h2>Gift types that comfort</h2>

<p>The pattern: gifts that <em>honor</em> the pet without trying to replace them. Things that say "I see your love, and I see your loss" instead of "let's pretend everything is fine."</p>

<p><strong>1. A memorial portrait.</strong> A hand-finished watercolor or oil painting of the pet they lost. We have a <a href="/memorial">dedicated memorial funnel</a> with unlimited revisions, no countdown timers, no sales pressure — designed specifically for this moment. The portrait sits on a mantel or in a hallway and quietly says "they were here." Most grieving pet moms describe this as the gift that helped them most.</p>

<p><strong>2. A donation in the pet's name.</strong> To a rescue, a hospice for senior animals, the vet clinic that helped at the end. Most organizations send a beautiful letter that arrives a week later — a second touch beyond Mother's Day itself.</p>

<p><strong>3. A written letter.</strong> A real handwritten letter naming the pet. What you remember about them. Specific moments — the way they greeted you, what they were like as a puppy or kitten, the funny thing they did with the laundry. Grieving people read these many times.</p>

<p><strong>4. A piece of jewelry with the pet's name engraved.</strong> Subtle. A delicate bracelet, a small pendant. Avoid anything that looks like memorial jewelry — they don't need a daily reminder that announces grief publicly. They need something that's quietly there.</p>

<p><strong>5. A small frame with a favorite photo of the pet.</strong> If a full portrait feels too big, a 5×7 framed print of a candid photo of the pet they already loved is gentle and right.</p>

<h2>Gifts to skip entirely</h2>

<p><strong>Don't:</strong> get them another pet. Even if you're sure they want one. The right time to adopt is theirs, not yours, and a "surprise replacement" is a gift that often becomes a burden.</p>

<p><strong>Don't:</strong> send flowers if the pet was buried with flowers, or if the pet's death involved flowers in any way. (Lilies are toxic to cats and a common cause of accidental death — be careful with bouquet selection.)</p>

<p><strong>Don't:</strong> use phrases like "they're in a better place," "everything happens for a reason," or "at least they had a good life." Even when sincere, these flatten what they're feeling. Mirror their language. If they say "I miss her," you say "I know you miss her."</p>

<p><strong>Don't:</strong> minimize the gift because you think a pet death is "less" than a human one. To them, in this moment, it isn't. Treat the loss with the same gravity you would for any family member. The gift cost should match.</p>

<h2>Wording for the card</h2>

<p>If you write a card, here are templates that have worked for our customers:</p>

<blockquote>
<p>"Mother's Day is a hard day to be the mom of someone who's not here anymore. I'm thinking about you and Charlie today, and every day."</p>
</blockquote>

<blockquote>
<p>"You loved him so well. He knew. Happy Mother's Day."</p>
</blockquote>

<blockquote>
<p>"I know today is mostly grief. I want you to know I'm grateful you were her mom — she was the luckiest cat I ever met. Happy Mother's Day."</p>
</blockquote>

<p>Specific is better than generic. Use the pet's name. Reference one specific thing about them.</p>

<h2>When to give it</h2>

<p>Memorial gifts often land best the day BEFORE Mother's Day, not on the day itself. Sunday is when grief tends to peak. Saturday delivery means they have something to hold while bracing for Sunday. If shipping won't make it by Saturday, hand-deliver if you can.</p>

<p>If you're ordering a memorial portrait and Mother's Day is in less than a week, the digital file arrives in 30 seconds and can be printed locally that day. The framed canvas takes 3–5 business days — order by May 3 for Mother's Day morning delivery. <a href="/memorial">Start a memorial portrait here.</a></p>

<h2>And finally</h2>

<p>The pet mom in your life is having a different Mother's Day than most. The right gift is a quiet acknowledgment, named, specific, gentle. There is no perfect way to do it. There is only doing it. The act of remembering — of saying their pet's name out loud on a day designed to celebrate motherhood — is, for most grieving pet moms, the gift itself.</p>
`.trim(),
  },
  {
    slug: "best-mothers-day-gift-for-dog-mom",
    title: "The Best Mother's Day Gift for the Dog Mom in Your Life (2026)",
    description:
      "Skip the candles. The Mother's Day gift dog moms actually want — and the four mistakes most gifters make. Plus a 30-second free preview of what the gift looks like.",
    publishedAt: "2026-04-24",
    keywords: [
      "best mothers day gift for dog mom",
      "mothers day dog mom gift",
      "personalized mothers day gift",
      "custom pet portrait mothers day",
      "last minute mothers day gift",
    ],
    heroImage: "/examples/watercolor.png",
    heroAlt: "Watercolor pet portrait — Mother's Day gift for a dog mom",
    ctaLinks: [
      { href: "/gifts/mothers-day", label: "Shop Mother's Day portraits" },
      { href: "/gifts/dog-mom-gift", label: "Browse dog mom gifts" },
    ],
    readMinutes: 5,
    body: `
<p>Pet moms are simultaneously the easiest and the hardest people to shop for.</p>

<p>Easy because they will never stop talking about the dog or cat in question. You already know the breed, the favorite toy, the embarrassing nickname, the photo she pulls up first when anyone mentions pets. Hard because everything in the &ldquo;dog mom gift&rdquo; aisle of every gift shop in America is the same: a mug that says <em>Dog Mom</em>, a tote that says <em>Dog Mom</em>, a t-shirt with a paw print on it. None of it lasts. None of it gets framed. None of it ends up on a wall.</p>

<p>Here's the thing: the gift she actually wants is the one that takes her dog seriously. A real piece of art. The kind of thing she'd buy for herself if she ever bought herself anything.</p>

<h2>The four mistakes most Mother's Day gifters make</h2>

<p><strong>1. Buying generic pet-themed merchandise.</strong> Anything with a generic paw-print pattern, anything from the gift-shop wall at TJ Maxx — fine, but forgettable. It signals you noticed she has a dog; it doesn't signal you noticed her specific dog.</p>

<p><strong>2. Picking out a frame, not the art.</strong> A Pottery Barn frame and a printed photo from her phone is a 4-out-of-10 gift. The frame is the easy part. The art inside the frame is what makes someone cry.</p>

<p><strong>3. Going too generic on the timeline.</strong> &ldquo;I'll order it next week&rdquo; turns into Mother's Day morning with no gift. Custom gifts feel more thoughtful when she sees you ordered them in advance — but they also need to ship in time.</p>

<p><strong>4. Forgetting that some pets are easier to photograph than others.</strong> If you can only get a phone snapshot, that's enough. You don't need a professional photo. The right service works with what you have.</p>

<h2>Why a custom pet portrait beats every other Mother's Day gift</h2>

<p>It's the only category of gift that solves all four mistakes at once. It's specific to <em>her</em> pet. It's real art she'll hang on the wall for years. It can be ordered with a few days of lead time. And the AI-assisted styles in modern services like ours mean even a blurry phone photo turns into a watercolor or oil painting that looks gallery-quality.</p>

<p>The hard part of a custom portrait used to be the wait — pet portrait artists historically took 2–4 weeks. The new generation of services (including <a href="/">Paw Masterpiece</a>) ships the digital file in 30 seconds and the framed canvas in 3–5 days. So you can preview the result, change your mind, switch to oil painting if you don't love the watercolor, and still ship in time for Mother's Day morning.</p>

<h2>Watercolor or oil painting? The honest answer</h2>

<p>Pet moms who lean traditional or hang lots of art at home: <strong>watercolor</strong>. It's soft, dreamy, gift-perfect, and reads as &ldquo;real art&rdquo; without being too serious. Top seller for Mother's Day every year.</p>

<p>Pet moms with a sense of humor about their dog: <strong>Renaissance.</strong> The portrait is a literal royal court painting of the pet — velvet robes, white ruff collar, gold leaf, crimson drapery. It's hilarious and beautiful. The kind of gift that gets pulled out at every dinner party for the next decade.</p>

<p>Pet moms with a minimalist Pinterest-curated home: <strong>line art.</strong> Clean, modern, single continuous line drawing. Reads as designed, never overdone.</p>

<p>Dog dads, while we're here: <strong>oil painting.</strong> Looks like a 17th-century commissioned portrait. Office-ready. Father's Day call.</p>

<h2>Last-minute? You're still fine</h2>

<p>If Mother's Day is in the next 24 hours and you're reading this in panic, here's the move: order the <strong>digital download</strong> ($6), email her the full-resolution file Sunday morning with a note explaining the canvas is on its way, and follow up with the framed canvas a few days later. The reaction is usually better — you get the on-the-day surprise <em>and</em> the second arrival.</p>

<p>Plus, through Mother's Day 2026, every order ships with a <strong>FREE 11×14 display print</strong>. So even the $6 digital includes a real piece of art on her wall. We auto-fulfill it on physical orders and let digital buyers claim it after checkout.</p>

<h2>How long does it actually take to make one?</h2>

<p>From upload to preview: under 30 seconds. The AI does the heavy lifting; our artists fine-tune. You'll see your pet rendered in your chosen style before you commit a dollar — preview is free, no signup required.</p>

<p>If you're still unsure, the <a href="/styles/watercolor-pet-portrait">watercolor</a>, <a href="/styles/oil-painting-pet-portrait">oil</a>, <a href="/styles/renaissance-pet-portrait">Renaissance</a>, and <a href="/styles/line-art-pet-portrait">line art</a> style pages let you compare side-by-side without uploading anything.</p>

<p>Mother's Day is in 16 days. The dog is already on the couch. Let's go.</p>
`.trim(),
  },
  {
    slug: "how-to-photograph-your-pet-for-a-custom-portrait",
    title: "How to Take the Perfect Photo of Your Pet for a Custom Portrait",
    description:
      "Five rules for capturing a phone photo of your dog or cat that turns into a stunning pet portrait. Lighting, angle, distractions, and what to do if your pet won't sit still.",
    publishedAt: "2026-04-24",
    keywords: [
      "how to photograph a pet for a portrait",
      "best photo for pet portrait",
      "pet portrait photo tips",
      "phone photo pet portrait",
    ],
    heroImage: "/examples/oil.png",
    heroAlt: "Oil painting pet portrait example — preview of what a good photo can become",
    ctaLinks: [
      { href: "/", label: "Try a portrait with your photo" },
      { href: "/styles/watercolor-pet-portrait", label: "See the four art styles" },
    ],
    readMinutes: 4,
    body: `
<p>Most pet portrait services have a dirty little secret: the difference between a great portrait and a meh portrait is almost never the artist or the AI. It's the photo you uploaded.</p>

<p>The good news: you don't need a DSLR, a studio, or a willing pet. You need five minutes, decent natural light, and the right kind of phone snapshot. Here's exactly what to look for.</p>

<h2>Rule 1: Daylight, never overhead lights</h2>

<p>Position your pet near a window in the afternoon. Indirect daylight from the side gives you the kind of soft, even lighting that flatters every breed. Yellow ceiling lights flatten the texture of fur and make everything look dingy. Camera flash makes pets look like raccoons.</p>

<p>If you have to shoot indoors with no good window, take them outside. Shade is fine. Direct sun is harsh, but anywhere your pet is in their natural element with daylight on their face works.</p>

<h2>Rule 2: Eye level, not above</h2>

<p>The biggest mistake we see: humans pointing their phone <em>down</em> at their pet from standing height. It looks like a passport photo for a criminal investigation.</p>

<p>Get on the floor. Crouch. Lie down if you have to. Eye-level photos of pets create the kind of intimate framing that makes a portrait feel like a real piece of art instead of a snapshot.</p>

<h2>Rule 3: One pet per photo (for now)</h2>

<p>If you have multiple pets and want them all in one portrait, take a separate photo of each pet — one at a time, same lighting if possible — and we'll compose them together. Trying to get two cats to sit in frame at the same time is how you spend an afternoon getting nothing.</p>

<p>The pets don't have to look at each other. They don't even have to be photographed on the same day. Our composers handle that.</p>

<h2>Rule 4: Background simpler than you think</h2>

<p>You don't need a clean white wall. You don't need a pose. You don't need to brush them first. What you do need: a background without too many competing visual elements. A messy couch is fine. A toddler in a costume in the background is going to confuse the artist.</p>

<p>If your pet is on a busy floor pattern or in front of a TV showing something distracting, snap a second photo with them on a solid surface. The lighting matters more than the surface looking aesthetic.</p>

<h2>Rule 5: Their face has to be visible</h2>

<p>Profile shots can work, but the strongest portraits are head-on or three-quarter views where both eyes are visible. If you can see the unique markings around their eyes and nose, the artist can capture their personality. If half their face is in shadow or hidden by a paw, less so.</p>

<p>One exception: a sleeping cat with eyes closed can make a beautiful watercolor. Their character comes through in the curl of their body. But a head-up photo gives you the most flexibility across our four styles.</p>

<h2>What if your pet won't sit still?</h2>

<p>The trick: take 30 photos in burst mode while making a noise they react to. Squeak a toy. Say their favorite word. Pull out a treat just out of frame. You'll get one good frame in the burst — that's all you need.</p>

<p>For cats specifically: photograph during their post-meal lethargy window or right after a play session when they're tired. Mid-zoomies is impossible.</p>

<h2>What about old photos?</h2>

<p>Phone photos from years ago work. Photos from before everyone had a phone in their pocket — scanned, photographed off the print, whatever — also work. Memorial portraits are commissioned almost entirely from photos we'd consider &ldquo;low quality.&rdquo; Whatever photo matters to you is the right photo.</p>

<p>Once your photo is ready, <a href="/">upload it on the homepage</a> and you'll see your portrait rendered in your chosen style in about 30 seconds. The preview is free; you only pay if you love it.</p>
`.trim(),
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function listBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : -1,
  );
}
