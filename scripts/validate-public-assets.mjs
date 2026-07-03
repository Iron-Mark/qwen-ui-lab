#!/usr/bin/env node
/**
 * Validates public/ assets referenced by manifest, layout, and service worker.
 * Used in CI (web-audits) and via npm run validate:assets.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const PUBLIC_ROOT = "public";
const MAX_BYTES = 2 * 1024 * 1024;
const CANDIDATE_ONLY_DIRS = new Set(["generated-assets"]);

/** Static files that must exist under public/ (layout + PWA). */
const REQUIRED_PUBLIC_PATHS = [
  "manifest.json",
  "sw.js",
  "offline.html",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "icons/apple-touch-icon.svg",
  "icons/icon-maskable.svg",
];

function fail(message) {
  console.error(`Asset validation failed: ${message}`);
  process.exit(1);
}

function assertUnderPublic(relativePath) {
  const full = join(PUBLIC_ROOT, relativePath);
  if (!existsSync(full)) {
    fail(`Missing file: ${full}`);
  }
  const size = statSync(full).size;
  if (size > MAX_BYTES) {
    fail(`Asset exceeds 2MB: ${full} (${size} bytes)`);
  }
}

function collectManifestIconPaths(manifest) {
  const paths = [];
  for (const icon of manifest.icons ?? []) {
    if (typeof icon.src !== "string") continue;
    const src = icon.src.startsWith("/") ? icon.src.slice(1) : icon.src;
    if (!src.startsWith("http")) paths.push(src);
  }
  return paths;
}

if (!existsSync(PUBLIC_ROOT)) {
  fail(`${PUBLIC_ROOT} directory missing`);
}

const skippedCandidateDirs = [];
const stack = [PUBLIC_ROOT];
while (stack.length) {
  const dir = stack.pop();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (dir === PUBLIC_ROOT && CANDIDATE_ONLY_DIRS.has(entry.name)) {
        skippedCandidateDirs.push(entry.name);
        continue;
      }
      stack.push(full);
      continue;
    }
    const size = statSync(full).size;
    if (size > MAX_BYTES) {
      fail(`Asset exceeds 2MB: ${full} (${size} bytes)`);
    }
  }
}

for (const rel of REQUIRED_PUBLIC_PATHS) {
  assertUnderPublic(rel);
}

const manifestPath = join(PUBLIC_ROOT, "manifest.json");
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (error) {
  fail(`manifest.json is not valid JSON: ${error.message}`);
}

for (const rel of collectManifestIconPaths(manifest)) {
  assertUnderPublic(rel);
}

const swPath = join(PUBLIC_ROOT, "sw.js");
const swSource = readFileSync(swPath, "utf8");
const cacheMatch = swSource.match(/CACHE_NAME\s*=\s*"(qwen-ui-lab-v\d+)"/);
if (!cacheMatch) {
  fail("public/sw.js must define CACHE_NAME as qwen-ui-lab-v{N}");
}
if (!swSource.includes("/offline.html")) {
  fail("public/sw.js must reference /offline.html");
}
if (!swSource.includes("SKIP_WAITING")) {
  fail("public/sw.js must handle SKIP_WAITING messages");
}

console.log("manifest.json is valid JSON");
console.log(`Service worker cache: ${cacheMatch[1]}`);
console.log(
  `Checked ${REQUIRED_PUBLIC_PATHS.length} required assets and ${(manifest.icons ?? []).length} manifest icon entries`,
);
if (skippedCandidateDirs.length > 0) {
  console.log(
    `Skipped candidate-only asset dirs: ${skippedCandidateDirs
      .map((name) => `${PUBLIC_ROOT}/${name}`)
      .join(", ")}`,
  );
}
console.log("Asset validation passed");
