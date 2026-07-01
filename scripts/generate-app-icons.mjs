#!/usr/bin/env node
/**
 * Generate the app icon family from one deterministic SVG source.
 *
 * Outputs:
 * - public/icons/icon.svg
 * - public/icons/icon-maskable.svg
 * - public/icons/apple-touch-icon.svg
 * - public/icons/icon-192.png
 * - public/icons/icon-512.png
 * - public/icons/icon-maskable-512.png
 * - public/icons/apple-touch-icon.png
 * - src/app/favicon.ico
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ICONS_DIR = resolve(ROOT, "public/icons");
const FAVICON_PATH = resolve(ROOT, "src/app/favicon.ico");

function appIconSvg({ size = 512, radius = 108, safeInset = 58 } = {}) {
  const s = size;
  const scale = s / 512;
  const px = (value) => Number((value * scale).toFixed(3));
  const r = px(radius);
  const inset = px(safeInset);
  const id = `qui-${s}-${safeInset}-${radius}`;
  const hexPoints = [
    [256, 84],
    [386, 158],
    [386, 318],
    [256, 428],
    [126, 318],
    [126, 158],
  ]
    .map(([x, y]) => `${px(x)},${px(y)}`)
    .join(" ");
  const innerHexPoints = [
    [256, 134],
    [342, 184],
    [342, 300],
    [256, 374],
    [170, 300],
    [170, 184],
  ]
    .map(([x, y]) => `${px(x)},${px(y)}`)
    .join(" ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" fill="none">
  <defs>
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="${s}" y2="${s}" gradientUnits="userSpaceOnUse">
      <stop stop-color="#08061f"/>
      <stop offset=".58" stop-color="#111827"/>
      <stop offset="1" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="${id}-frame" x1="${px(132)}" y1="${px(96)}" x2="${px(388)}" y2="${px(420)}" gradientUnits="userSpaceOnUse">
      <stop stop-color="#c4b5fd"/>
      <stop offset=".42" stop-color="#8b5cf6"/>
      <stop offset="1" stop-color="#5b21b6"/>
    </linearGradient>
    <linearGradient id="${id}-face" x1="${px(180)}" y1="${px(150)}" x2="${px(336)}" y2="${px(360)}" gradientUnits="userSpaceOnUse">
      <stop stop-color="#171333"/>
      <stop offset="1" stop-color="#050315"/>
    </linearGradient>
    <linearGradient id="${id}-letters" x1="${px(168)}" y1="${px(202)}" x2="${px(348)}" y2="${px(294)}" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f5f3ff"/>
      <stop offset=".42" stop-color="#c4b5fd"/>
      <stop offset="1" stop-color="#8b5cf6"/>
    </linearGradient>
    <filter id="${id}-shadow" x="-20%" y="-20%" width="140%" height="150%" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="${px(18)}" stdDeviation="${px(20)}" flood-color="#020617" flood-opacity=".55"/>
      <feDropShadow dx="0" dy="0" stdDeviation="${px(16)}" flood-color="#8b5cf6" flood-opacity=".34"/>
    </filter>
  </defs>
  <rect width="${s}" height="${s}" rx="${r}" fill="url(#${id}-bg)"/>
  <path d="M${inset} ${px(150)}h${px(420 - safeInset)}M${inset} ${px(256)}h${px(420 - safeInset)}M${inset} ${px(362)}h${px(420 - safeInset)}M${px(150)} ${inset}v${px(420 - safeInset)}M${px(256)} ${inset}v${px(420 - safeInset)}M${px(362)} ${inset}v${px(420 - safeInset)}" stroke="#22d3ee" stroke-opacity=".12" stroke-width="${px(5)}"/>
  <ellipse cx="${px(256)}" cy="${px(260)}" rx="${px(196)}" ry="${px(72)}" stroke="#22d3ee" stroke-opacity=".38" stroke-width="${px(9)}" transform="rotate(-18 ${px(256)} ${px(260)})"/>
  <ellipse cx="${px(256)}" cy="${px(260)}" rx="${px(188)}" ry="${px(66)}" stroke="#c4b5fd" stroke-opacity=".55" stroke-width="${px(10)}" transform="rotate(24 ${px(256)} ${px(260)})"/>
  <g filter="url(#${id}-shadow)">
    <polygon points="${hexPoints}" fill="url(#${id}-frame)"/>
    <polygon points="${innerHexPoints}" fill="url(#${id}-face)" stroke="#ede9fe" stroke-opacity=".34" stroke-width="${px(6)}"/>
    <path d="M${px(156)} ${px(174)}L${px(256)} ${px(116)}L${px(356)} ${px(174)}" stroke="#ede9fe" stroke-opacity=".48" stroke-width="${px(10)}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${px(148)} ${px(318)}L${px(256)} ${px(408)}L${px(364)} ${px(318)}" stroke="#4c1d95" stroke-opacity=".45" stroke-width="${px(12)}" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="${px(256)}" y="${px(285)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${px(112)}" font-weight="900" letter-spacing="${px(-5)}" fill="#4c1d95" opacity=".62">QUI</text>
    <text x="${px(256)}" y="${px(274)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${px(112)}" font-weight="900" letter-spacing="${px(-5)}" fill="url(#${id}-letters)">QUI</text>
  </g>
  <circle cx="${px(380)}" cy="${px(168)}" r="${px(12)}" fill="#c4b5fd"/>
  <circle cx="${px(132)}" cy="${px(342)}" r="${px(9)}" fill="#22d3ee" fill-opacity=".84"/>
</svg>
`;
}

async function pngFromSvg(svg, size) {
  return sharp(Buffer.from(svg)).resize(size, size, { fit: "fill" }).png({
    compressionLevel: 9,
    adaptiveFiltering: true,
  }).toBuffer();
}

function createIco(entries) {
  const headerSize = 6;
  const directorySize = entries.length * 16;
  const imageOffsetStart = headerSize + directorySize;
  let imageOffset = imageOffsetStart;
  const buffers = [Buffer.alloc(headerSize), Buffer.alloc(directorySize), ...entries.map((entry) => entry.data)];

  buffers[0].writeUInt16LE(0, 0);
  buffers[0].writeUInt16LE(1, 2);
  buffers[0].writeUInt16LE(entries.length, 4);

  entries.forEach((entry, index) => {
    const offset = index * 16;
    const directory = buffers[1];
    directory[offset] = entry.size >= 256 ? 0 : entry.size;
    directory[offset + 1] = entry.size >= 256 ? 0 : entry.size;
    directory[offset + 2] = 0;
    directory[offset + 3] = 0;
    directory.writeUInt16LE(1, offset + 4);
    directory.writeUInt16LE(32, offset + 6);
    directory.writeUInt32LE(entry.data.length, offset + 8);
    directory.writeUInt32LE(imageOffset, offset + 12);
    imageOffset += entry.data.length;
  });

  return Buffer.concat(buffers);
}

mkdirSync(ICONS_DIR, { recursive: true });

const iconSvg = appIconSvg({ size: 64, radius: 112, safeInset: 52 });
const fullSvg = appIconSvg({ size: 512, radius: 108, safeInset: 58 });
const maskableSvg = appIconSvg({ size: 512, radius: 120, safeInset: 92 });
const appleSvg = appIconSvg({ size: 180, radius: 114, safeInset: 74 });

writeFileSync(resolve(ICONS_DIR, "icon.svg"), iconSvg);
writeFileSync(resolve(ICONS_DIR, "icon-maskable.svg"), maskableSvg);
writeFileSync(resolve(ICONS_DIR, "apple-touch-icon.svg"), appleSvg);

const icon192 = await pngFromSvg(fullSvg, 192);
const icon512 = await pngFromSvg(fullSvg, 512);
const maskable512 = await pngFromSvg(maskableSvg, 512);
const apple180 = await pngFromSvg(appleSvg, 180);
const faviconEntries = await Promise.all(
  [16, 32, 48, 256].map(async (size) => ({
    size,
    data: await pngFromSvg(appIconSvg({ size: 512, radius: 108, safeInset: 58 }), size),
  })),
);

writeFileSync(resolve(ICONS_DIR, "icon-192.png"), icon192);
writeFileSync(resolve(ICONS_DIR, "icon-512.png"), icon512);
writeFileSync(resolve(ICONS_DIR, "icon-maskable-512.png"), maskable512);
writeFileSync(resolve(ICONS_DIR, "apple-touch-icon.png"), apple180);
writeFileSync(FAVICON_PATH, createIco(faviconEntries));

console.log("Generated app icon family.");
