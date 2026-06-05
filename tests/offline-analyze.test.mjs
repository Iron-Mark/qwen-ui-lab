import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdvancedOfflineOverrides,
  classifyLayoutArchetype,
  inferFormFactor,
  lookupKnownSample,
  normalizeSampleKey,
} from "../src/lib/offline-analyze.mjs";
import { buildUiFlowArtifact } from "../src/lib/ui-flow.mjs";
import {
  buildDemoArtifactForFile,
  getSampleReferenceFile,
  SAMPLE_REFERENCE_NAME,
} from "../src/lib/demo-fixtures.mjs";

test("normalizeSampleKey uses basename only", () => {
  assert.equal(normalizeSampleKey("C:\\refs\\dashboard-reference.svg"), "dashboard-reference.svg");
});

test("lookupKnownSample returns rich dashboard fixture", () => {
  const known = lookupKnownSample(SAMPLE_REFERENCE_NAME);
  assert.ok(known);
  assert.match(known.summary, /Admin dashboard/i);
  assert.equal(known.previewStats[0].value, "6");
});

test("classifyLayoutArchetype scores auth filenames highly", () => {
  const result = classifyLayoutArchetype({
    name: "sign-in-form.png",
    type: "image/png",
    size: 1024,
    width: 390,
    height: 844,
  });

  assert.equal(result.archetypeId, "auth");
  assert.ok(result.confidence >= 0.7);
  assert.equal(result.formFactor.id, "mobile");
});

test("classifyLayoutArchetype prefers dashboard for wide desktop frames", () => {
  const result = classifyLayoutArchetype({
    name: "screen-capture.png",
    type: "image/png",
    size: 2048,
    width: 1440,
    height: 900,
  });

  assert.equal(result.archetypeId, "dashboard");
});

test("buildAdvancedOfflineOverrides includes confidence in summary", () => {
  const advanced = buildAdvancedOfflineOverrides(
    { name: "checkout-cart.png", type: "image/png", size: 512000, width: 1280, height: 800 },
    { readableSize: "500.0 KB", dimensionLine: "1280×800px landscape frame (aspect 1.60)." },
  );

  assert.ok(advanced.plan.some((section) => section.title === "Layout Read"));
  assert.match(advanced.summary, /confidence/i);
  assert.match(advanced.generatedCode, /GeneratedCatalog/);
});

test("buildUiFlowArtifact uses known sample registry for dashboard-reference.svg", () => {
  const file = getSampleReferenceFile();
  const artifact = buildUiFlowArtifact(file);

  assert.equal(artifact.file.name, SAMPLE_REFERENCE_NAME);
  assert.match(artifact.summary, /Admin dashboard/i);
  assert.equal(artifact.previewStats[0].value, "6");
  assert.match(artifact.generatedCode, /ChartPreview/);
  assert.ok(artifact.plan.some((section) => section.title === "Component Map"));
});

test("buildUiFlowArtifact uses advanced classifier for unknown uploads", () => {
  const artifact = buildUiFlowArtifact({
    name: "pricing-landing-hero.png",
    type: "image/png",
    size: 8192,
    width: 1200,
    height: 630,
  });

  assert.match(artifact.summary, /Marketing landing/i);
  assert.match(artifact.generatedCode, /GeneratedLanding/);
});

test("buildDemoArtifactForFile matches export fixture shape", () => {
  const artifact = buildDemoArtifactForFile(getSampleReferenceFile());
  assert.deepEqual(
    artifact.plan.map((section) => section.title),
    [
      "Visual Input",
      "Layout Read",
      "Component Map",
      "Accessibility Pass",
      "Human Review",
    ],
  );
});

test("inferFormFactor detects tablet portrait", () => {
  const factor = inferFormFactor(768, 1024);
  assert.equal(factor.id, "tablet");
});
