# Go-Live Checklist — Marketing Stack

_Everything shipped between commits `918b11f` → `229e587`, in launch order._

Work top-to-bottom. Don't skip — the later steps assume earlier ones are done.

---

## 1. Database migration (blocks everything referral/email)

The referral + email-tracking features ship schema changes that haven't been applied yet.

```bash
# Validate the schema locally first
npx prisma validate

# Apply to whatever DATABASE_URL points at (dev)
npx prisma db push

# Apply to prod (Neon) — set DATABASE_URL to the prod conn string in your shell first
DATABASE_URL="postgres://…" npx prisma db push
```

Confirm the new columns landed:

```sql
\d "User"       -- should include referralCode (text, unique), referralCredits (int)
\d "Order"      -- should include reviewEmailSentAt, anniversaryEmailSentAt
\d "Referral"   -- the whole table is new
```

---

## 2. Environment variables

Set these in Vercel Project Settings → Environment Variables. Values in `<...>` you need to grab from the respective dashboards.

### Analytics (blocks ad optimization)

| Var | Source | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4 Admin → Data Streams → Web | Format `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_META_PIXEL_ID` | Events Manager → Data Sources | 15-digit numeric |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | TikTok Ads Manager → Assets → Events | Format `C + 19 chars` |
| `NEXT_PUBLIC_ANALYTICS_DEBUG` | `true` to console.log every event in local dev | Leave blank for prod |

### Crons (blocks review / anniversary / winback emails)

| Var | Notes |
| --- | --- |
| `CRON_SECRET` | Any strong random string — `openssl rand -hex 32`. Vercel passes it automatically as the Authorization header when it triggers your cron. |

### Pinterest rich pins (optional, cosmetic)

| Var | Source |
| --- | --- |
| `PINTEREST_DOMAIN_VERIFY` | pinterest.com/settings/claim → Add website → Copy the meta-tag content value |

### Everything else

Existing vars in `.env.local.example` already covered this branch — nothing else new.

---

## 3. Google Search Console

- Add `pawmasterpiece.com` as a property (DNS or HTML file verification).
- Submit the sitemap: `https://pawmasterpiece.com/sitemap.xml`
- Request indexing for these high-priority URLs:
  - `/` (homepage)
  - `/memorial`
  - `/reviews`
  - `/gifts/mothers-day` **← urgent, holiday is May 10**
  - `/gifts/fathers-day`
  - `/gifts/christmas`
  - `/gifts/birthday`
  - `/gifts/dog-mom-gift`

Mother's Day and Father's Day URLs should rank within 48–72 hours post-submission if the site already has crawl authority.

---

## 4. Stripe verification

The referral and credit features generate one-time coupons on the fly via `stripe.coupons.create`. Nothing to pre-configure — but confirm:

- Your Stripe API key has permission to create coupons (default on new accounts).
- Your webhook endpoint (`/api/webhook`) is registered and listening for `checkout.session.completed`.
- `STRIPE_WEBHOOK_SECRET` is set in Vercel env.

---

## 5. End-to-end smoke test

In a logged-out browser window:

1. Open `https://pawmasterpiece.com/?ref=TESTCODE123` — check `document.cookie` for `pm_ref=TESTCODE123`. (Invalid code is fine — it'll cookie anyway, and checkout will reject it.)
2. Generate and purchase a digital portrait. Use Stripe test mode first.
3. Confirm the webhook fired (Stripe dashboard → Events → `checkout.session.completed` → 200 response).
4. Sign in as the buyer account and visit `/account/refer`:
   - Code displayed
   - `$0` credit balance (no real referral happened)
5. Copy the real code, open a **fresh incognito window**, hit `/?ref=<real_code>`, purchase with a different email. Check `/account/refer` as the referrer:
   - Referral listed as "Credited"
   - Credit balance shows `$10`
6. As the referrer, purchase again — checkout should auto-apply the $10 credit. Confirm balance goes back to `$0` after webhook fires.

---

## 6. Cron health check

After deploy, verify each cron runs once without errors:

```bash
# Replace with your real CRON_SECRET and prod domain
curl -H "Authorization: Bearer $CRON_SECRET" https://pawmasterpiece.com/api/cron/review-reminder
curl -H "Authorization: Bearer $CRON_SECRET" https://pawmasterpiece.com/api/cron/anniversary
curl -H "Authorization: Bearer $CRON_SECRET" https://pawmasterpiece.com/api/cron/winback
```

Each should return `{ "candidates": N, "sent": N, "failed": 0, ... }`. Zero sent is fine pre-launch (no orders old enough yet); nonzero `failed` is a red flag — check `EventLog` in the admin dashboard for the specific error.

---

## 7. Pixel health check

After env vars are set, reload the homepage and check:

- **GA4:** Admin → DebugView should show a `page_view` event.
- **Meta Pixel:** Events Manager → Test Events tab, browse the site, should see `PageView` + `ViewContent` fire.
- **TikTok Pixel:** Ads Manager → Events → Pixel Debugger, same idea.

Trigger `add_to_cart` / `begin_checkout` / `purchase` by walking the funnel and confirm each fires across all three platforms.

---

## 8. Mother's Day launch (time-sensitive)

- [ ] `/gifts/mothers-day` indexed in Google Search Console
- [ ] Gift page linked from the homepage footer or a banner for internal link juice
- [ ] Email sent to the list announcing the Mother's Day landing (use the existing admin campaign composer)
- [ ] UGC ad creative commissioned per [ad-creative-brief.md](./ad-creative-brief.md) — hire a creator by April 27 to have ads running by May 3
- [ ] Meta + TikTok campaign structured as: interest audiences (pet owners, dog moms) + lookalike-1% of purchasers + retargeting of anyone who hit `/gifts/mothers-day`

---

## Troubleshooting

| Symptom | Check |
| --- | --- |
| No pixel events firing | Env vars set but not redeployed → `vercel --prod` |
| Referral attribution missing | `stripe.dashboard.com` → checkout session → Metadata tab should show `referralCode` |
| Credit not applying at checkout | Signed-in user? `auth()` returning a session? Check `/api/create-checkout` server logs |
| Anniversary/review emails not sending | CRON_SECRET set? Cron endpoint returning 200? EventLog for "Anniversary send failed" entries |
| Pinterest domain verify not working | Set `PINTEREST_DOMAIN_VERIFY` to the full content value, not the full `<meta>` tag |
