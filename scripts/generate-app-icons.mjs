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
  const frameX = px(126);
  const frameY = px(132);
  const frameW = px(260);
  const frameH = px(232);
  const lensCx = px(306);
  const lensCy = px(300);
  const lensR = px(58);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" fill="none">
  <rect width="${s}" height="${s}" rx="${r}" fill="#0f172a"/>
  <path d="M${inset} ${px(134)}h${px(396 - safeInset)}M${inset} ${px(194)}h${px(396 - safeInset)}M${inset} ${px(254)}h${px(396 - safeInset)}M${inset} ${px(314)}h${px(396 - safeInset)}M${px(136)} ${inset}v${px(396 - safeInset)}M${px(196)} ${inset}v${px(396 - safeInset)}M${px(256)} ${inset}v${px(396 - safeInset)}M${px(316)} ${inset}v${px(396 - safeInset)}M${px(376)} ${inset}v${px(396 - safeInset)}" stroke="#22d3ee" stroke-opacity=".12" stroke-width="${px(5)}"/>
  <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" rx="${px(38)}" fill="#111827" stroke="#67e8f9" stroke-width="${px(18)}"/>
  <path d="M${px(166)} ${px(204)}h${px(128)}M${px(166)} ${px(250)}h${px(78)}M${px(166)} ${px(296)}h${px(96)}" stroke="#e0f2fe" stroke-width="${px(18)}" stroke-linecap="round"/>
  <rect x="${px(170)}" y="${px(334)}" width="${px(38)}" height="${px(68)}" rx="${px(12)}" fill="#34d399"/>
  <rect x="${px(230)}" y="${px(304)}" width="${px(38)}" height="${px(98)}" rx="${px(12)}" fill="#67e8f9"/>
  <rect x="${px(290)}" y="${px(274)}" width="${px(38)}" height="${px(128)}" rx="${px(12)}" fill="#a78bfa"/>
  <circle cx="${lensCx}" cy="${lensCy}" r="${lensR}" fill="#0f172a" stroke="#f8fafc" stroke-width="${px(22)}"/>
  <path d="M${px(346)} ${px(340)}l${px(70)} ${px(70)}" stroke="#f8fafc" stroke-width="${px(30)}" stroke-linecap="round"/>
  <path d="M${px(276)} ${px(300)}l${px(28)} ${px(28)} ${px(54)}-${px(72)}" stroke="#34d399" stroke-width="${px(18)}" stroke-linecap="round" stroke-linejoin="round"/>
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
