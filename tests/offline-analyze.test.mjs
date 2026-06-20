import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdvancedOfflineOverrides,
  classifyLayoutArchetype,
  inferFormFactor,
  lookupKnownSample,
  normalizeSampleKey,
} from "../src/features/analysis/lib/offline-analyze.mjs";
import {
  contrastRatio,
  inspectImageDataPixels,
} from "../src/features/analysis/lib/offline-image-inspection.mjs";
import { buildUiFlowArtifact } from "../src/features/analysis/lib/ui-flow.mjs";
import {
  buildDemoArtifactForFile,
  getSampleReferenceFile,
  SAMPLE_REFERENCE_NAME,
} from "../src/features/analysis/lib/demo-fixtures.mjs";
import { BUNDLED_REFERENCE_SAMPLES } from "../src/features/analysis/lib/reference-samples.mjs";

function createSyntheticScreenshot(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      let color = [245, 245, 245];

      if (y < Math.ceil(height * 0.18)) {
        color = [20, 24, 32];
      } else if (x < Math.ceil(width * 0.18)) {
        color = [44, 90, 160];
      } else if (x > width * 0.42 && x < width * 0.82 && y > height * 0.36 && y < height * 0.66) {
        color = [230, 238, 250];
      }

      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }

  return { data, width, height, sourceWidth: 1440, sourceHeight: 900 };
}

test("BUNDLED_REFERENCE_SAMPLES lists all meetup references", () => {
  const fileNames = BUNDLED_REFERENCE_SAMPLES.map((sample) => sample.fileName);
  assert.deepEqual(fileNames, [
    "dashboard-reference.png",
    "auth-reference.png",
    "mobile-reference.png",
    "landing-reference.png",
    "settings-reference.png",
    "ecommerce-reference.png",
  ]);
});

test("lookupKnownSample resolves dashboard-reference.png via stem fallback", () => {
  const known = lookupKnownSample("dashboard-reference.png");
  assert.ok(known);
  assert.match(known.summary, /Admin dashboard/i);
  assert.match(known.generatedCode, /ChartPreview/);
});

test("lookupKnownSample resolves auth-reference.webp via stem fallback", () => {
  const known = lookupKnownSample("auth-reference.webp");
  assert.ok(known);
  assert.match(known.summary, /sign-in/i);
});

test("normalizeSampleKey uses basename only", () => {
  assert.equal(normalizeSampleKey("C:\\refs\\dashboard-reference.svg"), "dashboard-reference.svg");
});

test("lookupKnownSample returns rich dashboard fixture", () => {
  const known = lookupKnownSample(SAMPLE_REFERENCE_NAME);
  assert.ok(known);
  assert.match(known.summary, /Admin dashboard/i);
  assert.equal(known.previewStats[0].value, "6");
});

test("lookupKnownSample returns rich auth fixture", () => {
  const known = lookupKnownSample("auth-reference.svg");
  assert.ok(known);
  assert.match(known.summary, /sign-in/i);
  assert.equal(known.previewStats[1].value, "7");
  assert.match(known.generatedCode, /OAuthButtonRow/);
  assert.ok(known.plan.some((section) => section.title === "Component Map"));
});

test("lookupKnownSample returns rich mobile fixture", () => {
  const known = lookupKnownSample("mobile-reference.svg");
  assert.ok(known);
  assert.match(known.summary, /Mobile app shell/i);
  assert.match(known.generatedCode, /BottomNav/);
  assert.match(known.plan[1].body, /bottom tab bar/i);
});

test("lookupKnownSample returns rich landing fixture", () => {
  const known = lookupKnownSample("landing-reference.svg");
  assert.ok(known);
  assert.match(known.summary, /Marketing landing/i);
  assert.equal(known.previewStats[0].value, "5");
  assert.match(known.generatedCode, /PricingTable/);
});

test("lookupKnownSample resolves landing-reference.png via stem fallback", () => {
  const known = lookupKnownSample("landing-reference.png");
  assert.ok(known);
  assert.match(known.summary, /Marketing landing/i);
});

