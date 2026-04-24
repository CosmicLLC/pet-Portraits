# Aggressive 30-Day Growth Plan

_Authored 2026-04-24. Mother's Day = 2026-05-10 (16 days). Plan covers MD prep + post-MD nurture + Father's Day pre-positioning._

## Where we are right now

**Stack-side, all green:** site is live, sitemap submitted to Google, all 5 gift pages indexable, 84 breed×style programmatic pages live, memorial funnel + reviews wall + referral program shipped, ad studio operational, Mother's Day banner running site-wide, free 11×14 print bonus auto-fulfilled for physical orders + claimable form for digital orders.

**Stack-side, blocked on owner:**
1. `prisma db push` against prod — referral + bonus claim + email crons error 500 until done. ~30s task.
2. Pixel IDs not set in Vercel — analytics dark, paid ads can't optimize. ~5 min task.
3. `CRON_SECRET` not set — review/anniversary/winback emails not firing. ~30s task.
4. Stripe Price IDs for the 10 expansion products — none of the new SKUs sellable yet. As-needed.

**Demand-side:** zero awareness yet. No paid spend, no influencer seeding, no email list of meaningful size, no press, no organic search rank (sitemap submitted hours ago, expect first impressions in 3–7 days).

The aggressive premise: we're behind. The Mother's Day window costs us nothing to go all-in — we miss it, we lose 16 days of high-intent traffic that won't return until next year. So we attack on every channel simultaneously.

---

## The plan, day by day

### TODAY (T–16) — unblock + launch ready

| Owner | Task | Why |
| --- | --- | --- |
| Owner | `DATABASE_URL=<prod_neon_url> npx prisma db push` | Unblocks referrals + bonus claim + email tracking |
| Owner | Set `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID` in Vercel | Without these, paid ads have nothing to optimize |
| Owner | Set `CRON_SECRET` in Vercel | Lifecycle emails start firing |
| Owner | Submit `sitemap.xml` in Search Console | Started 2026-04-24, confirm it succeeded |
| Owner | Request indexing for `/gifts/mothers-day`, `/gifts/dog-mom-gift`, `/memorial` | Speed up first impressions |
| Claude | Ship blog system + 5 SEO posts (drafts) | Captures last-mile gift-search intent |
| Claude | Ship lead magnet capture page (`/free-photo-guide`) | Email-list growth surface for retargeting |
| Claude | Generate 5 ad creative variants via Imagen 4 | Ready for Meta upload |

### T–14 to T–10 (Apr 26 – Apr 30) — channel ignition

| Channel | Task | Owner |
| --- | --- | --- |
| **Email** | Send first email blast to existing list — "🎁 FREE 11×14 print this week" | Owner (template ready in `docs/marketing/email-blasts/`) |
| **Meta paid** | Launch Mother's Day campaign — $50/day budget — Variant A Renaissance Reveal as creative — interest audience: "dog owners, gift shoppers, women 30–55" | Owner (creative + brief ready) |
| **TikTok paid** | $30/day — Variant C Speed Hook video format | Owner |
| **Pinterest** | Post 10 Pinterest pins linking to `/gifts/mothers-day` and `/gifts/dog-mom-gift` — pin descriptions in `docs/marketing/pinterest-pins.md` | Owner |
| **Influencer DMs** | Send first 30 DMs from `docs/marketing/influencer-outreach-list.md` | Owner |
| **Reddit / community** | Soft posts on r/aww, r/dogmom, r/giftideas — "I made my mom this for Mother's Day" UGC angle | Owner |
| **Blog publishing** | Publish 5 SEO posts at `/blog/*` | Auto on next Vercel deploy |

### T–9 to T–4 (May 1 – May 6) — last call

| Task | Owner |
| --- | --- |
| 2nd email blast: "Last call for canvas shipping by Mother's Day — order by May 3" | Owner |
| Increase Meta budget to $100/day (assuming ROAS ≥ 2x) | Owner |
| Add retargeting audience to Meta: anyone who viewed `/gifts/mothers-day` but didn't checkout | Owner |
| Repost top-performing organic content as Reels | Owner |
| Influencer follow-ups (24h post-DM) | Owner |

### T–3 to T–0 (May 7 – May 10) — digital push

