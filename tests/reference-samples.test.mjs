import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BUNDLED_REFERENCE_SAMPLES,
  RASTER_REFERENCE_STEMS,
  inferReferenceMimeType,
  getReferenceSampleByFileName,
} from "../src/lib/reference-samples.mjs";
import { getBundledReferenceFile } from "../src/lib/reference-samples.server.mjs";
import { lookupKnownSample } from "../src/lib/offline-analyze.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REFERENCES_DIR = resolve(__dirname, "../public/references");

test("raster archetypes ship PNG + WebP assets on disk", () => {
  for (const stem of RASTER_REFERENCE_STEMS) {
    const pngPath = resolve(REFERENCES_DIR, `${stem}.png`);
    const webpPath = resolve(REFERENCES_DIR, `${stem}.webp`);
    assert.ok(existsSync(pngPath), `missing ${stem}.png`);
    assert.ok(existsSync(webpPath), `missing ${stem}.webp`);
    assert.ok(statSync(pngPath).size > 1024, `${stem}.png should be non-trivial`);
    assert.ok(statSync(webpPath).size > 512, `${stem}.webp should be non-trivial`);
  }
});

test("all bundled reference samples use PNG paths with WebP companions", () => {
  assert.deepEqual(
    BUNDLED_REFERENCE_SAMPLES.map((sample) => sample.fileName),
    [
      "dashboard-reference.png",
      "auth-reference.png",
      "mobile-reference.png",
      "landing-reference.png",
      "settings-reference.png",
      "ecommerce-reference.png",
    ],
  );
  for (const sample of BUNDLED_REFERENCE_SAMPLES) {
    assert.equal(sample.mimeType, "image/png");
    assert.match(sample.hint, /PNG screenshot/i);
    assert.ok(sample.webpPath?.endsWith(".webp"));
  }
});

test("inferReferenceMimeType maps common raster extensions", () => {
  assert.equal(inferReferenceMimeType("screen.png"), "image/png");
  assert.equal(inferReferenceMimeType("screen.webp"), "image/webp");
  assert.equal(inferReferenceMimeType("screen.jpg"), "image/jpeg");
  assert.equal(inferReferenceMimeType("screen.svg"), "image/svg+xml");
});

test("getBundledReferenceFile reports PNG mime for dashboard raster", () => {
  const file = getBundledReferenceFile({ fileName: "dashboard-reference.png" });
  assert.equal(file.name, "dashboard-reference.png");
  assert.equal(file.type, "image/png");
  assert.equal(file.width, 1440);
  assert.equal(file.height, 900);
  assert.ok(file.size > 1024);
});

test("lookupKnownSample resolves PNG and WebP stems to SVG registry", () => {
  const dashboardPng = lookupKnownSample("dashboard-reference.png");
  const dashboardWebp = lookupKnownSample("dashboard-reference.webp");
  assert.ok(dashboardPng);
  assert.ok(dashboardWebp);
  assert.match(dashboardPng.summary, /Admin dashboard/i);
  assert.equal(dashboardPng.previewStats[0].value, "6");
  assert.equal(dashboardWebp.generatedCode, dashboardPng.generatedCode);
});

test("getReferenceSampleByFileName resolves raster filenames", () => {
  const auth = getReferenceSampleByFileName("auth-reference.png");
  assert.equal(auth.id, "auth");
  assert.equal(auth.path, "/references/auth-reference.png");
});

test("getReferenceSampleByFileName resolves legacy SVG stems to raster bundle", () => {
  const auth = getReferenceSampleByFileName("auth-reference.svg");
  assert.equal(auth.id, "auth");
  assert.equal(auth.fileName, "auth-reference.png");

  const landing = getReferenceSampleByFileName("landing-reference.svg");
  assert.equal(landing.id, "landing");
  assert.equal(landing.fileName, "landing-reference.png");
});

test("lookupKnownSample resolves landing PNG and WebP stems to SVG registry", () => {
  const landingPng = lookupKnownSample("landing-reference.png");
  const landingWebp = lookupKnownSample("landing-reference.webp");
  assert.ok(landingPng);
  assert.ok(landingWebp);
  assert.match(landingPng.summary, /Marketing landing/i);
  assert.equal(landingWebp.generatedCode, landingPng.generatedCode);
});
