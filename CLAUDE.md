# Instructions for future Claude sessions

## DO NOT DELETE OR MODIFY

These files are load-bearing for third-party verification. Deleting, renaming, or modifying them breaks the verification and the associated service stops working. Never touch them unless the user explicitly instructs otherwise.

| File | Purpose | What breaks if removed |
| --- | --- | --- |
| `public/googlef630c1af4fccba18.html` | Google Search Console site verification | Loses Search Console access; sitemap submission, indexing requests, and ranking data go dark |

If you're cleaning up dead files or reorganizing `public/`, skip anything matching `public/google*.html`, `public/BingSiteAuth.xml`, or any similarly-named verification file pattern. These exist on a one-to-one exact-match contract with the verifying service.

## Marketing stack context

- SEO + analytics + referral + email stack was shipped in commits `918b11f` → `257a394` between 2026-04-24. See [docs/GO_LIVE.md](docs/GO_LIVE.md) for the deploy checklist.
- Ad creatives live in [public/ads/](public/ads/). Prompts in [docs/ad-creative-prompts.md](docs/ad-creative-prompts.md). Brief for human creators in [docs/ad-creative-brief.md](docs/ad-creative-brief.md).
- Mother's Day is 2026-05-10 — time-sensitive. Don't schedule non-critical refactors that block that ship window.
