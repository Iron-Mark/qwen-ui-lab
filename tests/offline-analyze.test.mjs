import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdvancedOfflineOverrides,
  classifyLayoutArchetype,
  inferFormFactor,
  lookupKnownSample,
  lookupKnownSampleByInspection,
  normalizeSampleKey,
} from "../src/features/analysis/lib/offline-analyze.mjs";
import {
  contrastRatio,
  inspectImageDataPixels,
} from "../src/features/analysis/lib/offline-image-inspection.mjs";
import {
  inspectSvgDataUrl,
  inspectSvgMarkup,
} from "../src/features/analysis/lib/offline-svg-inspection.mjs";
import { preprocessImageDataUrl } from "../src/features/analysis/lib/image-preprocess.mjs";
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
        color = [116, 148, 192];
      }

      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }

  return { data, width, height, sourceWidth: 1440, sourceHeight: 900 };
}

const AUTH_SVG = `<svg width="390" height="844" viewBox="0 0 390 844" xmlns="http://www.w3.org/2000/svg">
  <title>Sign in</title>
  <desc>Email and password authentication form</desc>
  <g id="auth-card" aria-label="Authentication card">
    <rect x="32" y="180" width="326" height="360" rx="24" />
    <text x="64" y="240">Sign in</text>
    <text x="64" y="304">Email</text>
    <text x="64" y="376">Password</text>
    <text x="64" y="464">Continue</text>
  </g>
</svg>`;

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
  assert.equal(inspection.threshold.method, "otsu");
  assert.ok(inspection.layout.regions.length > 0);
  assert.ok(inspection.layout.componentSummary.navigation >= 1);
  assert.ok(inspection.layout.regions.some((region) => region.kind === "header/nav"));
  assert.ok(inspection.layout.regions.some((region) => region.kind === "side rail"));
  assert.ok(
    inspection.layout.regions.some((region) =>
      ["content panel", "media/chart"].includes(region.kind),
    ),
  );
  assert.ok(
    inspection.layout.regions.every(
      (region) =>
        !(
          region.kind === "header/nav" &&
          region.minRow === 0 &&
          region.maxRow === inspection.layout.gridRows - 1
        ),
    ),
  );
  assert.match(inspection.designTokens.surface, /^#[0-9a-f]{6}$/i);
  assert.match(inspection.designTokens.accent, /^#[0-9a-f]{6}$/i);
  assert.match(inspection.designTokens.accentForeground, /^#[0-9a-f]{6}$/i);
  assert.equal(inspection.imageSignature.method, "luma-a8-d8");
  assert.match(inspection.imageSignature.averageHash, /^[0-9a-f]{16}$/);
  assert.match(inspection.imageSignature.differenceHash, /^[0-9a-f]{16}$/);
  assert.ok(inspection.contrast.preferredTextContrast >= 4.5);
  assert.match(inspection.recommendations.join(" "), /semantic landmarks|contrast/i);
});

test("inspectSvgMarkup extracts labels, counts, viewBox, and archetype hints", () => {
  const inspection = inspectSvgMarkup(AUTH_SVG);

  assert.ok(inspection);
  assert.equal(inspection.source.width, 390);
  assert.equal(inspection.source.height, 844);
  assert.deepEqual(inspection.source.viewBox, [0, 0, 390, 844]);
  assert.equal(inspection.tagCounts.rect, 1);
  assert.equal(inspection.tagCounts.text, 4);
  assert.ok(inspection.labels.includes("Email"));
  assert.equal(inspection.archetypeHints[0].id, "auth");
  assert.match(inspection.recommendations.join(" "), /viewBox|labels/i);
});

test("inspectSvgMarkup treats missing or invalid viewBox as absent", () => {
  const missing = inspectSvgMarkup(`<svg width="200" height="100"><title>Card</title></svg>`);
  const invalid = inspectSvgMarkup(
    `<svg width="200" height="100" viewBox="0 0"><title>Card</title></svg>`,
  );

  assert.equal(missing.source.hasViewBox, false);
  assert.equal(missing.source.viewBox, null);
  assert.equal(invalid.source.hasViewBox, false);
  assert.equal(invalid.source.viewBox, null);
});

test("inspectSvgDataUrl and preprocessImageDataUrl preserve SVG structure offline", async () => {
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(AUTH_SVG, "utf8").toString(
    "base64",
  )}`;
  const direct = inspectSvgDataUrl(dataUrl);
  const preprocessed = await preprocessImageDataUrl(dataUrl);

  assert.ok(direct);
  assert.equal(direct.labels.includes("Password"), true);
  assert.equal(preprocessed.width, 390);
  assert.equal(preprocessed.height, 844);
  assert.equal(preprocessed.svgInspection?.archetypeHints[0].id, "auth");
});

test("lookupKnownSampleByInspection resolves bundled references by perceptual signature", () => {
  const exact = lookupKnownSampleByInspection({
    imageSignature: {
      method: "luma-a8-d8",
      averageHash: "3f15577169373fff",
      differenceHash: "014529181c99beb1",
    },
  });
  const nearWebp = lookupKnownSampleByInspection({
    imageSignature: {
      method: "luma-a8-d8",
      averageHash: "3f15577178373fff",
      differenceHash: "014529181c99bfb1",
    },
  });
  const unrelated = lookupKnownSampleByInspection({
    imageSignature: {
      method: "luma-a8-d8",
      averageHash: "0000000000000000",
      differenceHash: "ffffffffffffffff",
    },
  });

  assert.ok(exact);
  assert.match(exact.summary, /Admin dashboard/i);
  assert.ok(nearWebp);
  assert.equal(nearWebp.generatedCode, exact.generatedCode);
  assert.equal(unrelated, null);
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

test("buildAdvancedOfflineOverrides seeds generated code from offline regions and tokens", () => {
  const offlineInspection = inspectImageDataPixels(createSyntheticScreenshot(120, 80));
  const advanced = buildAdvancedOfflineOverrides(
    {
      name: "operator-console.png",
      type: "image/png",
      size: 512000,
      width: 1440,
      height: 900,
      offlineInspection,
    },
    { readableSize: "500.0 KB", dimensionLine: "1440Ã—900px landscape frame (aspect 1.60)." },
  );

  assert.match(advanced.generatedCode, /const designTokens/);
  assert.match(advanced.generatedCode, /const layoutRegions/);
  assert.match(advanced.generatedCode, /Local screenshot scaffold/);
  assert.match(advanced.generatedCode, /header\/nav|side rail/);
  assert.match(advanced.generatedCode, new RegExp(offlineInspection.designTokens.accent.slice(1), "i"));
  assert.doesNotMatch(advanced.generatedCode, /Rows 1-8, columns 1-12/);
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

test("buildUiFlowArtifact uses visual registry match for renamed references", () => {
  const artifact = buildUiFlowArtifact({
    name: "renamed-demo-screenshot.png",
    type: "image/png",
    size: 113391,
    width: 1440,
    height: 900,
    offlineInspection: {
      imageSignature: {
        method: "luma-a8-d8",
        averageHash: "3f15577169373fff",
        differenceHash: "014529181c99beb1",
      },
    },
  });

  assert.match(artifact.summary, /Admin dashboard/i);
  assert.match(artifact.generatedCode, /ChartPreview/);
  assert.ok(artifact.plan.some((section) => section.title === "Component Map"));
});

test("buildUiFlowArtifact uses local SVG structure for unknown vector uploads", () => {
  const artifact = buildUiFlowArtifact({
    name: "renamed-auth-wireframe.svg",
    type: "image/svg+xml",
    size: 2048,
    width: 390,
    height: 844,
    svgInspection: inspectSvgMarkup(AUTH_SVG),
  });

  assert.match(artifact.summary, /Authentication/i);
  assert.match(artifact.summary, /SVG structure/i);
  assert.ok(artifact.plan.some((section) => section.title === "Local SVG Structure"));
  assert.ok(artifact.plan.some((section) => section.title === "SVG Quality Checks"));
  assert.deepEqual(
    artifact.previewStats.map((stat) => stat.label),
    ["Text", "Shapes", "Groups", "ViewBox"],
  );
  assert.match(artifact.generatedCode, /const svgLabels/);
  assert.match(artifact.generatedCode, /const svgStructure/);
  assert.match(artifact.generatedCode, /Local SVG scaffold/);
  assert.match(artifact.generatedCode, /Email/);
  assert.match(artifact.generatedCode, /Password/);
  assert.match(artifact.generatedCode, /GeneratedAuthScreen/);
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
  assert.ok(artifact.plan.some((section) => section.title === "Detected Structure"));
  assert.ok(artifact.plan.some((section) => section.title === "Design Tokens"));
  assert.ok(artifact.plan.some((section) => section.title === "Local Quality Checks"));
  assert.deepEqual(
    artifact.previewStats.map((stat) => stat.label),
    ["Regions", "Controls", "Density", "Contrast"],
  );
  assert.match(artifact.generatedCode, /const designTokens/);
  assert.match(artifact.generatedCode, /const layoutRegions/);
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
