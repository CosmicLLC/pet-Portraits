# Marketing Strategy — Paw Masterpiece

_Condensed summary of the current plan. Source of truth for campaign decisions._

## Core thesis

High-emotion, visually-rich, gift-eligible product. Win formula:

1. Meta UGC reveal ads (cold acquisition)
2. Klaviyo-style email lifecycle (repeat + winback)
3. Programmatic SEO (90+ breed × style pages shipped; gift + memorial pages live)
4. Pet micro-influencer seeding
5. Referral loop (give $10 / get $10, live)

We're closer to Minted / Etsy than SaaS — we optimize for new-customer volume and word-of-mouth coefficient, NOT retention cohorts.

## Personas (LTV-ranked)

See `01-brand-voice.md` for tone treatment.

1. **Memorial buyer** — 15–20% volume, AOV $150–400. Best word-of-mouth. Extreme tone discipline required — grief-aware language only.
2. **The gifter** — 50–60% volume. Best cold-acquisition angle. Gift-occasion pages are their landing pages.
3. **Self-gifting pet parent** — 30–35% volume. Impulse-driven by social; ads → instant preview is the conversion loop.

## Calendar

Q4 (Oct–Dec) = 40–50% of annual revenue. Mother's Day is the second-biggest window. Memorial demand is steady year-round and rising 2026–2030 as pandemic-era pets age into senior / memorial territory.

### Active campaign windows in 2026

| Window | Dates | Bonus offer | Hero style |
| --- | --- | --- | --- |
| Mother's Day | 2026-04-24 → 2026-05-10 | FREE 11×14 display print with every order | Watercolor |
| Father's Day | 2026-06-07 → 2026-06-21 | (set closer to date) | Oil painting |
| Back-to-school / fall | (none yet) | — | — |
| Black Friday | 2026-11-27 → 2026-12-01 | (set closer to date) | Any |
| Christmas | 2026-12-01 → 2026-12-15 | Order-by cutoffs, not a freebie | Renaissance |

## Funnel

```
Cold audience (Meta / TikTok / Pinterest)
  → Landing page (/gifts/[occasion] or /memorial for that persona)
    → Upload photo + preview (30s)
      → Email captured via exit-intent or browse-abandonment if they leave
      → Purchase (digital $6 / canvas $79 / bundle $79 with free digital / etc.)
        → Post-purchase upsell (canvas at 25% off if they bought digital)
        → 7-day review-request email
        → 365-day anniversary email
        → Referral link in every touchpoint
```

## Product positioning

- Digital portrait ($19): entry price, instant gratification, gift-morning-of play.
- Framed canvas ($79 / $149): the hero product. "The gift that gets hung on the wall, not put in a drawer."
- Bundle ($79, includes digital free): captures indecision; highest perceived value for first-order gifters since they get the digital file at no extra cost.
- Gallery Set ($99): new for Q4 — four prints, same pet, all four styles. Christmas flagship.
- Memorial path: same products, different funnel, unlimited revisions, no time-pressure language.

See `05-product-catalog.md` for the full SKU list.

## Pricing anchors

Always lead with `$19` (the digital entry point). Anchor the canvas at $79 for the 8×12 and $149 for the 16×20. Never minimize with "only" or "just" — say the price plainly.

## Where we don't play

- We don't do mugs / totes / phone cases as primary hero product. They exist in the catalog (2026-04-24 bulk add) but they never lead creative — the brand thesis is anti-drawer-gift.
- We don't do physical subscription boxes.
- We don't sell wholesale or to retailers.
- We don't ship outside the US for physical products. International gets digital only.
- We don't discount the memorial funnel — ever.

## Attribution

- **Meta Pixel, TikTok Pixel, GA4** fire on every funnel event (`portrait_generation_start`, `portrait_generated`, `add_to_cart`, `begin_checkout`, `purchase`, `sign_up`, `exit_intent_shown`). Use these event names when writing ad copy optimization briefs.
- **UTMs**: every email and paid ad URL should carry `utm_source`, `utm_medium`, `utm_campaign`. Campaign value should match the campaign id from `lib/campaigns.ts` (e.g. `mothers-day-2026`).

## What "good" looks like

- Meta CPA under $25 for digital ($19 product) — unit economics only work at <$25, ideal <$15.
- Meta CPA under $60 for canvas ($79) — target $40.
- 3%+ purchase rate on `/gifts/mothers-day` page from paid traffic.
- >10% email capture rate on exit-intent.
- Referral program: >5% of purchasers share; >15% of referees convert on first visit.

If any of those drift, pull back paid spend and iterate on creative or landing-page CRO before adding more budget.
