# PAW MASTERPIECE — PROJECT CONTEXT FOR NEW SESSION

Generated 2026-05-25 after a long marketing build session. Paste this whole document into a new chat / project context window so the next AI session can pick up without losing state.

---

## Product

**Paw Masterpiece** (pawmasterpiece.com) — D2C ecommerce selling AI-generated pet portraits. Owner: cosmic.company.llc@gmail.com.

**SKUs:**
- Digital download — $6
- Phone wallpaper — $0.99 (new tripwire, just shipped)
- Display print 11×14 — physical, ships via Prodigi
- Mounted print 11×14 — physical
- Framed canvas 8×12 — physical
- Bundle (canvas + digital) — $79
- Expansion SKUs (env-gated, not yet active): canvas 16×20, multipet, gallery set, acrylic, metal, cards, phone case, prism, mug, pillow

**Art styles:** Watercolor, Oil Painting, Renaissance, Line Art (4 styles, each at `/styles/{slug}-pet-portrait`)

## Stack

- **Next.js 14 App Router** on Vercel (cosmicllcs-projects/pet-portraits)
- **TypeScript** strict mode
- **Prisma + PostgreSQL** (Neon, via Vercel Postgres) — models: User, Order, Subscriber, Campaign, EventLog, Referral, OutreachContact, BlockedEmail, RateLimit
- **Stripe** Checkout for payments + customer portal
- **Prodigi** for print-on-demand fulfillment (Display/Mounted/Canvas SKUs)
- **Gemini 2.5 Flash Image** for AI portrait generation
- **Vercel Blob** (PRIVATE store — important, see gotchas) for portrait/wallpaper storage
- **Resend** for transactional emails (8 flows: welcome, download, physical conf, review request, anniversary, winback, abandoned portrait, print shipped)
- **NextAuth** for admin auth + customer accounts (Google OAuth + email magic link)
- **GA4 + Meta Pixel + TikTok Pixel + Pinterest Tag + Microsoft Clarity** for client-side tracking
- **Meta Conversions API + TikTok Events API** for server-side tracking (built, not activated)
- **Tailwind CSS** + custom brand palette (`brand-green: #2D4A3E`, `brand-gold: #C9A671`, `cream: #FAF7F2`)

## Marketing plan source

The original 6-month growth plan provided in chat (long document, key points):
- **Top 3 traffic channels**: Pinterest (free compounding), Meta Ads (paid, ROAS ~1.58x for pets vertical), Pet blogger outreach
- **Skip**: Reddit (auto-ban risk), Programmatic SEO (user explicitly skipped)
- **Realistic Q4 outcome**: 8K-25K sessions/month, $25K-$60K monthly revenue with disciplined execution
- **Crown & Paw** is the category leader to learn from + outcompete on speed (30 sec preview vs their 1-7 days)
- **West & Willow** is the design-forward competitor

## What's been built (this session — 38 completed tasks)

### Tracking + attribution (8 items)
- Pinterest Tag slot in `components/Analytics.tsx` (env: `NEXT_PUBLIC_PINTEREST_TAG_ID`)
- Microsoft Clarity slot (env: `NEXT_PUBLIC_CLARITY_ID` — already set to `wwg5wfpxqs`)
- Meta Conversions API server-side (env: `META_CAPI_ACCESS_TOKEN` — NOT YET SET)
- TikTok Events API server-side (env: `TIKTOK_EVENTS_API_TOKEN` — NOT YET SET)
- Lightweight A/B test framework (cookie + GA4 user property)
- Dynamic OG image route via `next/og`
- Per-page Review schema on style + gift pages
- All 8 Vercel secrets upgraded from "encrypted" to "sensitive" type

### New SEO pages (5 items)
- `/how-it-works` — standalone page (extracted from home anchor)
- `/vs/crown-and-paw` — comparison page
- `/vs/west-and-willow` — comparison page
- `/tools/breed-identifier` — free AI breed ID tool (Gemini vision + FAQPage schema)
- `/wallpaper` — $0.99 phone wallpaper studio (NEW tripwire SKU)

### Conversion + trust UI (5 items)
- `TrustStrip` component mounted via `LandingFooterCTA` (auto-appears on all landing pages)
- `ShippingProgressBar` mounted in `StickyCartBar` (dormant — set `NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_USD` to activate)
- Featured-in row + money-back badge
- `priority` prop added to above-fold hero images
- Watermark hardened against corner-crop (extends edge-to-edge + corner stamps)