| Task | Owner |
| --- | --- |
| 3rd email blast: "Forgot Mother's Day? Digital download arrives in 30 seconds" | Owner |
| Pivot Meta creative to Variant C "POV speed hook" — emphasize digital instant delivery | Owner |
| Pivot landing copy on `/gifts/mothers-day` — promote digital, downplay shipping | Owner (or Claude can ship a copy variant) |
| Final SMS push to subscribers (if Twilio is set up — defer if not) | Owner |

### T+0 to T+30 (May 11 – June 9) — recovery + Father's Day prep

| Phase | Task |
| --- | --- |
| **Win-back** (May 11–14) | "Thanks for celebrating Mother's Day with us — here's $10 off your next order" email |
| **Anniversary trigger** (auto) | Cron starts firing for 1-year-old orders |
| **Review request** (auto) | 7-day post-purchase email asks for testimonial + share |
| **Father's Day creative** (May 18) | Generate Variant A in oil-painting style for dog dads |
| **Father's Day campaign** (June 1) | Mirror this entire plan but s/Mother/Father/ |

---

## Channel-by-channel targets (30-day window)

| Channel | Spend | Target CPA | Target volume | Notes |
| --- | --- | --- | --- | --- |
| Meta | $1,800 | $25 (digital) / $40 (canvas) | 60–100 orders | $50/day base, scales to $100 by T–7 if ROAS holds |
| TikTok | $600 | $30 (digital) / $50 (canvas) | 15–25 orders | Lower budget — cheaper CPM but less conversion confidence |
| Pinterest | $0 (organic) | n/a | 10–30 orders | Pin organically, $50/day promoted boost optional in week 2 |
| Email | $0 (existing list) | n/a | 20–50 orders | List size dependent — 1% conversion is realistic |
| Influencer | $1,500 + product | n/a | 30–80 orders | 3–5 micro-influencer placements at ~$300–500 each + free framed canvas of their pet |
| Organic SEO | $0 | n/a | 5–20 orders | Realistically slow ramp; 5 blog posts + existing pages |
| **Total** | **$3,900** | **~$30 blended** | **~140 orders** | $89 AOV (canvas+digital bundle) → ~$12k revenue → 3.1x ROAS |

These are aggressive but achievable assumptions. Refine after week 1 with real data.

---

## What success looks like

- **Day 5 (April 29)**: 50 orders booked, 25% of email list converted
- **Day 10 (May 4)**: $5k+ Meta spend, 100 orders, ROAS ≥ 2.5x
- **Day 16 (May 10, Mother's Day)**: 150–200 orders for the campaign window
- **Day 30 (May 24)**: full lifecycle email machine running, 50+ referrals issued, Father's Day campaign teed up

---

## What kills the plan

1. **DB push not done** → checkout 500s for signed-in users. **Run it today.**
2. **Pixels never wired** → Meta optimization can't learn → CPA stays $80+. **Set them today.**
3. **Influencer ghosts** → if zero respond, kill that $1,500 line, redirect to Meta. Decision point: T–10.
4. **Renaissance creative fatigues** → if Meta CTR drops below 0.8% by T–7, swap to Variant B (Four-Style Grid).
5. **Server overload at peak** → unlikely but worth a generation rate-limit check before May 8.

---

## Asset index (what's in the repo right now to fuel this)

- [docs/ad-creative-brief.md](../ad-creative-brief.md) — for human UGC creators
- [docs/ad-creative-prompts.md](../ad-creative-prompts.md) — prompts for Imagen / Midjourney / Sora
- [docs/brand-kit/](../brand-kit/) — Gemini Gem package
- [docs/GO_LIVE.md](../GO_LIVE.md) — deployment checklist
- [public/ads/](../../public/ads/) — finished ad creatives ready to upload
- [/admin/ad-studio](https://pawmasterpiece.com/admin/ad-studio) — generate more variants on demand
- (after this push) `docs/marketing/competitor-intel-mothers-day.md` — what competitors are running
- (after this push) `docs/marketing/influencer-outreach-list.md` — DM script + 30 handles
- (after this push) `docs/marketing/seo-blog-targets-mothers-day.md` — keyword research
- (after this push) `docs/marketing/email-blasts/` — 3 ready-to-send Resend campaigns
- (after this push) `app/blog/` — published blog posts
- (after this push) `/free-photo-guide` — lead magnet capture page

If anything in this plan stops being true, edit the doc. It's the source of truth, not the conversation.
