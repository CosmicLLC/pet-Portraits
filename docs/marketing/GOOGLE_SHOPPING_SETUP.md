# Google Shopping setup — getting the product feed live

Paw Masterpiece has 8 flagship products live in a Google Merchant Center-compatible XML feed:

- **Feed URL:** `https://pawmasterpiece.com/api/feed/google-shopping.xml`
- 4 styles × 2 tiers (Digital $6, Framed Canvas $79)
- Each product clicks through to `/start?style={key}` (zero-scroll upload page)

## One-time setup (~15 min)

### 1. Sign up for Google Merchant Center

- Go to [merchants.google.com](https://merchants.google.com)
- Sign in with the same Google account you use for Search Console + Google Ads
- Add business info: name (Paw Masterpiece), country (US), time zone

### 2. Verify + claim the domain

- Merchant Center will offer Search Console verification — confirm `pawmasterpiece.com`
- If prompted to add a new verification method, the easiest is HTML tag (paste into `app/layout.tsx` metadata, or check `GOOGLE_SITE_VERIFICATION` env var which is already wired)

### 3. Add the feed

- Merchant Center → **Products → Feeds → Add primary feed**
- Country of sale: **United States**
- Language: **English**
- Feed name: `Paw Masterpiece XML Feed`
- Method: **Scheduled fetch**
- File URL: `https://pawmasterpiece.com/api/feed/google-shopping.xml`
- Fetch frequency: **Daily**
- Time: any (we recommend off-peak, e.g., 3 AM PT)
- Click **Continue → Create feed**

### 4. Wait for first fetch + review

- Google's first fetch happens within an hour
- Products land in Merchant Center under **Products → All products**
- **Status: Approved** → product is live in free Google Shopping tab
- **Status: Disapproved** → click the row to see why (most common: image too small, description too short, price mismatch). The feed code handles all standard requirements, so disapprovals here should be rare.

### 5. Optional: free listings enrollment

- Merchant Center → **Marketing → Surfaces across Google**
- Enable **Free listings** (this is FREE — products appear in the Google Shopping tab organically when relevant)
- Approval typically takes 24-72 hrs

### 6. Optional: link Google Ads for paid Shopping / Performance Max

- Merchant Center → **Settings → Linked accounts → Google Ads**
- Link to your Google Ads account
- In Google Ads → **Campaigns → New → Shopping or Performance Max**
- Select the linked Merchant Center
- Budget recommendation: $15-30/day starter campaign

## What's in the feed

Each style ships as two products:

| Product ID | Title | Price | Link |
|---|---|---|---|
| `watercolor-canvas-8x12` | Custom Watercolor Pet Portrait — Framed Canvas 8×12 | $79 | `/start?style=watercolor` |
| `watercolor-digital-download` | Custom Watercolor Pet Portrait — Digital Download | $6 | `/start?style=watercolor` |
| `oil-canvas-8x12` | Custom Oil Painting Pet Portrait — Framed Canvas 8×12 | $79 | `/start?style=oil` |
| `oil-digital-download` | Custom Oil Painting Pet Portrait — Digital Download | $6 | `/start?style=oil` |
| `renaissance-canvas-8x12` | Custom Renaissance Pet Portrait — Framed Canvas 8×12 | $79 | `/start?style=renaissance` |
| `renaissance-digital-download` | Custom Renaissance Pet Portrait — Digital Download | $6 | `/start?style=renaissance` |
| `lineart-canvas-8x12` | Custom Line Art Pet Portrait — Framed Canvas 8×12 | $79 | `/start?style=lineart` |
| `lineart-digital-download` | Custom Line Art Pet Portrait — Digital Download | $6 | `/start?style=lineart` |

All include:
- Brand: Paw Masterpiece
- MPN: e.g., `PM-WATER-CANVAS-8X12`
- `identifier_exists: FALSE` (custom-made products)
- Google product category: 500050 (Artwork > Posters & Prints)
- Free shipping: $0 standard US shipping
- UTM tags on click URLs: `utm_source=google_shopping&utm_medium=cpc`

## Adding more SKUs later

To expand to other physical SKUs (mounted print, canvas 16×20, acrylic, etc.):

Edit `app/api/feed/google-shopping.xml/route.ts` → `buildProducts()` function → push more `FeedProduct` entries to the array. The next Google fetch will see them.

## When things go wrong

- **All products disapproved:** check that `NEXT_PUBLIC_BASE_URL` is set correctly in Vercel. Image URLs need to be HTTPS and publicly reachable.
- **Some products disapproved:** click each row in Merchant Center → read the rejection reason. Most fixes are content-related (title too long, description vague, etc.).
- **Feed not fetched:** Manually trigger a fetch in Merchant Center → Feeds → your feed → **Fetch now**.

## Expected timeline

- Day 0: submit feed, wait for fetch
- Day 1: Google approves products
- Day 1-3: free listings start appearing in Google Shopping tab
- Day 7+: organic Shopping traffic begins (slow ramp)
- With Google Ads enabled: paid traffic starts day 1
