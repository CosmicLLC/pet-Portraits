# Ad Creative Prompts — Paw Masterpiece

_Companion to [ad-creative-brief.md](./ad-creative-brief.md)._
_Version 1.0 — 2026-04-24._

Ready-to-paste prompts for AI image + video generators. Each variant has:

1. **Primary prompt** — paste into Midjourney, Imagen 4, DALL-E, or Ideogram
2. **Aspect-ratio flags** — `--ar 1:1` (feed) / `--ar 9:16` (Reels/Stories) / `--ar 4:5` (IG feed)
3. **Negative prompt** — what to suppress
4. **Copy block** — headline, subhead, CTA, ready to layer in Figma

After generating, bring into Figma / Canva to add text overlays and the Paw Masterpiece logo (brand-green + brand-gold, Playfair Display for headlines, DM Sans for body).

---

## Variant A — The Renaissance Reveal (static image, all placements)

**Thesis:** Break pattern recognition. Every pet-portrait ad in your feed right now is minimalist line art. Yours is a dog in Renaissance velvet + gold frame being unwrapped. Scroll-stopper.

### Midjourney / Imagen / Ideogram

```
Cinematic lifestyle photo of a woman in her late 30s sitting on a cream linen sofa in a warm modern living room, mid-reaction to unwrapping a large framed gift. Her hands are pressed to her mouth, eyes shimmering with tears, soft smile breaking through. Tissue paper still mid-air around the frame. Her partner sits beside her smiling gently at her reaction, not at the gift. The gift is a 11x14 framed Renaissance-style oil painting of a golden retriever wearing a red velvet royal robe with a white lace ruff collar, gold chain, set against a deep burgundy draped background, painted in the style of 17th century Flemish portraiture. The pet's name "CHARLIE" is engraved in small serif type at the bottom of the frame. Natural afternoon daylight streaming through a window to the left, warm cream and olive color palette, subtle gold accents, shallow depth of field, shot on 50mm lens, photoreal, editorial lifestyle photography, Kinfolk magazine aesthetic, candid but polished. --ar 1:1 --v 6 --s 250
```

### Aspect ratio variants

- Square (IG feed): `--ar 1:1`
- Reels / Stories: `--ar 9:16` + reframe so the portrait holds the top third and the woman's face sits center
- IG feed vertical: `--ar 4:5`

### Negative prompt (paste if your tool supports it)

```
no text, no logos, no watermarks, no blurry faces, no uncanny valley, no distorted hands, no modern smartphone visible, no children, no cluttered background, no studio lighting, no flash, no harsh shadows, no brand names on furniture
```

### Copy to overlay in post

- **Hook headline:** "She Saw Him In Oil Paint And Cried Harder Than Our Wedding."
- **Subhead:** "Real reactions. Real pet moms. 4.9★ from 40,000+ pet parents."
- **CTA button:** "Preview Free — 30 Seconds"
- **Corner badge (optional):** "⭐ 4.9 · Ships in 3–5 days"

---

## Variant B — The Four-Style Grid (carousel or single 2×2)

**Thesis:** Their competitor ships one style. You ship four. Show them all in a single frame and the choice-overload becomes a feature, not a bug.

### Midjourney prompt (per tile — generate 4, composite in Figma)

**Tile 1 — Watercolor**

```
Soft watercolor painting of a golden retriever's head and shoulders portrait, loose expressive brushwork, delicate ink outlines, pastel cream and warm beige palette with gentle gold-leaf background accents, white paper visible through the pigment, modern watercolor illustration style, framed as a 11x14 minimalist white-matted art print against a cream wall. --ar 4:5 --v 6
```

**Tile 2 — Oil Painting**

```
Rich impasto oil painting portrait of the same golden retriever, Flemish 17th-century portraiture tradition, warm dramatic chiaroscuro lighting, deep jewel-toned emerald and ochre background, visible brushstrokes, museum-quality composition, framed in a simple gold wood frame. --ar 4:5 --v 6
```

**Tile 3 — Renaissance**

```
Royal Renaissance oil painting of the same golden retriever wearing a crimson velvet robe with a white lace ruff collar and a gold chain, seated against deep burgundy drapery and a 16th-century Tudor interior background, painted in the style of Hans Holbein the Younger, framed in an ornate gilt-gold frame. --ar 4:5 --v 6
```

**Tile 4 — Line Art**

```
Minimalist single-line continuous-line drawing of the same golden retriever's head and shoulders, fine black ink on cream paper, modern Scandinavian illustration style, mounted in a thin black wood frame, gallery aesthetic. --ar 4:5 --v 6
```

### Composite layout