### Lead capture (6 surfaces + bug fix)
- `NewsletterInline` component in `LandingFooterCTA` (source: `landing_footer`)
- `EmailPopup` mounted sitewide in `app/layout.tsx` (suppressed on /admin, /api, /account, /success, /auth, /unsubscribe)
- Blog post mid-article newsletter inline at H2 closest to body midpoint
- Success-page explicit opt-in (source: `success_page`)
- Subscriber sources properly tagged for segmentation (12 enums)
- **BUG FIX**: `BrowseAbandonmentCapture` was sending source `"browse-abandonment"` which normalized to `"other"`. Now correctly sends `"abandonment"` and triggers `sendAbandonedPortraitEmail` (10% discount PAWSOME10) with 24h rate limit

### Admin retargeting workflow
- `/admin/subscribers` now has source dropdown, status filter, date range, "non-purchasers only" toggle
- CSV export honors all filters + includes `has_purchased` column
- Output format works directly for Meta/TikTok Custom Audience uploads

### Content drafts (in `docs/marketing/`)
- 9 personalized pet blogger outreach emails (`outreach/pet-blogger-outreach.md`) — for DogTipper, Modern Dog, This Dog's Life, PetGuide, Rover, Dogster, Dogington Post, Fido Friendly, BlogPaws
- 30 Pinterest pin briefs (`pinterest/30-starter-pins.md`) across 8 board topics
- 20 ad creative copy hooks (`ad-hooks.md`) — 4 patterns: POV reveal / before-after reaction / speed-flex / memorial
- 5 new evergreen blog posts MERGED into `lib/blog-posts.ts` (blog now has 10 posts):
  - `best-fathers-day-gifts-for-dog-dads`
  - `ai-pet-portraits-vs-hand-painted-buyers-guide`
  - `how-to-hang-a-pet-portrait-in-your-home`
  - `the-photo-you-already-have-is-good-enough`
  - `memorial-pet-portraits-gentle-guide-grieving-pet-parents`

### Pinterest pipeline (3 deliverables)
- `/admin/pinterest-pins` admin tool (next/og + 10-color palette)
- `scripts/generate-pinterest-pins.mjs` — pre-generates all 30 PNGs (Sharp + SVG, ~13MB output)
- `scripts/upload-pinterest-pins.mjs` — Pinterest API v5 batch uploader (auto-creates boards, handles rate limits, base64 image upload — no public hosting needed)

### Wallpaper studio (Phase A complete)
- `/wallpaper` landing page + studio
- New "minimalist single-color background" Gemini style (`lib/gemini.ts` `WALLPAPER_PALETTE` + `generateWallpaperPortrait`)
- 10-color curated palette: Sage, Dusty Rose, Cream, Navy, Terracotta, Butter, Slate, Blush, Forest, Charcoal
- `lib/wallpaper-compose.ts` — upscales 1024×1024 source to 1700×1700, center-crops to 1290 wide, extends upward only → pet sits at bottom of 1290×2796 phone aspect, fills ~61% of phone height
- Composition prompt iterated 3x: now anchors pet to bottom edge, 65-75% width, head at top 12-18%, body bleeds off bottom
- Style language: "polished flat digital illustration (Procreate / Etsy premium)" with cel-shading + eye catchlights
- `STRIPE_WALLPAPER_PRICE_ID` updated to new $0.99 price (`price_1TPtmlRg6awxgOnRZoJ9zqSS`)
- Webhook handles standalone wallpaper flow (detects via `bgHex` in Stripe metadata, fetches from `wallpapers/` blob prefix)

