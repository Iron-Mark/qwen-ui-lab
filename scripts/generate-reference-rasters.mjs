#!/usr/bin/env node
/**
 * Rasterize bundled SVG references to PNG + WebP for realistic upload demos.
 * Run: node scripts/generate-reference-rasters.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REFERENCES_DIR = resolve(__dirname, "../public/references");

const RASTER_SOURCES = [
  { stem: "dashboard-reference", width: 1440, height: 900 },
  { stem: "auth-reference", width: 1200, height: 720 },
  { stem: "mobile-reference", width: 390, height: 844 },
];

async function rasterize({ stem, width, height }) {
  const svgPath = resolve(REFERENCES_DIR, `${stem}.svg`);
  if (!existsSync(svgPath)) {
    throw new Error(`Missing source SVG: ${svgPath}`);
  }

  const sanitized = readFileSync(svgPath, "utf8").replace(
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
    "—",
  );
  const input = Buffer.from(sanitized, "utf8");
  const pngPath = resolve(REFERENCES_DIR, `${stem}.png`);
  const webpPath = resolve(REFERENCES_DIR, `${stem}.webp`);

  const pngInfo = await sharp(input)
    .resize(width, height, { fit: "fill" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(pngPath);

  const webpInfo = await sharp(input)
    .resize(width, height, { fit: "fill" })
    .webp({ quality: 88, effort: 4 })
    .toFile(webpPath);

  return { stem, png: pngInfo, webp: webpInfo };
}

const results = await Promise.all(RASTER_SOURCES.map(rasterize));
for (const { stem, png, webp } of results) {
  console.log(
    `${stem}: png ${png.size} bytes (${png.width}×${png.height}), webp ${webp.size} bytes`,
  );
}
console.log("Reference rasters generated.");