In Figma, assemble the 4 tiles into a 2×2 grid on a cream background (#FAF7F2), each tile framed with a subtle 1px warm-gray border. Overlay a caption running across the bottom.

### Copy to overlay

- **Hook headline:** "I Couldn't Pick. So I Got All Four."
- **Subhead:** "Four artistic styles. One pet. 30-second preview, free."
- **Pet name strip (optional):** "CHARLIE — aged 3 — best boy"
- **CTA button:** "Try All Four Free"

---

## Variant C — The Speed Hook (Reels / TikTok video, 15–20s)

**Thesis:** Speed is your unique angle. A POV video where the whole workflow fits in a Reels slot is uniquely yours — competitors physically can't match it.

### Shot-by-shot storyboard

| Time | Shot | Direction | Audio / on-screen text |
| --- | --- | --- | --- |
| 0.0–2.0s | CU: creator's worried face, phone in hand | Handheld, natural light | **Text:** "POV: I'm 6 hours from Mother's Day. No gift." |
| 2.0–4.0s | Screen-record: phone opens `pawmasterpiece.com` | Clean screen capture, finger tapping visible | SFX: phone tap |
| 4.0–6.0s | Screen-record: upload photo of mom's dog (from camera roll) | Hold on the upload interaction | SFX: swoosh as upload completes |
| 6.0–9.0s | Screen-record: 4 style thumbnails appear, creator taps "Watercolor" | Emphasize the four-style choice | **Text:** "30 seconds" with countdown timer |
| 9.0–12.0s | Screen-record: preview animates in — the watercolor portrait of mom's dog | Let the reveal breathe — 2 full seconds on the result | Creator voice-over: "Oh my god." |
| 12.0–15.0s | Cut to: canvas on mom's wall the next day, mom on video call, her hand at her mouth | Warm home interior, window light | **Text:** "She thinks I planned this for months." |
| 15.0–18.0s | End card | Brand-green background, logo, CTA | **Text:** "pawmasterpiece.com — preview free in 30 seconds" |

### Veo 3 / Sora 2 / Runway Gen-3 prompt (for the reaction shot, 12.0–15.0s)

```
Cinematic vertical 9:16 video, 4 seconds, of a woman in her 60s wearing a cream cashmere sweater, sitting on a beige linen sofa in a warm modern living room with afternoon sunlight streaming through a left window. She is looking up at a 8x12 framed watercolor portrait of her golden retriever hanging on a cream wall. Her hand slowly rises to cover her mouth, eyes shimmering. She does not speak. Subtle natural camera push-in, shallow depth of field, 50mm lens feel, editorial warmth, candid family-moment aesthetic. Soft ambient room tone, no music, no speaking.
```

### Copy / text overlays

- **Hook:** "POV: I'm 6 hours from Mother's Day. No gift."
- **Pivot:** "30 seconds"
- **Payoff:** "She thinks I planned this for months."
- **End card:** "pawmasterpiece.com — preview free in 30 seconds · 3–5 day ship"

### Audio bed

- **Beat 0–9s:** Trending-but-subtle TikTok audio (pick from IG Reels Audio library — look for "hopeful/soft piano" under 30s)
- **Beat 9–12s:** Audio dips for the reveal gasp
- **Beat 12–18s:** Audio resumes, fades out under end card

### Deliverables

- 9:16 vertical master (1080×1920, 30fps, mp4, under 4MB for IG/TikTok upload)
- 1:1 square cut-down (0–15s portion only)
- Thumbnail: freeze on the 9.0s preview-appears frame

---

## Prompt-writing notes for your future variants

Rotate these modifiers into new variants so the ads don't feel templated:

### Pet swaps (cover more market segments)

Replace "golden retriever" with one of these per shoot — each has its own audience:

- "black and white border collie" — broad appeal, photogenic
- "french bulldog" — urban millennial core demo
- "tuxedo cat" — cat-parent audience we underserve
- "senior labrador with gray muzzle" — memorial-adjacent, soft gift angle
- "mixed-breed rescue dog" — Instagram wholesome audience
- "orange tabby cat" — highest cat share rate in testing

### Setting swaps (cover more aesthetics)

Replace "modern cream living room" with:

- "sunlit Brooklyn brownstone kitchen"
- "minimalist Scandinavian bedroom with white bedding and eucalyptus"
- "rustic farmhouse wood dining table with morning light"
- "LA mid-century modern office with a framed gallery wall"
- "cozy Boston apartment window seat with a cream throw"

### Reaction variants (beyond tears)

- Wordless slow-smile build
- Laughter breaking into tears
- Hand over heart, silence
- Partner filming on phone for the family group chat

### Tone-shift for campaign moment

- **Mother's Day:** warm sofa reveal with her adult child filming
- **Father's Day:** office-desk reveal, canvas on the desk, coworker background
- **Christmas:** wrapped under tree, family gathered, unwrap ambient holiday audio
- **Birthday:** casual kitchen counter reveal, no wrapping, just "look what I made for your dog"
- **Memorial (separate campaign, different creator):** no reveal — quiet single shot of the portrait on a mantel beside a candle, slow pan, no faces

---

## Banned in prompts (matches ad-creative-brief.md)

Don't include in any AI generation prompt:

- The word "AI" anywhere in the image
- Stopwatch / countdown imagery (too aggressive)
- Children (protects model rights & reduces recall risk)
- Logos of other brands (Apple, Nike, etc.)
- Stock-looking posed faces (specify "candid" and "editorial" to suppress)
- Overly saturated Pinterest-AI aesthetic (specify "photoreal" and "lifestyle photography" to suppress)