### Outreach hub (latest — last task done)
- `/admin/outreach` page with pipeline tracking
- New Prisma `OutreachContact` model with status enum (pending → sent → replied → accepted → posted → passed → no_reply)
- "Seed 9 pet blogger drafts" button (idempotent, dedupes by handle)
- "+ Add influencer" form with auto-generated Instagram/TikTok DM template (personalized with name + pet's name + recent post reference)
- Detail modal with copy buttons for email/subject/body, mailto integration, status switcher

## Current state of each marketing channel

| Channel | Built? | Active? | Bottleneck |
|---|---|---|---|
| SEO (organic Google) | ✅ ~30 indexable pages + 10 blog posts | 🔄 Indexing | Time (3-6 month compound) |
| Pinterest organic | ✅ 30 pins generated + auto-upload script | ❌ 1/30 posted | User needs to get Pinterest API token + run script |
| Meta Ads | ✅ Pixel + CAPI + 20 ad hooks drafted | ❌ Zero campaigns | UGC video creation + ad budget |
| TikTok Ads | ✅ Pixel + Events API + ad hooks | ❌ Zero content | UGC video + token |
| Pet blogger outreach | ✅ 9 drafts + hub | ❌ Zero sent | User clicks send |
| Influencer outreach | ✅ Hub with auto-DM generator | ❌ Zero added | User finds candidates |
| Email marketing | ✅ 8 flows armed | 🔄 ~0 subscribers | List growth |
| Affiliate program | ❌ Not built | ❌ | GoAffPro signup not started |
| Google Shopping | ❌ Not built | ❌ | Feed not created yet |
| Etsy listings | ❌ Not built | ❌ | Etsy API approval needed |

## What needs the USER to act (concrete to-dos)

### Critical — required to unlock built features
1. **Get Pinterest API access token** — developers.pinterest.com → create app → 4 scopes (`boards:read/write`, `pins:read/write`) → paste as `PINTEREST_ACCESS_TOKEN` in `.env.local`. Then run `node scripts/upload-pinterest-pins.mjs`
2. **Set Meta CAPI access token** — Meta Events Manager → your Pixel → Settings → Conversions API → Generate token → Vercel env: `META_CAPI_ACCESS_TOKEN`
3. **Set TikTok Events API token** — TikTok Events Manager → similar → Vercel env: `TIKTOK_EVENTS_API_TOKEN`
4. **Get Pinterest Tag ID** — Pinterest Ads → Tag Manager → Vercel env: `NEXT_PUBLIC_PINTEREST_TAG_ID`

### Send the outbound drafts
5. **Send 9 pet blogger outreach emails** via `/admin/outreach` — seed first, then click each, click "Open in email client"
6. **Upload remaining 29 Pinterest pins** (after getting token, single script run)

### Production / UGC work
7. **Shoot 3-5 UGC reaction videos** on iPhone using scripts in `docs/marketing/ad-hooks.md` (Hook 1 = POV reveal, Hook 2 = before/after, Hook 3 = speed-flex)
8. **Launch first Meta Advantage+ campaign** ($25/day starter) — Pets vertical median ROAS 1.58x
9. **Sign up for Microsoft Clarity dashboard** — clarity.microsoft.com (free) to see session replays

### Optional but high-ROI
10. **Sign up for Tailwind ($25/mo)** to auto-schedule Pinterest pins instead of running script manually
11. **Set free shipping threshold** — Vercel env: `NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_USD=75` (activates dormant ShippingProgressBar)

## What's next (prioritized backlog for new session)

### Tier 1 — High-leverage, autonomous shippable
1. **`/wallpaper` → LandingHeader nav + `/free-wallpaper` → `/wallpaper` upsell** — quick internal traffic wins (~15 min)
2. **IndexNow + sitemap auto-submission on deploy** — accelerates indexing of new pages from weeks to hours
3. **Google Merchant Center XML feed** at `/api/feed/google-shopping.xml` — unlocks free Google Shopping tab listings + Performance Max ads
4. **Instagram/TikTok influencer scraper** at `/admin/find-influencers` — paste hashtag, get list of pet-niche accounts to bulk-add to outreach hub

### Tier 2 — Medium leverage
5. **Style page deepening** — current 300-400 words; plan calls for 1,200+ for E-E-A-T
6. **HowTo + Video schema** on key pages for AI search (ChatGPT/Gemini/Perplexity inclusion)
7. **Q4 holiday infrastructure** — shipping countdown banner (date-driven) + gift guide pages (under $50, for dog dads, etc.)
8. **Customer support tooling** — `/admin/inbox` for unified email/contact-form replies (Crown & Paw warning: 7000 unanswered emails almost killed them)
9. **PR linkable asset** — "State of Pet Spending 2026" report or free dog breed identifier marketing push for backlinks

### Tier 3 — Pure infrastructure
10. **GoAffPro affiliate integration** — recruit external traffic drivers at 15%/8% commission
11. **Email campaign sender at `/admin/campaigns/send`** — primes the channel for when subscriber count grows
12. **Bing Webmaster URL submission** — feeds ChatGPT search

## Known issues / gotchas (CRITICAL for new session)

1. **Vercel Blob store is PRIVATE** — using `access: "public"` in `put()` calls causes runtime 500s ("Cannot use public access on a private store"). All blob writes must use `access: "private"`. One known latent issue at `lib/upscale.ts:94` for Prodigi print-ready URLs — not yet triggered.

2. **ESLint `no-unused-vars` is enforced as ERROR in production builds** — TypeScript looks clean locally but Vercel blocks the deploy. Always scrub unused imports/vars before committing. This has bitten 3 deploys this session.

3. **Vercel git auto-deploy is unreliable** — some pushes trigger builds, some don't. Workaround: run `vercel deploy --prod --yes` after each commit. Or fix the GitHub integration at Vercel → Settings → Git.

4. **`vercel env add ... preview` CLI fails with "git_branch_required"** even when using `--yes`. Production + Development work fine; Preview env vars must be set via Vercel dashboard. Non-blocking — Preview only affects PR previews, not live.

5. **Mother's Day 2026 campaign is dormant** — landing page (`/gifts/mothers-day`) was evergreen-pivoted post-holiday; `lib/campaigns.ts` is date-gated and inactive. All Mother's Day-specific copy was removed from production strings.

6. **Date in conversation is 2026-05-25** (post-Mother's-Day, ~4 weeks pre-Father's Day, ~6 months pre-Q4).

7. **Stripe wallpaper price is now $0.99** for BOTH the standalone wallpaper SKU AND the add-on on the portrait creator. Same `STRIPE_WALLPAPER_PRICE_ID`. If you want different prices, you need to add a separate `STRIPE_WALLPAPER_ADDON_PRICE_ID`.

8. **References folder is empty** — `lib/gemini.ts` is wired to load reference images from `references/{style}.jpg` for the 4 portrait styles + wallpaper, but no JPGs are checked in. All styles currently run text-prompt-only. A flagship reference image per style would significantly improve consistency.

9. **Pinterest sandbox apps cap at ~10-20 pins/hour.** Upload script handles 429s with sleep+resume — 30 pins might take 2-3 hours, runs unattended.

10. **There are 5 stray pet photo PNGs in `public/examples/`** that are untracked (`John_pork_flag_oikee*.png`, `color-morphing-mug-11oz*.jpg`). Test outputs, not committed. Safe to delete OR commit if desired.

## File map (where things live)

```
app/
├── admin/
│   ├── outreach/         # NEW — pipeline hub for bloggers + influencers
│   ├── pinterest-pins/   # Pin generator admin tool
│   ├── subscribers/      # Retargeting filter UI (filter by source/date/non-purchaser)
│   ├── campaigns/        # Email campaign list (no send UI yet)
│   ├── ad-studio/        # Ad creative composer
│   └── mug-print/        # Magic mug print generator
├── api/
│   ├── admin/outreach/   # NEW — CRUD for OutreachContact
│   ├── admin/pinterest-pin/  # next/og pin renderer
│   ├── admin/subscribers/    # GET (with filters) + DELETE + CSV export
│   ├── generate/         # Main AI portrait generation (4 styles)
│   ├── wallpaper-preview/    # NEW — minimalist wallpaper gen
│   ├── identify-breed/   # Free breed ID tool API
│   ├── create-checkout/  # Stripe session creation
│   └── webhook/          # Stripe webhook → fulfillment
├── wallpaper/            # NEW — $0.99 phone wallpaper studio
├── tools/breed-identifier/   # NEW — free breed ID tool
├── how-it-works/         # NEW — standalone process page
├── vs/[slug]/            # NEW — competitor comparison pages
├── gifts/[occasion]/     # 5 gift occasion pages
├── styles/[slug]/        # 4 style pages
├── memorial/             # Memorial portrait landing (gentle tone)
├── blog/[slug]/          # Blog (10 posts now)
└── reviews/              # Reviews wall with Review schema

lib/
├── gemini.ts             # AI generation (4 styles + wallpaper + breed ID)
├── wallpaper-compose.ts  # NEW — phone-aspect composition
├── outreach-seed.ts      # NEW — 9 blogger drafts as TS
├── server-pixels.ts      # Meta CAPI + TikTok Events API client
├── analytics.ts          # GA4 + Meta + TikTok client-side events
├── campaigns.ts          # Date-gated seasonal campaign config
├── gift-occasions.ts     # 5 gift occasion content
├── blog-posts.ts         # 10 blog posts inline
├── seo-data.ts           # Styles + breeds + categories
├── products.ts           # SKU + pricing config
├── stripe.ts             # Stripe client + PRICE_IDS
├── prodigi.ts            # Print-on-demand client
├── resend.ts             # 8 email flows
├── reviews.ts            # Customer reviews + AGGREGATE_RATING
├── watermark.ts          # Diagonal preview watermark
└── comparisons.ts        # /vs/ page data

scripts/
├── generate-pinterest-pins.mjs   # NEW — pre-render 30 pins
├── upload-pinterest-pins.mjs     # NEW — Pinterest API v5 uploader
└── compose-ad.mjs                # Older ad creative composer

docs/marketing/
├── outreach/pet-blogger-outreach.md
├── pinterest/30-starter-pins.md
├── pinterest/generated/  # PNG output dir (gitignored) + upload-batch.csv
├── ad-hooks.md
├── blog-drafts.md
├── AGGRESSIVE_GROWTH_PLAN.md
├── competitor-intel-mothers-day.md
├── influencer-outreach-list.md
└── seo-blog-targets-mothers-day.md

prisma/schema.prisma     # Models: User, Order, Subscriber, Campaign, EventLog, Referral, OutreachContact (NEW), BlockedEmail, RateLimit

.env.local               # All secrets (gitignored)
.env.local.example       # All env var docs
```

## Env var reference

```
# AI generation
GEMINI_API_KEY=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_DIGITAL_PRICE_ID=
STRIPE_WALLPAPER_PRICE_ID=price_1TPtmlRg6awxgOnRZoJ9zqSS  # $0.99
STRIPE_DISPLAY_PRICE_ID=
STRIPE_MOUNTED_PRICE_ID=
STRIPE_CANVAS_PRICE_ID=
STRIPE_BUNDLE_PRICE_ID=
# + 10 expansion SKU price IDs (env-gated, optional)

# Storage + DB
BLOB_READ_WRITE_TOKEN=    # Vercel Blob (PRIVATE store)
DATABASE_URL=             # Neon Postgres

# Email
RESEND_API_KEY=
FROM_EMAIL=

# Print fulfillment
PRODIGI_API_KEY=
PRODIGI_ENV=production
PRODIGI_*_SKU=            # Per-product Prodigi SKU mappings

# Upscaler (optional)
REPLICATE_API_TOKEN=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Analytics (client-side)
NEXT_PUBLIC_GA4_MEASUREMENT_ID=
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
NEXT_PUBLIC_PINTEREST_TAG_ID=    # NOT YET SET
NEXT_PUBLIC_CLARITY_ID=wwg5wfpxqs

# Server-side conversion APIs (built, NOT YET activated)
META_CAPI_ACCESS_TOKEN=          # NOT YET SET
TIKTOK_EVENTS_API_TOKEN=         # NOT YET SET

# Optional levers
NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_USD=   # Activates shipping bar
PINTEREST_ACCESS_TOKEN=           # For upload script
RESEND_AUDIENCE_ID=               # Optional Resend audience mirror

# SEO / verification
NEXT_PUBLIC_BASE_URL=https://pawmasterpiece.com
GOOGLE_SITE_VERIFICATION=
BING_SITE_VERIFICATION=
PINTEREST_DOMAIN_VERIFY=
```

## Recent commit history (this session)

```
9efaea7 Marketing: /admin/outreach hub — pipeline tracking + DM generator
0a34b80 Marketing: Pinterest API v5 batch-upload script
11d5401 Marketing: pre-generate all 30 Pinterest pin PNGs + upload CSV
bf58ade Wallpaper: scale-and-crop source so pet dominates the phone screen
e24fd21 Wallpaper: anchor pet to bottom edge, dominate >55% of frame
218563c Wallpaper prompt: harden composition control + likeness anchoring
19b5795 Fix wallpaper preview — use private blob access
6c546eb Marketing: ship /wallpaper — $0.99 phone wallpaper studio
d203e6f Extend EventSource union to cover new marketing routes
1dbf864 Marketing: free AI dog/cat breed identifier tool
db90db6 Marketing: ship 5 evergreen blog posts to replace Mother's Day cliff
06b5d2a Marketing: lead capture across landing pages + retargeting workflow
85e6f10 Fix unused 'green' param in Pinterest pin OverlayLayout
```

## Suggested first prompt for new session

> "Continue from the handoff doc at docs/SESSION_HANDOFF.md. Pick the next highest-leverage task from Tier 1 backlog and ship it. Be autonomous — only ask if you genuinely need input. Watch out for the ESLint no-unused-vars gotcha that has blocked 3 deploys, and remember the Vercel Blob store is private."
