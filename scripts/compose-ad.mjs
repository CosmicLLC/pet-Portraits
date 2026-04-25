// Compose the Meta-ready ad creative at every placement size.
// Runs server-side via sharp so the output is deterministic, version-
// controlled, and reproducible — no Canva, no Figma round-trip.
//
// Usage: node scripts/compose-ad.mjs
// Outputs three PNGs to public/ads/:
//   paw-mothers-day-v1-1x1.png   (Meta feed)
//   paw-mothers-day-v1-4x5.png   (Meta feed vertical)
//   paw-mothers-day-v1-9x16.png  (Reels / Stories / TikTok)
//
// The text overlays are rendered as SVG, which sharp composites onto a
// cream canvas along with a cropped slice of the base photograph.
// Text uses Playfair Display (serif) and DM Sans (sans) via data-URL
// @font-face so the output looks identical to the on-site brand. Fonts
// are fetched once and cached to .cache/fonts.

import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..");
const BASE_IMAGE = path.join(ROOT, "public/ads/mothers-day-renaissance-reveal-v1.png");
const OUT_DIR = path.join(ROOT, "public/ads");
const CACHE_DIR = path.join(ROOT, ".cache/fonts");

const BRAND = {
  green: "#2D4A3E",
  gold: "#C4A35A",
  cream: "#FAF7F2",
  muted: "#666666",
};

const COPY = {
  headline1: "She Saw Him In Oil Paint",
  headline2: "And Cried Harder Than",
  headline3: "Our Wedding.",
  subhead: "Real reactions. Real pet moms. 4.9★ from 40,000+ pet parents.",
  ctaPrimary: "Preview Free — 30 Seconds",
  ctaSecondary: "pawmasterpiece.com",
  badge: "★ 4.9  ·  Ships in 3–5 days",
};

const SPECS = {
  "1x1": {
    W: 1080,
    H: 1080,
    topBandH: 280,
    photoH: 540,
    bottomBandH: 260,
    headlinePadTop: 36,
    headlineSize: 58,
    subheadSize: 22,
    subheadGap: 14,
    ctaBtnW: 520,
    ctaBtnH: 72,
    ctaPadTop: 50,
    ctaSize: 22,
    urlSize: 16,
    urlGap: 22,
    badgeH: 36,
    badgeFontSize: 15,
    badgePadX: 16,
  },
  "4x5": {
    W: 1080,
    H: 1350,
    topBandH: 320,
    photoH: 700,
    bottomBandH: 330,
    headlinePadTop: 50,
    headlineSize: 62,
    subheadSize: 24,
    subheadGap: 18,
    ctaBtnW: 580,
    ctaBtnH: 80,
    ctaPadTop: 70,
    ctaSize: 24,
    urlSize: 18,
    urlGap: 28,
    badgeH: 40,
    badgeFontSize: 17,
    badgePadX: 18,
  },
  "9x16": {
    W: 1080,
    H: 1920,
    topBandH: 460,
    photoH: 980,
    bottomBandH: 480,
    headlinePadTop: 110,
    headlineSize: 72,
    subheadSize: 28,
    subheadGap: 28,
    ctaBtnW: 680,
    ctaBtnH: 92,
    ctaPadTop: 120,
    ctaSize: 28,
    urlSize: 20,
    urlGap: 32,
    badgeH: 46,
    badgeFontSize: 19,
    badgePadX: 22,
  },
};