test("lookupKnownSample resolves settings-reference.webp via stem fallback", () => {
  const known = lookupKnownSample("settings-reference.webp");
  assert.ok(known);
  assert.match(known.summary, /Account settings/i);
});

test("lookupKnownSample resolves ecommerce-reference.png via stem fallback", () => {
  const known = lookupKnownSample("ecommerce-reference.png");
  assert.ok(known);
  assert.match(known.summary, /E-commerce catalog/i);
});

test("lookupKnownSample returns rich settings fixture", () => {
  const known = lookupKnownSample("settings-reference.svg");
  assert.ok(known);
  assert.match(known.summary, /Account settings/i);
  assert.match(known.generatedCode, /SaveBar/);
  assert.match(known.plan[2].body, /ToggleRow/);
});

test("lookupKnownSample returns rich ecommerce fixture", () => {
  const known = lookupKnownSample("ecommerce-reference.svg");
  assert.ok(known);
  assert.match(known.summary, /E-commerce catalog/i);
  assert.match(known.generatedCode, /ProductGrid/);
  assert.match(known.plan[2].body, /FilterSidebar/);
});

test("contrastRatio follows WCAG black/white maximum", () => {
  assert.equal(
    contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }),
    21,
  );
});

test("inspectImageDataPixels extracts palette, contrast, and layout bands", () => {
  const inspection = inspectImageDataPixels(createSyntheticScreenshot(120, 80));

  assert.ok(inspection);
  assert.ok(inspection.palette.length >= 3);
  assert.equal(inspection.layout.topBand, true);
  assert.equal(inspection.layout.leftRail, true);
  assert.ok(inspection.contrast.preferredTextContrast >= 4.5);
  assert.match(inspection.recommendations.join(" "), /semantic landmarks|contrast/i);
});

test("buildUiFlowArtifact uses known sample registry for auth-reference.svg", () => {
  const artifact = buildUiFlowArtifact({
    name: "auth-reference.svg",
    type: "image/svg+xml",
    size: 4096,
    width: 1200,
    height: 720,
  });

  assert.match(artifact.summary, /sign-in/i);
  assert.match(artifact.generatedCode, /GeneratedAuthScreen/);
  assert.equal(artifact.previewStats[1].value, "7");
});

test("buildUiFlowArtifact uses known sample registry for mobile-reference.svg", () => {
  const artifact = buildUiFlowArtifact({
    name: "mobile-reference.svg",
    type: "image/svg+xml",
    size: 4096,
    width: 390,
    height: 844,
  });

  assert.match(artifact.summary, /Mobile app shell/i);
  assert.match(artifact.generatedCode, /FloatingActionButton/);
});

test("buildUiFlowArtifact uses known sample registry for landing-reference.svg", () => {
  const artifact = buildUiFlowArtifact({
    name: "landing-reference.svg",
    type: "image/svg+xml",
    size: 8192,
    width: 1440,
    height: 900,
  });

  assert.match(artifact.summary, /Marketing landing/i);
  assert.match(artifact.generatedCode, /HeroSection/);
  assert.doesNotMatch(artifact.summary, /confidence/i);
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

test("buildUiFlowArtifact surfaces offline pixel signals for unknown uploads", () => {
  const offlineInspection = inspectImageDataPixels(createSyntheticScreenshot(120, 80));
  const artifact = buildUiFlowArtifact({
    name: "operator-console.png",
    type: "image/png",
    size: 8192,
    width: 1440,
    height: 900,
    offlineInspection,
  });

  assert.match(artifact.summary, /local pixel signals/i);
  assert.ok(artifact.plan.some((section) => section.title === "Local Vision Signals"));
  assert.ok(artifact.plan.some((section) => section.title === "Local Quality Checks"));
  assert.deepEqual(
    artifact.previewStats.map((stat) => stat.label),
    ["Palette", "Contrast", "Density", "Layout"],
  );
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
