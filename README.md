# Pet Portraits — AI-Powered Fine Art Portraits

A single-page Next.js app where customers upload a pet photo, choose an art style, see an AI-generated watermarked preview, pay via Stripe, and receive the full-res file by email.

## Local Setup

```bash
npm install
cp .env.local.example .env.local
# Fill in all keys in .env.local (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Reference Images

Drop style reference JPGs into the `/references/` directory:

- `references/watercolor.jpg` — a watercolor art example
- `references/oil-painting.jpg` — an oil painting example
- `references/renaissance.jpg` — a Renaissance portrait example
- `references/line-art.jpg` — a pencil/line art example

These are passed to OpenAI alongside the pet photo to guide the style. The app works without them (the prompt alone guides the style), but reference images significantly improve quality.

## Environment Variables

| Variable | Where to get it |
|---|---|
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — Gemini API key |
| `STRIPE_SECRET_KEY` | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Webhooks > your endpoint > Signing secret |
| `STRIPE_DIGITAL_PRICE_ID` | Create a product "Digital Download" at $25 in Stripe, copy the Price ID |
| `STRIPE_WALLPAPER_PRICE_ID` | Create a product "Phone Wallpaper" at $15 in Stripe, copy the Price ID |
| `STRIPE_CANVAS_PRICE_ID` | Create a product "Canvas Print 8x10" at $77 in Stripe, copy the Price ID |
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Dashboard > Storage > Create Blob Store > copy token |
| `NEXT_PUBLIC_BASE_URL` | Your deployed URL (e.g. `https://petportraits.com`) or `http://localhost:3000` for dev |

## Stripe Setup

1. Create 3 products in Stripe Dashboard > Products:
   - **Digital Download** — $25 (one-time)
   - **Phone Wallpaper** — $15 (one-time)
   - **Canvas Print 8x10** — $77 (one-time)
2. Copy each Price ID into your `.env.local`
3. Create a webhook endpoint pointing to `https://yourdomain.com/api/webhook`
4. Select the `checkout.session.completed` event
5. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`

For local testing, use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

## Resend Setup

1. Sign up at resend.com
2. Add and verify your sending domain
3. Update the `from` address in `lib/resend.ts` to use your verified domain
4. Copy your API key into `RESEND_API_KEY`

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo in the Vercel Dashboard. Add all environment variables in Project Settings > Environment Variables.

Make sure to:
- Create a Vercel Blob store and link it to the project
- Update `NEXT_PUBLIC_BASE_URL` to your production URL
- Update the Stripe webhook URL to your production domain

## After First Sale

**Next steps for scaling:**

- **Printful integration** — For canvas print orders, integrate with Printful API to auto-fulfill print orders. Currently canvas orders log to console and send a confirmation email.
- **Analytics** — Add Vercel Analytics or Plausible for conversion tracking.
- **Custom branding** — Replace "PREVIEW" watermark text in `lib/watermark.ts` with your brand name. Update the `from` email in `lib/resend.ts`.
- **Additional styles** — Add new entries to `STYLE_PROMPTS` in `lib/openai.ts` and update the `StylePicker` component.

## Architecture Decisions

- **No database** — Stripe metadata + Vercel Blob handles all state. Keeps the stack minimal.
- **No auth** — Single purchase flow doesn't need accounts. Email is collected by Stripe Checkout.
- **Server-side watermark** — Uses `sharp` so the full-res image never reaches the client.
- **Vercel Blob** — Stores full-res images with public URLs. For production, consider adding signed/expiring URLs.

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Google Gemini 2.0 Flash (image generation)
- Stripe Checkout
- Resend (email)
- Vercel Blob (image storage)
- sharp (watermarking)
