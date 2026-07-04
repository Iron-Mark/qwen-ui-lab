import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  SAMPLE_RUNS,
  RASTER_REFERENCE_STEMS,
  findSampleRunByFileName,
  inferReferenceMimeType,
  getSampleRunByFileName,
} from "../src/features/analysis/lib/reference-samples.mjs";
import { getSampleRunFileMetadata } from "../src/features/analysis/lib/reference-samples.server.mjs";
import {
  LOCAL_ANALYSIS_HEALTH_RESPONSE,
  buildLocalAnalyzeUiErrorResponse,
  buildSampleRunAnalyzeUiSuccessResponse,
  buildSampleRunArtifactForFile,
  getSampleRunFile,
} from "../src/features/analysis/lib/sample-run-fixtures.mjs";
import { lookupKnownSample } from "../src/features/analysis/lib/offline-analyze.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REFERENCES_DIR = resolve(__dirname, "../public/references");
const SAMPLE_RUN_FIXTURE_PATH = resolve(
  __dirname,
  "../e2e/fixtures/sample-run-responses.json",
);

const STALE_SAMPLE_OUTPUT_PHRASES = [
  /product API data/i,
  /product data/i,
  /connect live data/i,
  /binding live data/i,
  /live record\b/i,
  /your data source/i,
];

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

test("all sample runs use PNG paths with WebP companions", () => {
  assert.deepEqual(
    SAMPLE_RUNS.map((sample) => sample.fileName),
    [
      "dashboard-reference.png",
      "auth-reference.png",
      "mobile-reference.png",
      "landing-reference.png",
      "settings-reference.png",
      "ecommerce-reference.png",
      "stress-dashboard-reference.png",
      "stress-list-reference.png",
    ],
  );
  for (const sample of SAMPLE_RUNS) {
    assert.equal(sample.mimeType, "image/png");
    assert.doesNotMatch(sample.hint, /PNG screenshot/i);
    assert.doesNotMatch(sample.hint, /^Tests\b/i);
    assert.ok(sample.hint.length > 20, `${sample.id} should have helpful hint copy`);
    assert.ok(sample.webpPath?.endsWith(".webp"));
  }
});

test("inferReferenceMimeType maps common raster extensions", () => {
  assert.equal(inferReferenceMimeType("screen.png"), "image/png");
  assert.equal(inferReferenceMimeType("screen.webp"), "image/webp");
  assert.equal(inferReferenceMimeType("screen.jpg"), "image/jpeg");
  assert.equal(inferReferenceMimeType("screen.svg"), "image/svg+xml");
});

test("getSampleRunFileMetadata reports PNG mime for dashboard raster", () => {
  const file = getSampleRunFileMetadata({ fileName: "dashboard-reference.png" });
  assert.equal(file.name, "dashboard-reference.png");
  assert.equal(file.type, "image/png");
  assert.equal(file.width, 1440);
  assert.equal(file.height, 900);
  assert.ok(file.size > 1024);
});

test("sample-run success fixture exposes new marker and legacy compatibility", () => {
  const payload = buildSampleRunAnalyzeUiSuccessResponse(getSampleRunFile());

  assert.equal(payload.ok, true);
  assert.equal(payload.sampleRun, true);
  assert.equal(payload.demo, true);
  assert.equal(payload.artifact.modeLabel, "Ready to analyze");
  assert.equal(payload.provider.model, "demo");
});

test("exported E2E sample-run fixture matches source builders", () => {
  const fixture = JSON.parse(readFileSync(SAMPLE_RUN_FIXTURE_PATH, "utf8"));
  const sampleFile = getSampleRunFile();
  const sampleArtifact = buildSampleRunArtifactForFile(sampleFile);

  assert.deepEqual(fixture.health, LOCAL_ANALYSIS_HEALTH_RESPONSE);
  assert.deepEqual(fixture.analyzeUiError, buildLocalAnalyzeUiErrorResponse());
  assert.deepEqual(fixture.sampleFile, sampleFile);
  assert.deepEqual(
    fixture.analyzeUiSuccess,
    buildSampleRunAnalyzeUiSuccessResponse(sampleFile),
  );

  assert.equal(fixture.analyzeUiSuccess.ok, true);
  assert.equal(fixture.analyzeUiSuccess.sampleRun, true);
  assert.equal(fixture.analyzeUiSuccess.demo, true);
  assert.equal(fixture.analyzeUiSuccess.artifact.modeLabel, "Ready to analyze");
  assert.equal(fixture.analyzeUiSuccess.provider.model, "demo");
  for (const phrase of STALE_SAMPLE_OUTPUT_PHRASES) {
    assert.doesNotMatch(
      fixture.analyzeUiSuccess.artifact.generatedCode,
      phrase,
      `sample-run fixture generated code should avoid ${phrase}`,
    );
  }
  assert.deepEqual(fixture.sampleArtifact, {
    planTitles: sampleArtifact.plan.map((section) => section.title),
    previewStats: sampleArtifact.previewStats,
    modeLabel: sampleArtifact.modeLabel,
    summary: sampleArtifact.summary,
  });
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

test("getSampleRunByFileName resolves raster filenames", () => {
  const auth = getSampleRunByFileName("auth-reference.png");
  assert.equal(auth.id, "auth");
  assert.equal(auth.path, "/references/auth-reference.png");
});

test("findSampleRunByFileName does not fallback for user uploads", () => {
  const auth = findSampleRunByFileName("auth-reference.png");
  assert.equal(auth.id, "auth");
  assert.equal(findSampleRunByFileName("client-settings-shot.png"), undefined);
  assert.equal(getSampleRunByFileName("client-settings-shot.png").id, "dashboard");
});

test("getSampleRunByFileName resolves legacy SVG stems to raster bundle", () => {
  const auth = getSampleRunByFileName("auth-reference.svg");
  assert.equal(auth.id, "auth");
  assert.equal(auth.fileName, "auth-reference.png");

  const landing = getSampleRunByFileName("landing-reference.svg");
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
