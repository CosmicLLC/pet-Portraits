# Visual Identity — Paw Masterpiece

## Logo

- **Primary**: `logo/logo.jpg` — paw print on easel, solid composition, white background. Use whenever a logo is needed on a brand color background (cream, green, gold). The white BG reads as a light framing on cream.
- **Alternate**: `logo/logo.png` — same paw-on-easel, transparent background. Use on photography backgrounds where the white frame would clash.
- **Wordmark**: `PAW MASTERPIECE` set in Playfair Display, weight 700–800, letter-spaced slightly for display use.
- **Lockup**: logo-mark on the left + wordmark on the right, horizontally aligned, mark height = wordmark cap height × 1.4.
- **Clearspace**: at least one logo-mark width of empty space on every side.

## Palette

| Token | Hex | Use |
| --- | --- | --- |
| `brand-green` | `#2D4A3E` | Primary. Headlines, CTA pills, logo mark, URL lines |
| `brand-gold` | `#C4A35A` | Accent. Small rules, star ratings, badges — never big blocks |
| `cream` | `#FAF7F2` | Primary background. Warm neutral, not pure white |
| `ink` | `#1C1C1C` | Body copy when brand-green is too dim |
| `muted` | `#666666` | Subheads, captions, secondary info |

Forbidden: pure black (`#000`), pure white (`#FFF`), neon / saturated color accents. Stay in the warm palette.

## Typefaces

- **Display / headlines**: Playfair Display, weights 700–800, occasionally italic for emphasis. Loaded via `next/font` as `--font-display`.
- **Body / UI**: DM Sans, weights 400 / 500 / 600 / 700. Loaded via `next/font` as `--font-body`.
- **Mono** (rare — admin UI only): system monospace.

## Composition rules for photography + imagery

Every ad image or product photo should follow:

1. **Natural daylight, never flash.** Warm afternoon or morning light. Window-left lighting is the house look.
2. **Editorial lifestyle, not studio.** Kinfolk / Magnolia / New England coastal moodboards — warm, lived-in, slightly imperfect.
3. **Warm cream / olive / muted gold palette** in the scene. Avoid blue-tinted interiors, cool grey modern apartments, neon.
4. **Subject-in-reaction beats subject-facing-camera.** A gifter's face mid-reaction is the money shot. Studio grins kill conversion.
5. **Mid-motion detail.** Tissue paper falling, coffee steaming, a hand reaching. Frozen-stiff staging reads fake.
6. **50mm-equivalent focal length.** Shallow depth of field, subtle bokeh, natural perspective.
7. **No children.** Protects the brand, avoids ad-platform delays.
8. **No competitor products or visible brand names** anywhere in frame.
9. **Pet must be photorealistic even when the portrait is stylized.** The subject is a real animal, not a cartoon character.

## Composition rules for ad layouts

Every ad renders across three bands stacked vertically:

```
┌──────────────────────────────┐
│  Brand lockup + accent rule  │   ← logo + wordmark + thin gold line
├──────────────────────────────┤
│                              │
│      HERO PHOTOGRAPH         │   ← the emotional moment, bleed-to-edge
│                              │
├──────────────────────────────┤
│  Headline (Playfair, green)  │
│  Subhead (DM Sans, muted)    │
│  [ CTA pill, green ]         │
│  pawmasterpiece.com (green)  │
└──────────────────────────────┘
```

- Cream background on top + bottom bands, photograph in the middle.
- Small cream pill badge in the bottom-left corner of the photograph carrying the trust signal ("★ 4.9 · Ships in 3–5 days"). This is the only element that crosses into the photograph.
- CTA pill is always brand-green fill + cream text, rounded fully.
- Headline is always Playfair 800, brand-green, centered, max 3 lines.
- URL line under the CTA is brand-green + 600 weight (not muted gray — it's a brand reinforcement surface).

## When someone asks for "a modern look"

They mean: cream + gold + warm olive + cream-linen sofas + natural light + eucalyptus + Brooklyn brownstone. They don't mean: blue tech gradients, neon, glassmorphism, or corporate grey.

## Four portrait styles (the product itself)

See `style-examples/` for reference images. When generating portraits or referencing them in ad prompts:

- **Watercolor** — loose expressive brushwork, delicate ink outlines, pastel palette, white watercolor paper background. "Soft, dreamy, gift-perfect." Mother's Day bestseller.
- **Oil painting** — Flemish 17th-century, rich impasto, warm chiaroscuro, deep jewel-toned background. "Rich, classic, museum-worthy." Father's Day bestseller.
- **Renaissance** — royal court portrait, velvet robes, white lace ruff, gold chain, burgundy drapery, gold leaf. "Royal, regal, shareable." Christmas bestseller. This is our unique pattern-break style — competitors can't match it.
- **Line art** — single-line continuous drawing, fine black ink on cream, minimalist Scandinavian illustration. "Clean, modern, minimal." Birthday and minimalist-decor bestseller.

Every ad prompt must specify which of the four styles the portrait in frame is. Default to watercolor if unsure.
