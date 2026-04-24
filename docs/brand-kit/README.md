# Paw Masterpiece Brand Kit

_Drop-in package for creating a Gemini Gem (or any other AI agent) that generates on-brand ad creative, writes marketing copy, and understands the business context._

## What's in here

```
brand-kit/
├── README.md                            ← you are here
├── gemini-gem-instructions.md           ← paste this into Gemini → Gems → Instructions
├── 01-brand-voice.md                    ← tone, approved/banned phrases
├── 02-visual-identity.md                ← colors, fonts, composition rules
├── 03-marketing-strategy.md             ← positioning, personas, campaigns
├── 04-ad-concepts.md                    ← three proven variants + hook library
├── 05-product-catalog.md                ← SKUs, prices, when to promote each
├── logo/
│   ├── logo.jpg                         ← canonical logo (current, tight crop)
│   └── logo.png                         ← alternate with transparent background
├── style-examples/
│   ├── watercolor.png                   ← example portrait output per style
│   ├── oil.png
│   ├── renaissance.png
│   └── lineart.png
└── ads/
    └── example-renaissance-reveal.png   ← shipping ad to reference tone + composition
```

## How to use

### Option A — Create a Gemini Gem (recommended)

1. Go to **gemini.google.com/gems/view**
2. Click **+ New Gem**
3. Name it: `Paw Masterpiece Ad Creator`
4. Paste the contents of `gemini-gem-instructions.md` into the **Instructions** field
5. Click **Add knowledge** and upload **every file in this folder** (all `.md` files + all `.png` / `.jpg` in subfolders)
6. Save. The Gem now has full brand + marketing context.

### Option B — Pass to Claude Projects, ChatGPT, or another agent

Use `gemini-gem-instructions.md` as the system prompt, upload the rest of the folder as knowledge files. The structure is agent-agnostic.

## Keeping it current

This folder is version-controlled. When brand / pricing / voice changes:
1. Edit the relevant `.md` file in this directory
2. Commit + push
3. Re-upload the updated files to the Gem's knowledge base (Gemini doesn't auto-sync from repos yet)
