# Email Blasts — Mother's Day 2026

Three pre-written email broadcasts ready to fire from Resend. They're built around the active campaign (`mothers-day-2026` in `lib/campaigns.ts`) and reinforce each other — don't reorder.

## Send schedule

| File | Send date | Send time | Audience | Subject lines (A/B) |
| --- | --- | --- | --- | --- |
| [01-launch-mothers-day.html](./01-launch-mothers-day.html) | **2026-04-25** (T-15) | 10:00 AM ET | Full active list | A: "The Mother's Day gift she'll actually hang on the wall" / B: "🎁 Free 11×14 display print with every order this week" |
| [02-last-call-shipping.html](./02-last-call-shipping.html) | **2026-05-03** (T-7) | 10:00 AM ET | Full list, exclude buyers from last 7 days | A: "Last call: order today for Mother's Day shipping" / B: "One week to Mother's Day — canvas cutoff is tonight" |
| [03-digital-rescue.html](./03-digital-rescue.html) | **2026-05-09** (T-1) | 8:00 AM ET | Full active list | A: "Forgot Mother's Day? You're still fine." / B: "30 seconds. That's how long this gift takes." |

## How to send via Resend

1. Resend dashboard → Broadcasts → New broadcast
2. Select audience (your default audience or a segment)
3. Set **From**: `Paw Masterpiece <orders@yourdomain.com>` (must match `FROM_EMAIL` env var)
4. Subject — A/B test if your plan supports it; otherwise pick one
5. Preheader — listed in each file's HTML header comment
6. Open the HTML file, copy from `<div style="font-family:...` (skip the comment block) through `</div>`, paste into Resend's HTML editor
7. **Replace tokens** before sending:
   - `{{baseUrl}}` → `https://pawmasterpiece.com`
   - `{{unsubscribeUrl}}` → `https://pawmasterpiece.com/unsubscribe?email={{email}}` (Resend supports the `{{email}}` substitution natively)
8. Send a test to yourself first
9. Schedule for the dates/times in the table above

## Or send programmatically

If you'd rather automate, the existing admin campaign endpoint can fire these:

- POST `/api/admin/campaigns` with `{ subject, htmlBody, textBody, segment }`
- The `htmlBody` field takes the full HTML — paste from the file
- See `app/admin/campaigns/CampaignComposer.tsx` for the UI version

The admin campaign composer at `/admin/campaigns` already exists; you can paste each blast in there as a draft now and just hit Send on the schedule.

## After Mother's Day

These specific blasts won't make sense after May 10. Archive the folder name to `email-blasts/2026-mothers-day/` once the campaign closes — you'll likely want to reuse the structure for Father's Day with `s/Mother/Father/` and `s/her/his/` swaps. The shipping-cutoff math is identical.

## What's intentionally NOT in here

- **Memorial blast** — memorial customers are NOT on the campaign list. The whole point of the memorial funnel is no urgency, no discount-bombing. Suppress them by source. If you have a `memorial` segment in Resend, exclude it from all three sends above.
- **SMS / Twilio** — no SMS list yet; defer.
- **Father's Day prep** — separate folder when it's time (mid-May).