const FONTS = [
  {
    url: "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd2ULWw.woff2",
    family: "Playfair Display",
    weight: 800,
    style: "normal",
    file: "playfair-800.woff2",
  },
  {
    url: "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAop4.woff2",
    family: "DM Sans",
    weight: 500,
    style: "normal",
    file: "dmsans-500.woff2",
  },
  {
    url: "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAop8.woff2",
    family: "DM Sans",
    weight: 700,
    style: "normal",
    file: "dmsans-700.woff2",
  },
];

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function loadFontDataURL(font) {
  await mkdir(CACHE_DIR, { recursive: true });
  const diskPath = path.join(CACHE_DIR, font.file);
  if (!(await fileExists(diskPath))) {
    const res = await fetch(font.url);
    if (!res.ok) throw new Error(`Font fetch failed: ${font.url} ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(diskPath, buf);
  }
  const buf = await readFile(diskPath);
  return `data:font/woff2;base64,${buf.toString("base64")}`;
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function buildOverlaySvg(spec, fontsCss) {
  const { W, H, topBandH, photoH, bottomBandH } = spec;

  // Top band: headline + subhead
  const hl1Y = spec.headlinePadTop + spec.headlineSize * 0.8;
  const hl2Y = hl1Y + spec.headlineSize * 1.08;
  const hl3Y = hl2Y + spec.headlineSize * 1.08;
  const subheadY = hl3Y + spec.subheadGap + spec.subheadSize * 0.8;

  // Bottom band: CTA button + URL
  const btnX = (W - spec.ctaBtnW) / 2;
  const btnY = H - bottomBandH + spec.ctaPadTop;
  const btnRadius = spec.ctaBtnH / 2;
  const ctaTextY = btnY + spec.ctaBtnH / 2 + spec.ctaSize * 0.35;
  const urlY = btnY + spec.ctaBtnH + spec.urlGap + spec.urlSize * 0.8;

  // Badge over the photo, bottom-left corner
  const badgeY = topBandH + photoH - spec.badgeH - 24;
  const badgeTextY = badgeY + spec.badgeH / 2 + spec.badgeFontSize * 0.35;
  // Use a heuristic width for the badge — real measure happens at render time
  // but SVG text width varies; we size generously.
  const badgeW = spec.badgeFontSize * 12 + spec.badgePadX * 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <style>
        ${fontsCss}
        .hl  { fill: ${BRAND.green}; font-family: "Playfair Display", serif; font-weight: 800; text-anchor: middle; }
        .sh  { fill: ${BRAND.muted}; font-family: "DM Sans", sans-serif; font-weight: 500; text-anchor: middle; }
        .cta { fill: ${BRAND.cream}; font-family: "DM Sans", sans-serif; font-weight: 700; text-anchor: middle; }
        .url { fill: ${BRAND.muted}; font-family: "DM Sans", sans-serif; font-weight: 500; text-anchor: middle; }
        .bdg { fill: ${BRAND.green}; font-family: "DM Sans", sans-serif; font-weight: 600; text-anchor: start; }
      </style>
    </defs>

    <!-- Headline -->
    <text class="hl" x="${W / 2}" y="${hl1Y}" font-size="${spec.headlineSize}">${escapeXml(COPY.headline1)}</text>
    <text class="hl" x="${W / 2}" y="${hl2Y}" font-size="${spec.headlineSize}">${escapeXml(COPY.headline2)}</text>
    <text class="hl" x="${W / 2}" y="${hl3Y}" font-size="${spec.headlineSize}">${escapeXml(COPY.headline3)}</text>

    <!-- Subhead -->
    <text class="sh" x="${W / 2}" y="${subheadY}" font-size="${spec.subheadSize}">${escapeXml(COPY.subhead)}</text>

    <!-- Badge pill over photo -->
    <rect x="24" y="${badgeY}" width="${badgeW}" height="${spec.badgeH}" rx="${spec.badgeH / 2}" fill="rgba(250,247,242,0.92)"/>
    <text class="bdg" x="${24 + spec.badgePadX}" y="${badgeTextY}" font-size="${spec.badgeFontSize}">${escapeXml(COPY.badge)}</text>

    <!-- CTA pill -->
    <rect x="${btnX}" y="${btnY}" width="${spec.ctaBtnW}" height="${spec.ctaBtnH}" rx="${btnRadius}" fill="${BRAND.green}"/>
    <text class="cta" x="${W / 2}" y="${ctaTextY}" font-size="${spec.ctaSize}">${escapeXml(COPY.ctaPrimary)}</text>

    <!-- URL under CTA -->
    <text class="url" x="${W / 2}" y="${urlY}" font-size="${spec.urlSize}">${escapeXml(COPY.ctaSecondary)}</text>
  </svg>`;
}

async function composePlacement(spec, size, baseMeta, basePhoto, fontsCss) {
  const { W, H, topBandH, photoH } = spec;

  // Create the cream canvas
  const canvas = sharp({
    create: { width: W, height: H, channels: 4, background: BRAND.cream },
  });

  // Crop the base image to the photo-band aspect ratio, centered.
  const bandRatio = W / photoH;
  const imgRatio = baseMeta.width / baseMeta.height;
  let extractW, extractH, extractL, extractT;
  if (imgRatio > bandRatio) {
    extractH = baseMeta.height;
    extractW = Math.round(baseMeta.height * bandRatio);
    extractL = Math.round((baseMeta.width - extractW) / 2);
    extractT = 0;
  } else {
    extractW = baseMeta.width;
    extractH = Math.round(baseMeta.width / bandRatio);
    extractL = 0;
    extractT = Math.round((baseMeta.height - extractH) / 2);
  }

  const croppedPhoto = await sharp(basePhoto)
    .extract({ left: extractL, top: extractT, width: extractW, height: extractH })
    .resize(W, photoH)
    .toBuffer();

  const overlaySvg = await buildOverlaySvg(spec, fontsCss);
  const overlayBuffer = Buffer.from(overlaySvg);

  const outPath = path.join(OUT_DIR, `paw-mothers-day-v1-${size}.png`);
  await canvas
    .composite([
      { input: croppedPhoto, top: topBandH, left: 0 },
      { input: overlayBuffer, top: 0, left: 0 },
    ])
    .png()
    .toFile(outPath);
  console.log(`  ✓ ${path.relative(ROOT, outPath)} (${W}×${H})`);
}

async function main() {
  console.log("Composing Paw Masterpiece Mother's Day ad creative…");

  // 1. Fetch fonts, embed as @font-face data URLs
  console.log("  Loading brand fonts…");
  const fontUrls = await Promise.all(FONTS.map(loadFontDataURL));
  const fontsCss = FONTS.map(
    (f, i) =>
      `@font-face{font-family:"${f.family}";font-style:${f.style};font-weight:${f.weight};src:url("${fontUrls[i]}") format("woff2");}`
  ).join("\n");

  // 2. Load base photograph + metadata
  const basePhoto = await readFile(BASE_IMAGE);
  const baseMeta = await sharp(basePhoto).metadata();

  // 3. Compose each placement
  for (const [size, spec] of Object.entries(SPECS)) {
    await composePlacement(spec, size, baseMeta, basePhoto, fontsCss);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Ad compose failed:", err);
  process.exit(1);
});
