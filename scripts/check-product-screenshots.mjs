#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const MAX_PUBLIC_BYTES = 2 * 1024 * 1024;
const ROOT = process.cwd();

const REQUIRED_SCREENSHOTS = [
  ["public/screenshots/A1-Workflow-Home/desktop-light.png", 1440, 1000],
  ["public/screenshots/A1-Workflow-Home/desktop-dark.png", 1440, 1000],
  ["public/screenshots/A1-Workflow-Home/tablet-light.png", 840, 1000],
  ["public/screenshots/A1-Workflow-Home/mobile-dark.png", 390, 844],
  ["public/screenshots/A2-Upload-Flow/desktop-light.png", 1440, 1000],
  ["public/screenshots/A2-Upload-Flow/tablet-dark.png", 840, 1000],
  ["public/screenshots/A2-Upload-Flow/mobile-light.png", 390, 844],
  ["public/screenshots/A3-Post-Analysis/desktop-light.png", 1440, 1000],
  ["public/screenshots/A3-Post-Analysis/desktop-dark.png", 1440, 1000],
  ["public/screenshots/A3-Post-Analysis/mobile-dark.png", 390, 844],
  ["public/screenshots/A4-Detector-Editor/desktop-light.png", 1440, 1000],
  ["public/screenshots/A4-Detector-Editor/mobile-light.png", 390, 844],
  ["public/screenshots/A5-Export-Package/desktop-light.png", 1440, 1000],
  ["public/screenshots/A5-Export-Package/mobile-dark.png", 390, 844],
  ["public/screenshots/A6-Sample-Run/desktop-dark.png", 1440, 1000],
  ["public/screenshots/A6-Sample-Run/mobile-light.png", 390, 844],
  ["public/screenshots/A7-Design-System/desktop-light.png", 1440, 1000],
  ["public/screenshots/A7-Design-System/desktop-dark.png", 1440, 1000],
  ["public/screenshots/A7-Design-System/tablet-light.png", 840, 1000],
  ["public/screenshots/A7-Design-System/mobile-dark.png", 390, 844],
  ["public/screenshots/A8-UX-Laws/desktop-light.png", 1440, 1000],
  ["public/screenshots/A8-UX-Laws/mobile-dark.png", 390, 844],
  ["public/screenshots/A9-Profile-Modal/desktop-dark.png", 1440, 1000],
  ["public/screenshots/A9-Profile-Modal/mobile-light.png", 390, 844],
  ["public/screenshots/A10-Share-Result/desktop-light.png", 1440, 1000],
  ["public/screenshots/A10-Share-Result/mobile-dark.png", 390, 844],
  ["public/screenshots/A11-404-And-Recovery/desktop-light.png", 1440, 1000],
  ["public/screenshots/A11-404-And-Recovery/mobile-dark.png", 390, 844],
  ["public/screenshots/A12-PWA-Offline/desktop-light.png", 1440, 1000],
  ["public/screenshots/A12-PWA-Offline/mobile-dark.png", 390, 844],
];

const REQUIRED_MOCKUPS = [
  ["public/mock-ups/A1-device-showcase.png", 1600, 1000],
  ["public/mock-ups/A2-feature-gallery.png", 1600, 1000],
  ["public/mock-ups/A3-theme-viewport-matrix.png", 1600, 1000],
];

const REQUIRED_DOC_ASSETS = [
  "docs/assets/qwen-ui-lab-workflow-desktop.png",
  "docs/assets/qwen-ui-lab-design-system-mobile.png",
  "docs/assets/qwen-ui-lab-archive-cover.png",
];

function fail(message) {
  console.error(`Product screenshot check failed: ${message}`);
  process.exit(1);
}

function readPngSize(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`Missing ${relativePath}`);
  }
  const buffer = readFileSync(absolutePath);
  if (buffer.length < 24 || buffer.readUInt32BE(0) !== 0x89504e47) {
    fail(`${relativePath} is not a PNG`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function assertPng(relativePath, expectedWidth, expectedHeight, maxBytes = MAX_PUBLIC_BYTES) {
  const absolutePath = join(ROOT, relativePath);
  const { width, height } = readPngSize(relativePath);
  if (width !== expectedWidth || height !== expectedHeight) {
    fail(`${relativePath} is ${width}x${height}; expected ${expectedWidth}x${expectedHeight}`);
  }
  const size = statSync(absolutePath).size;
  if (size > maxBytes) {
    fail(`${relativePath} is ${(size / 1024).toFixed(1)} KiB; max is ${(maxBytes / 1024).toFixed(1)} KiB`);
  }
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    fail(`${label} does not include ${needle}`);
  }
}

for (const [path, width, height] of REQUIRED_SCREENSHOTS) {
  assertPng(path, width, height);
}

for (const [path, width, height] of REQUIRED_MOCKUPS) {
  assertPng(path, width, height);
}

for (const path of REQUIRED_DOC_ASSETS) {
  const { width, height } = readPngSize(path);
  if (width < 390 || height < 800) {
    fail(`${path} is unexpectedly small: ${width}x${height}`);
  }
}

const readme = readFileSync(join(ROOT, "README.md"), "utf8");
const catalog = readFileSync(join(ROOT, "docs", "SCREENSHOTS.md"), "utf8");
const manifest = JSON.parse(readFileSync(join(ROOT, "public", "manifest.json"), "utf8"));
const seoSource = readFileSync(join(ROOT, "src", "lib", "seo.ts"), "utf8");

for (const path of [
  "docs/assets/qwen-ui-lab-workflow-desktop.png",
  "docs/assets/qwen-ui-lab-design-system-mobile.png",
  "docs/assets/qwen-ui-lab-archive-cover.png",
  "docs/SCREENSHOTS.md",
  "public/mock-ups/A1-device-showcase.png",
  "public/mock-ups/A2-feature-gallery.png",
  "public/mock-ups/A3-theme-viewport-matrix.png",
]) {
  assertIncludes(readme, path, "README");
}

for (const [path] of [...REQUIRED_SCREENSHOTS, ...REQUIRED_MOCKUPS]) {
  assertIncludes(catalog, `../${path}`, "docs/SCREENSHOTS.md");
}

const screenshotSources = (manifest.screenshots ?? []).map((screenshot) => screenshot.src);
for (const expected of [
  "/screenshots/A1-Workflow-Home/desktop-light.png",
  "/screenshots/A2-Upload-Flow/mobile-light.png",
]) {
  if (!screenshotSources.includes(expected)) {
    fail(`manifest screenshots do not include ${expected}`);
  }
  assertIncludes(seoSource, expected, "src/lib/seo.ts");
}

for (const screenshot of manifest.screenshots ?? []) {
  const relativePath = screenshot.src?.startsWith("/") ? screenshot.src.slice(1) : screenshot.src;
  if (!relativePath) fail("manifest screenshot entry is missing src");
  const size = readPngSize(join("public", relativePath));
  if (screenshot.sizes !== `${size.width}x${size.height}`) {
    fail(`${screenshot.src} declares ${screenshot.sizes}; actual is ${size.width}x${size.height}`);
  }
}

console.log(
  `Product screenshot archive passed: ${REQUIRED_SCREENSHOTS.length} captures, ${REQUIRED_MOCKUPS.length} mockups, ${REQUIRED_DOC_ASSETS.length} docs assets.`,
);
