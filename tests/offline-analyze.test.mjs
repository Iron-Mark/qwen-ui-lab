import test from "node:test";
import assert from "node:assert/strict";
import * as ts from "typescript";

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
import { preprocessImageDataUrl } from "../src/features/analysis/lib/image-preprocess.client.mjs";
import {
  buildUiFlowArtifact,
  regenerateArtifactFromDetections,
} from "../src/features/analysis/lib/ui-flow.mjs";
import {
  buildDemoArtifactForFile,
  getSampleReferenceFile,
  SAMPLE_REFERENCE_NAME,
} from "../src/features/analysis/lib/demo-fixtures.mjs";
import { BUNDLED_REFERENCE_SAMPLES } from "../src/features/analysis/lib/reference-samples.mjs";
import {
  buildScaffoldZipEntries,
} from "../src/features/export/lib/scaffold-package.mjs";
import { extractProductionScaffoldBlueprint } from "../src/features/export/lib/scaffold-blueprint.mjs";

function assertGeneratedTsxSyntax(code, label) {
  const result = ts.transpileModule(code, {
    fileName: `${label}.tsx`,
    reportDiagnostics: true,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const errors = (result.diagnostics ?? [])
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    .map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    );

  assert.deepEqual(errors, [], `${label} generated TSX should parse`);
}

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

function createSyntheticRepeatedListScreenshot(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  const rowTop = Math.floor(height * 0.18);
  const rowHeight = Math.max(12, Math.floor(height * 0.085));
  const rowGap = Math.max(8, Math.floor(height * 0.055));
  const rowLeft = Math.floor(width * 0.12);
  const rowWidth = Math.floor(width * 0.74);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      let color = [246, 247, 249];

      if (y < Math.ceil(height * 0.1)) {
        color = [24, 30, 42];
      }

      for (let row = 0; row < 5; row += 1) {
        const yStart = rowTop + row * (rowHeight + rowGap);
        const yEnd = yStart + rowHeight;
        if (x >= rowLeft && x <= rowLeft + rowWidth && y >= yStart && y <= yEnd) {
          color = [216, 221, 230];
        }
        if (
          x >= rowLeft + 12 &&
          x <= rowLeft + Math.floor(rowWidth * 0.66) &&
          y >= yStart + Math.floor(rowHeight * 0.38) &&
          y <= yStart + Math.floor(rowHeight * 0.58)
        ) {
          color = [70, 76, 88];
        }
      }

      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }

  return { data, width, height, sourceWidth: 390, sourceHeight: 844 };
}

function createSyntheticCardGridScreenshot(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  const cardWidth = Math.floor(width * 0.22);
  const cardHeight = Math.floor(height * 0.22);
  const left = Math.floor(width * 0.08);
  const top = Math.floor(height * 0.26);
  const columnGap = Math.floor(width * 0.09);
  const rowGap = Math.floor(height * 0.1);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      let color = [247, 248, 250];

      if (y < Math.ceil(height * 0.12)) {
        color = [25, 31, 43];
      }

      for (let row = 0; row < 2; row += 1) {
        for (let column = 0; column < 3; column += 1) {
          const xStart = left + column * (cardWidth + columnGap);
          const yStart = top + row * (cardHeight + rowGap);
          const xEnd = xStart + cardWidth;
          const yEnd = yStart + cardHeight;

          if (x >= xStart && x <= xEnd && y >= yStart && y <= yEnd) {
            color = [221, 226, 235];
          }
          if (
            x >= xStart + Math.floor(cardWidth * 0.12) &&
            x <= xStart + Math.floor(cardWidth * 0.72) &&
            y >= yStart + Math.floor(cardHeight * 0.34) &&
            y <= yStart + Math.floor(cardHeight * 0.46)
          ) {
            color = [74, 83, 98];
          }
        }
      }

      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }

  return { data, width, height, sourceWidth: 1024, sourceHeight: 768 };
}

function createSyntheticStatRowScreenshot(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  const cardWidth = Math.floor(width * 0.2);
  const cardHeight = Math.floor(height * 0.16);
  const left = Math.floor(width * 0.08);
  const top = Math.floor(height * 0.32);
  const gap = Math.floor(width * 0.055);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      let color = [247, 248, 250];

      if (y < Math.ceil(height * 0.14)) {
        color = [25, 31, 43];
      }

      for (let card = 0; card < 4; card += 1) {
        const xStart = left + card * (cardWidth + gap);
        const yStart = top;
        const xEnd = xStart + cardWidth;
        const yEnd = yStart + cardHeight;

        if (x >= xStart && x <= xEnd && y >= yStart && y <= yEnd) {
          color = [221, 226, 235];
        }
        if (
          x >= xStart + Math.floor(cardWidth * 0.12) &&
          x <= xStart + Math.floor(cardWidth * 0.72) &&
          y >= yStart + Math.floor(cardHeight * 0.24) &&
          y <= yStart + Math.floor(cardHeight * 0.34)
        ) {
          color = [74, 83, 98];
        }
        if (
          x >= xStart + Math.floor(cardWidth * 0.12) &&
          x <= xStart + Math.floor(cardWidth * 0.58) &&
          y >= yStart + Math.floor(cardHeight * 0.58) &&
          y <= yStart + Math.floor(cardHeight * 0.76)
        ) {
          color = [37, 99, 235];
        }
      }

      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }

  return { data, width, height, sourceWidth: 1024, sourceHeight: 768 };
}

function createSyntheticFormScreenshot(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  const fieldLeft = Math.floor(width * 0.16);
  const fieldWidth = Math.floor(width * 0.68);
  const fieldHeight = Math.max(14, Math.floor(height * 0.07));
  const firstTop = Math.floor(height * 0.26);
  const gap = Math.floor(height * 0.1);
  const buttonWidth = Math.floor(width * 0.28);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      let color = [248, 249, 251];

      for (let field = 0; field < 2; field += 1) {
        const yStart = firstTop + field * (fieldHeight + gap);
        const yEnd = yStart + fieldHeight;
        if (x >= fieldLeft && x <= fieldLeft + fieldWidth && y >= yStart && y <= yEnd) {
          color = [218, 224, 234];
        }
        if (
          x >= fieldLeft + 10 &&
          x <= fieldLeft + Math.floor(fieldWidth * 0.58) &&
          y >= yStart + Math.floor(fieldHeight * 0.42) &&
          y <= yStart + Math.floor(fieldHeight * 0.56)
        ) {
          color = [74, 82, 96];
        }
      }

      const buttonTop = firstTop + 2 * (fieldHeight + gap);
      if (
        x >= fieldLeft &&
        x <= fieldLeft + buttonWidth &&
        y >= buttonTop &&
        y <= buttonTop + fieldHeight
      ) {
        color = [37, 99, 235];
      }

      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }

  return { data, width, height, sourceWidth: 390, sourceHeight: 844 };
}

function createSyntheticTableScreenshot(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  const tableLeft = Math.floor(width * 0.1);
  const tableTop = Math.floor(height * 0.2);
  const columnWidth = Math.floor(width * 0.15);
  const columnGap = Math.floor(width * 0.075);
  const rowGap = Math.floor(height * 0.12);
  const cellHeight = Math.max(5, Math.floor(height * 0.035));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      let color = [248, 249, 251];

      if (y < Math.ceil(height * 0.12)) {
        color = [24, 30, 42];
      }

      for (let row = 0; row < 4; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          const xStart = tableLeft + column * (columnWidth + columnGap);
          const yStart = tableTop + row * rowGap;
          const xEnd = xStart + columnWidth;
          const yEnd = yStart + cellHeight;

          if (x >= xStart && x <= xEnd && y >= yStart && y <= yEnd) {
            color = row === 0 ? [66, 75, 90] : [84, 94, 112];
          }
        }
      }

      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }

  return { data, width, height, sourceWidth: 1024, sourceHeight: 768 };
}

function createSyntheticBarChartScreenshot(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  const chartLeft = Math.floor(width * 0.2);
  const baseline = Math.floor(height * 0.74);
  const barWidth = Math.max(6, Math.floor(width * 0.045));
  const barGap = Math.floor(width * 0.055);
  const barHeights = [
    Math.floor(height * 0.16),
    Math.floor(height * 0.32),
    Math.floor(height * 0.22),
    Math.floor(height * 0.38),
    Math.floor(height * 0.27),
  ];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      let color = [247, 248, 250];

      for (let bar = 0; bar < barHeights.length; bar += 1) {
        const xStart = chartLeft + bar * (barWidth + barGap);
        const yStart = baseline - barHeights[bar];
        if (x >= xStart && x <= xStart + barWidth && y >= yStart && y <= baseline) {
          color = [37, 99, 235];
        }
      }

      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }

  return { data, width, height, sourceWidth: 1024, sourceHeight: 768 };
}

function createSyntheticActionClusterScreenshot(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  const buttonTop = Math.floor(height * 0.4);
  const buttonHeight = Math.max(18, Math.floor(height * 0.12));
  const buttonWidth = Math.floor(width * 0.12);
  const gap = Math.floor(width * 0.095);
  const left = Math.floor(width * 0.11);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      let color = [248, 249, 251];

      for (let item = 0; item < 4; item += 1) {
        const xStart = left + item * (buttonWidth + gap);
        const xEnd = xStart + buttonWidth;
        const yEnd = buttonTop + buttonHeight;
        if (x >= xStart && x <= xEnd && y >= buttonTop && y <= yEnd) {
          color = item === 0 ? [37, 99, 235] : [218, 224, 234];
        }
      }

      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }

  return { data, width, height, sourceWidth: width, sourceHeight: height };
}

function createSyntheticTabSetScreenshot(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  const tabTop = Math.floor(height * 0.36);
  const tabHeight = Math.max(18, Math.floor(height * 0.11));
  const tabWidth = Math.floor(width * 0.155);
  const gap = Math.max(22, Math.floor(width * 0.067));
  const left = Math.floor(width * 0.11);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      let color = [248, 249, 251];

      for (let item = 0; item < 4; item += 1) {
        const xStart = left + item * (tabWidth + gap);
        const xEnd = xStart + tabWidth;
        const yEnd = tabTop + tabHeight;
        if (x >= xStart && x <= xEnd && y >= tabTop && y <= yEnd) {
          color = item === 1 ? [37, 99, 235] : [218, 224, 234];
        }
        if (
          x >= xStart + Math.floor(tabWidth * 0.18) &&
          x <= xStart + Math.floor(tabWidth * 0.72) &&
          y >= tabTop + Math.floor(tabHeight * 0.42) &&
          y <= tabTop + Math.floor(tabHeight * 0.56)
        ) {
          color = item === 1 ? [239, 246, 255] : [78, 87, 102];
        }
      }

      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }

  return { data, width, height, sourceWidth: width, sourceHeight: height };
}

function createSyntheticDialogScreenshot(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  const panelLeft = Math.floor(width * 0.18);
  const panelTop = Math.floor(height * 0.2);
  const panelWidth = Math.floor(width * 0.64);
  const panelHeight = Math.floor(height * 0.54);
  const titleLeft = panelLeft + Math.floor(panelWidth * 0.12);
  const titleTop = panelTop + Math.floor(panelHeight * 0.18);
  const bodyTop = panelTop + Math.floor(panelHeight * 0.36);
  const buttonTop = panelTop + Math.floor(panelHeight * 0.72);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      let color = [32, 36, 44];

      if (
        x >= panelLeft &&
        x <= panelLeft + panelWidth &&
        y >= panelTop &&
        y <= panelTop + panelHeight
      ) {
        color = [246, 248, 252];
      }
      if (
        x >= titleLeft &&
        x <= titleLeft + Math.floor(panelWidth * 0.52) &&
        y >= titleTop &&
        y <= titleTop + Math.floor(panelHeight * 0.08)
      ) {
        color = [44, 52, 68];
      }
      if (
        x >= titleLeft &&
        x <= titleLeft + Math.floor(panelWidth * 0.68) &&
        y >= bodyTop &&
        y <= bodyTop + Math.floor(panelHeight * 0.05)
      ) {
        color = [106, 116, 132];
      }
      if (
        x >= titleLeft &&
        x <= titleLeft + Math.floor(panelWidth * 0.45) &&
        y >= bodyTop + Math.floor(panelHeight * 0.12) &&
        y <= bodyTop + Math.floor(panelHeight * 0.17)
      ) {
        color = [138, 148, 164];
      }
      if (
        x >= titleLeft &&
        x <= titleLeft + Math.floor(panelWidth * 0.34) &&
        y >= buttonTop &&
        y <= buttonTop + Math.floor(panelHeight * 0.12)
      ) {
        color = [37, 99, 235];
      }

      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }

  return { data, width, height, sourceWidth: width, sourceHeight: height };
}

function createSyntheticEmptyStateScreenshot(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  const centerX = Math.floor(width * 0.5);
  const iconRadius = Math.max(10, Math.floor(Math.min(width, height) * 0.045));
  const iconY = Math.floor(height * 0.34);
  const titleWidth = Math.floor(width * 0.42);
  const titleHeight = Math.max(10, Math.floor(height * 0.045));
  const titleLeft = centerX - Math.floor(titleWidth / 2);
  const titleTop = Math.floor(height * 0.43);
  const bodyWidth = Math.floor(width * 0.58);
  const bodyHeight = Math.max(8, Math.floor(height * 0.028));
  const bodyLeft = centerX - Math.floor(bodyWidth / 2);
  const bodyTop = Math.floor(height * 0.52);
  const buttonWidth = Math.floor(width * 0.28);
  const buttonHeight = Math.max(16, Math.floor(height * 0.07));
  const buttonLeft = centerX - Math.floor(buttonWidth / 2);
  const buttonTop = Math.floor(height * 0.64);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      let color = [248, 250, 252];
      const iconDistance = Math.hypot(x - centerX, y - iconY);

      if (iconDistance <= iconRadius) {
        color = [37, 99, 235];
      }
      if (
        x >= titleLeft &&
        x <= titleLeft + titleWidth &&
        y >= titleTop &&
        y <= titleTop + titleHeight
      ) {
        color = [15, 23, 42];
      }
      if (
        x >= bodyLeft &&
        x <= bodyLeft + bodyWidth &&
        y >= bodyTop &&
        y <= bodyTop + bodyHeight
      ) {
        color = [100, 116, 139];
      }
      if (
        x >= bodyLeft + Math.floor(bodyWidth * 0.16) &&
        x <= bodyLeft + Math.floor(bodyWidth * 0.82) &&
        y >= bodyTop + Math.floor(height * 0.045) &&
        y <= bodyTop + Math.floor(height * 0.045) + bodyHeight
      ) {
        color = [148, 163, 184];
      }
      if (
        x >= buttonLeft &&
        x <= buttonLeft + buttonWidth &&
        y >= buttonTop &&
        y <= buttonTop + buttonHeight
      ) {
        color = [37, 99, 235];
      }

      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }

  return { data, width, height, sourceWidth: width, sourceHeight: height };
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

test("BUNDLED_REFERENCE_SAMPLES lists all reference samples", () => {
  const fileNames = BUNDLED_REFERENCE_SAMPLES.map((sample) => sample.fileName);
  assert.deepEqual(fileNames, [
    "dashboard-reference.png",
    "auth-reference.png",
    "mobile-reference.png",
    "landing-reference.png",
    "settings-reference.png",
    "ecommerce-reference.png",
    "stress-dashboard-reference.png",
    "stress-list-reference.png",
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

test("known reference samples export as export packages", () => {
  const names = [
    "dashboard-reference.png",
    "auth-reference.svg",
    "mobile-reference.svg",
    "landing-reference.svg",
    "settings-reference.svg",
    "ecommerce-reference.svg",
  ];

  for (const name of names) {
    const known = lookupKnownSample(name);
    assert.ok(known, `${name} should resolve`);
    assert.match(known.generatedCode, /const detectedElements: DetectionElement\[\]/);
    assert.match(known.generatedCode, /const layoutRegions: LayoutRegion\[\]/);
    assert.match(known.generatedCode, /const shadcnPrimitiveMap: Record<string, string>/);
    assert.doesNotMatch(known.generatedCode, /@\/features\/(?:home|mobile|landing|settings|catalog)\/components/);

    const blueprint = extractProductionScaffoldBlueprint(known.generatedCode);
    assert.ok(blueprint, `${name} should include export metadata`);
    assert.equal(blueprint.generator, "offline-detection");
    assert.ok(blueprint.detectedElements.length > 0);
    assert.ok(blueprint.layoutRegions.length > 0);
    assert.equal(blueprint.reviewChecklist.length >= 3, true);

    const entries = buildScaffoldZipEntries({
      content: known.generatedCode,
      filename: name.replace(/\.[^.]+$/, ".tsx"),
      description: known.summary,
    });
    assert.equal(entries.length, 7);
    assert.ok(entries.some((entry) => entry.name === "DESIGN.md"));
    assert.ok(entries.some((entry) => entry.name.endsWith(".recipe.json")));
    assert.ok(entries.some((entry) => entry.name.endsWith(".manifest.json")));
    assert.ok(entries.some((entry) => entry.name.endsWith(".tokens.css")));
    assert.ok(entries.some((entry) => entry.name.endsWith(".detection.md")));
    assertGeneratedTsxSyntax(known.generatedCode, name.replace(/\W+/g, "-"));
  }
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
  assert.ok(inspection.elements.length >= 3);
  assert.ok(inspection.elements.some((element) => element.kind === "header"));
  assert.ok(inspection.elements.some((element) => element.kind === "side-nav"));
  assert.ok(inspection.elements.every((element) => element.primitive));
  assert.ok(inspection.elements.every((element) => element.componentRole));
  assert.ok(inspection.elements.every((element) => element.reasons.length > 0));
  assert.ok(
    inspection.elements.some((element) =>
      element.reasons.some((reason) => reason.code === "primitive-snap"),
    ),
  );
  assert.ok(
    inspection.elements.every((element) =>
      element.reasons.some((reason) => reason.code === "component-snap"),
    ),
  );
  assert.ok(inspection.elements.some((element) => element.componentRole === "top-navigation"));
  assert.ok(inspection.elements.some((element) => element.componentRole === "side-navigation"));
  assert.ok(Object.keys(inspection.quality.roles).length >= 3);
  assert.equal(inspection.layoutTree.responsive.mode, "sidebar-grid");
  assert.equal(inspection.quality.responsive.mode, "sidebar-grid");
  assert.ok(inspection.layoutTree.responsive.regions.collapsibleSidebar);
  assert.ok(inspection.layoutTree.responsive.regions.appShellCount >= 1);
  assert.equal(inspection.layoutTree.responsive.regions.appShellType, "desktop-sidebar-shell");
  assert.ok(inspection.layoutTree.responsive.breakpoints.includes("lg"));
  assert.equal(inspection.layoutTree.screenIntent.id, "dashboard");
  assert.equal(inspection.quality.screenIntent.id, "dashboard");
  assert.ok(inspection.layoutTree.screenIntent.evidence.length >= 1);
  assert.equal(inspection.layoutTree.strategy, "projection-groups");
  assert.ok(inspection.layoutTree.patterns.appShells.length >= 1);
  assert.equal(inspection.layoutTree.patterns.appShells[0].kind, "app-shell");
  assert.equal(inspection.layoutTree.patterns.appShells[0].shellType, "desktop-sidebar-shell");
  assert.ok(inspection.layoutTree.patterns.appShells[0].children.length >= 2);
  assert.equal(inspection.layoutTree.groups.some((group) => group.kind === "app-shell"), true);
  assert.ok(inspection.layoutTree.readingOrder.length >= 3);
  assert.equal(inspection.quality.strategy, "fine-grid-connected-components");
  assert.ok(inspection.quality.patterns.appShells >= 1);
  assert.ok(inspection.quality.confidence > 0);
  assert.ok(inspection.contrast.preferredTextContrast >= 4.5);
  assert.match(inspection.recommendations.join(" "), /semantic landmarks|contrast/i);
});

test("inspectImageDataPixels detects repeated lists and text-line patterns offline", () => {
  const inspection = inspectImageDataPixels(createSyntheticRepeatedListScreenshot(180, 260));

  assert.ok(inspection);
  const listItems = inspection.elements.filter(
    (element) => element.primitive === "list-item",
  );
  assert.ok(listItems.length >= 3);
  assert.ok(
    listItems.every((element) =>
      element.reasons.some((reason) => reason.code === "repeated-list"),
    ),
  );
  assert.ok(listItems.every((element) => element.componentRole === "list-row"));
  assert.ok(inspection.quality.roles["list-row"] >= 3);
  assert.equal(inspection.layoutTree.responsive.mode, "stacked-list");
  assert.equal(inspection.quality.responsive.primaryFlow, "keep list rows full-width with stable vertical rhythm");
  assert.equal(inspection.layoutTree.screenIntent.id, "mobile");
  assert.equal(inspection.quality.screenIntent.id, "mobile");
  assert.ok(
    inspection.elements.some(
      (element) => (element.signals?.textLineScore ?? 0) >= 0.62,
    ),
  );
  assert.ok(inspection.layoutTree.patterns.repeatedLists.length >= 1);
  assert.ok(inspection.layoutTree.patterns.repeatedLists[0].children.length >= 3);
  assert.equal(inspection.layoutTree.groups.some((group) => group.kind === "repeated-list"), true);
  assert.ok(inspection.quality.patterns.repeatedLists >= 1);
  assert.ok(inspection.quality.patterns.textLines >= 1);
});

test("inspectImageDataPixels detects repeated card grids offline", () => {
  const inspection = inspectImageDataPixels(createSyntheticCardGridScreenshot(240, 180));

  assert.ok(inspection);
  assert.ok(inspection.layoutTree.patterns.repeatedGrids.length >= 1);
  const grid = inspection.layoutTree.patterns.repeatedGrids[0];
  assert.equal(grid.kind, "repeated-grid");
  assert.equal(grid.rows, 2);
  assert.equal(grid.columns, 3);
  assert.ok(grid.children.length >= 4);
  assert.ok(grid.confidence >= 0.62);
  assert.equal(inspection.layoutTree.groups.some((group) => group.kind === "repeated-grid"), true);
  assert.equal(inspection.quality.patterns.repeatedGrids >= 1, true);
  assert.equal(inspection.layoutTree.responsive.mode, "responsive-card-grid");
  assert.equal(inspection.layoutTree.screenIntent.id, "dashboard");
});

test("inspectImageDataPixels detects dashboard stat rows offline", () => {
  const inspection = inspectImageDataPixels(createSyntheticStatRowScreenshot(240, 180));

  assert.ok(inspection.layoutTree.patterns.statRows.length >= 1);
  const statRow = inspection.layoutTree.patterns.statRows[0];
  assert.equal(statRow.kind, "stat-row");
  assert.equal(statRow.axis, "horizontal");
  assert.ok(statRow.cardCount >= 2);
  assert.ok(statRow.children.length >= 2);
  assert.ok(statRow.confidence >= 0.64);
  assert.equal(inspection.layoutTree.groups.some((group) => group.kind === "stat-row"), true);
  assert.equal(inspection.quality.patterns.statRows >= 1, true);
  assert.equal(inspection.quality.responsive.mode, "stat-strip");
  assert.equal(inspection.layoutTree.screenIntent.id, "dashboard");
});

test("inspectImageDataPixels detects grouped form flows offline", () => {
  const inspection = inspectImageDataPixels(createSyntheticFormScreenshot(180, 260));

  assert.ok(inspection);
  assert.ok(inspection.layoutTree.patterns.formGroups.length >= 1);
  const formGroup = inspection.layoutTree.patterns.formGroups[0];
  assert.equal(formGroup.kind, "form-group");
  assert.ok(formGroup.fieldCount >= 2);
  assert.ok(formGroup.actionCount >= 1);
  assert.ok(formGroup.confidence >= 0.6);
  assert.equal(inspection.layoutTree.groups.some((group) => group.kind === "form-group"), true);
  assert.equal(inspection.quality.patterns.formGroups >= 1, true);
  assert.equal(inspection.layoutTree.responsive.mode, "form-flow");
  assert.equal(inspection.layoutTree.screenIntent.id, "auth");
  assert.ok(
    inspection.elements
      .filter((element) => formGroup.children.includes(element.id))
      .some((element) => element.reasons.some((reason) => reason.code === "form-group")),
  );
});

test("inspectImageDataPixels detects aligned data tables offline", () => {
  const inspection = inspectImageDataPixels(createSyntheticTableScreenshot(240, 180));

  assert.ok(inspection.elements.length >= 9);
  assert.ok(inspection.layoutTree.patterns.dataTables.length >= 1);
  const table = inspection.layoutTree.patterns.dataTables[0];
  assert.equal(table.kind, "data-table");
  assert.ok(table.rows >= 3);
  assert.ok(table.columns >= 3);
  assert.ok(table.children.length >= 9);
  assert.ok(table.confidence >= 0.66);
  assert.equal(inspection.layoutTree.groups.some((group) => group.kind === "data-table"), true);
  assert.equal(inspection.quality.patterns.dataTables >= 1, true);
  assert.equal(inspection.quality.responsive.mode, "data-table");
  assert.equal(inspection.layoutTree.screenIntent.id, "dashboard");
  assert.ok(
    inspection.elements
      .filter((element) => table.children.includes(element.id))
      .every((element) => element.reasons.some((reason) => reason.code === "data-table")),
  );
});

test("inspectImageDataPixels detects bar chart series offline", () => {
  const inspection = inspectImageDataPixels(createSyntheticBarChartScreenshot(240, 180));

  assert.ok(inspection.elements.length >= 3);
  assert.ok(inspection.layoutTree.patterns.charts.length >= 1);
  const chart = inspection.layoutTree.patterns.charts[0];
  assert.equal(chart.kind, "chart-series");
  assert.equal(chart.chartKind, "bar");
  assert.ok(chart.seriesCount >= 3);
  assert.ok(chart.children.length >= 3);
  assert.ok(chart.confidence >= 0.64);
  assert.equal(inspection.layoutTree.groups.some((group) => group.kind === "chart-series"), true);
  assert.equal(inspection.quality.patterns.charts >= 1, true);
  assert.equal(inspection.quality.responsive.mode, "analytics-chart");
  assert.equal(inspection.layoutTree.screenIntent.id, "dashboard");
  assert.ok(
    inspection.elements
      .filter((element) => chart.children.includes(element.id))
      .every((element) => element.reasons.some((reason) => reason.code === "chart-series")),
  );
});

test("inspectImageDataPixels detects horizontal action clusters offline", () => {
  const inspection = inspectImageDataPixels(createSyntheticActionClusterScreenshot(360, 180));

  assert.ok(inspection.elements.length >= 4);
  assert.ok(inspection.layoutTree.patterns.actionClusters.length >= 1);
  const cluster = inspection.layoutTree.patterns.actionClusters[0];
  assert.equal(cluster.kind, "action-cluster");
  assert.equal(cluster.axis, "horizontal");
  assert.ok(cluster.controlCount >= 4);
  assert.ok(cluster.children.length >= 4);
  assert.ok(cluster.confidence >= 0.62);
  assert.equal(inspection.layoutTree.groups.some((group) => group.kind === "action-cluster"), true);
  assert.equal(inspection.quality.patterns.actionClusters >= 1, true);
  assert.equal(inspection.quality.responsive.mode, "action-toolbar");
});

test("inspectImageDataPixels detects tab sets offline", () => {
  const inspection = inspectImageDataPixels(createSyntheticTabSetScreenshot(480, 240));

  assert.ok(inspection.elements.length >= 3);
  assert.ok(inspection.layoutTree.patterns.tabSets.length >= 1);
  const tabSet = inspection.layoutTree.patterns.tabSets[0];
  assert.equal(tabSet.kind, "tab-set");
  assert.equal(tabSet.axis, "horizontal");
  assert.match(tabSet.tabKind, /tabs|segmented-control/);
  assert.ok(tabSet.tabCount >= 3);
  assert.ok(tabSet.selectedIndex >= 0);
  assert.ok(tabSet.confidence >= 0.64);
  assert.equal(inspection.layoutTree.groups.some((group) => group.kind === "tab-set"), true);
  assert.equal(inspection.layoutTree.patterns.actionClusters.length, 0);
  assert.equal(inspection.quality.patterns.tabSets >= 1, true);
  assert.equal(inspection.quality.responsive.mode, "tabbed-content");
  assert.ok(
    inspection.elements
      .filter((element) => tabSet.children.includes(element.id))
      .every((element) => element.reasons.some((reason) => reason.code === "tab-set")),
  );
});

test("inspectImageDataPixels detects centered dialog panels offline", () => {
  const inspection = inspectImageDataPixels(createSyntheticDialogScreenshot(500, 360));

  assert.ok(inspection.elements.length >= 1);
  assert.ok(inspection.layoutTree.patterns.dialogPanels.length >= 1);
  const dialog = inspection.layoutTree.patterns.dialogPanels[0];
  assert.equal(dialog.kind, "dialog-panel");
  assert.equal(dialog.axis, "overlay");
  assert.equal(dialog.modalType, "centered-dialog");
  assert.ok(dialog.children.length >= 1);
  assert.ok(dialog.centeredness >= 0.7);
  assert.ok(dialog.confidence >= 0.65);
  assert.equal(inspection.layoutTree.groups.some((group) => group.kind === "dialog-panel"), true);
  assert.equal(inspection.quality.patterns.dialogPanels >= 1, true);
  assert.equal(inspection.quality.responsive.mode, "modal-dialog");
  assert.equal(inspection.layoutTree.screenIntent.id, "modal");
  assert.ok(
    inspection.elements
      .filter((element) => dialog.children.includes(element.id))
      .some((element) => element.reasons.some((reason) => reason.code === "dialog-panel")),
  );
});

test("inspectImageDataPixels detects centered empty states offline", () => {
  const inspection = inspectImageDataPixels(createSyntheticEmptyStateScreenshot(360, 260));

  assert.ok(inspection.elements.length >= 1);
  assert.ok(inspection.layoutTree.patterns.emptyStates.length >= 1);
  const emptyState = inspection.layoutTree.patterns.emptyStates[0];
  assert.equal(emptyState.kind, "empty-state");
  assert.equal(emptyState.axis, "centered");
  assert.ok(emptyState.children.length >= 1);
  assert.ok(emptyState.textCount >= 1);
  assert.ok(emptyState.actionCount >= 1);
  assert.ok(emptyState.centeredness >= 0.55);
  assert.ok(emptyState.confidence >= 0.64);
  assert.equal(inspection.layoutTree.groups.some((group) => group.kind === "empty-state"), true);
  assert.equal(inspection.quality.patterns.emptyStates >= 1, true);
  assert.equal(inspection.layoutTree.responsive.mode, "empty-state");
  assert.equal(inspection.layoutTree.screenIntent.id, "empty");
  assert.ok(
    inspection.elements
      .filter((element) => emptyState.children.includes(element.id))
      .some((element) => element.reasons.some((reason) => reason.code === "empty-state")),
  );
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
  assert.match(exact.generatedCode, /Sample screenshot metadata identifies this region/);
  assert.doesNotMatch(exact.generatedCode, /Bundled reference metadata/);
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

test("classifyLayoutArchetype uses local screen intent for generic uploads", () => {
  const offlineInspection = inspectImageDataPixels(createSyntheticScreenshot(120, 80));
  const result = classifyLayoutArchetype({
    name: "screen-capture.png",
    type: "image/png",
    size: 2048,
    width: 1440,
    height: 900,
    offlineInspection,
  });

  assert.equal(result.archetypeId, "dashboard");
  assert.ok(result.scores.dashboard > result.scores.landing);
});

test("buildAdvancedOfflineOverrides includes confidence in summary", () => {
  const advanced = buildAdvancedOfflineOverrides(
    { name: "checkout-cart.png", type: "image/png", size: 512000, width: 1280, height: 800 },
    { readableSize: "500.0 KB", dimensionLine: "1280x800px landscape frame (aspect 1.60)." },
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
    { readableSize: "500.0 KB", dimensionLine: "1440x900px landscape frame (aspect 1.60)." },
  );

  assert.match(advanced.generatedCode, /const designTokens/);
  assert.match(advanced.generatedCode, /const detectedElements/);
  assert.match(advanced.generatedCode, /const layoutRegions/);
  assert.match(advanced.generatedCode, /import \{ Badge \} from "@\/components\/ui\/badge"/);
  assert.match(advanced.generatedCode, /export default function GeneratedDashboard/);
  assert.match(advanced.generatedCode, /const shadcnPrimitiveMap/);
  assert.match(advanced.generatedCode, /Mapped to \{shadcnPrimitiveMap\[role\]/);
  assert.match(advanced.generatedCode, /type DetectionElement/);
  assert.match(advanced.generatedCode, /type UsableSectionModel/);
  assert.match(advanced.generatedCode, /const sampleData/);
  assert.match(advanced.generatedCode, /const sampleCollections/);
  assert.match(advanced.generatedCode, /function GeneratedScreenHeader/);
  assert.match(advanced.generatedCode, /sampleData\.screenTitle/);
  assert.match(advanced.generatedCode, /production-facing layout/);
  assert.match(advanced.generatedCode, /Implementation checklist/);
  assert.match(advanced.generatedCode, /CardTitle/);
  assert.match(advanced.generatedCode, /Input id=.*placeholder="Enter product data"/);
  assert.match(advanced.generatedCode, /import \{ Label \} from "@\/components\/ui\/label"/);
  assert.match(advanced.generatedCode, /const responsiveIntent/);
  assert.match(advanced.generatedCode, /const screenIntent/);
  assert.match(advanced.generatedCode, /Responsive intent/);
  assert.match(advanced.generatedCode, /Screen intent/);
  assert.match(advanced.generatedCode, /sidebar-grid/);
  assert.match(advanced.generatedCode, /app-shell/);
  assert.match(advanced.generatedCode, /Detected app shell/);
  assert.match(advanced.generatedCode, /desktop-sidebar-shell/);
  assert.match(advanced.generatedCode, /aria-label="Top navigation"/);
  assert.match(advanced.generatedCode, /variant=\{index === 0 \? "secondary" : "ghost"\}/);
  assert.match(advanced.generatedCode, /aria-current=\{index === 0 \? "page" : undefined\}/);
  assert.match(advanced.generatedCode, /renderPrimitiveBody/);
  assert.match(advanced.generatedCode, /componentRole/);
  assert.match(advanced.generatedCode, /top-navigation|side-navigation|form-field|primary-action/);
  assert.match(advanced.generatedCode, /Component primitive/);
  assert.match(advanced.generatedCode, /DetectionGridReference/);
  assert.match(advanced.generatedCode, /header|side-nav/);
  assert.match(advanced.generatedCode, new RegExp(offlineInspection.designTokens.accent.slice(1), "i"));
  assert.doesNotMatch(advanced.generatedCode, /Rows 1-8, columns 1-12/);
  assertGeneratedTsxSyntax(advanced.generatedCode, "advanced-offline-dashboard");
});

test("buildAdvancedOfflineOverrides renders repeated-list patterns as scaffold regions", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticRepeatedListScreenshot(180, 260),
  );
  const advanced = buildAdvancedOfflineOverrides(
    {
      name: "list-feed.png",
      type: "image/png",
      size: 512000,
      width: 390,
      height: 844,
      offlineInspection,
    },
    { readableSize: "500.0 KB", dimensionLine: "390x844px portrait frame." },
  );

  assert.match(advanced.generatedCode, /const detectedPatterns/);
  assert.match(advanced.generatedCode, /const screenIntent/);
  assert.match(advanced.generatedCode, /repeated-list/);
  assert.match(advanced.generatedCode, /"primitive": "list-item"/);
  assert.match(advanced.generatedCode, /"componentRole": "list-row"/);
  assert.match(advanced.generatedCode, /region\.kind === "repeated-list"/);
  assert.match(advanced.generatedCode, /sampleCollections\.rows/);
  assert.match(advanced.generatedCode, /Replace with a real list item/);
  assert.match(advanced.generatedCode, /State coverage: add loading skeletons, empty copy, and row-level error handling/);
  assert.match(advanced.generatedCode, /text-line signals shape the export/);
});

test("buildAdvancedOfflineOverrides renders repeated-grid patterns as scaffold regions", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticCardGridScreenshot(240, 180),
  );
  const advanced = buildAdvancedOfflineOverrides(
    {
      name: "card-layout.png",
      type: "image/png",
      size: 512000,
      width: 1024,
      height: 768,
      offlineInspection,
    },
    { readableSize: "500.0 KB", dimensionLine: "1024x768px desktop frame." },
  );

  assert.match(advanced.generatedCode, /const detectedPatterns/);
  assert.match(advanced.generatedCode, /repeated-grid/);
  assert.match(advanced.generatedCode, /"primitive": "card-grid"/);
  assert.match(advanced.generatedCode, /gridTemplateColumns/);
  assert.match(advanced.generatedCode, /sampleCollections\.cards/);
  assert.match(advanced.generatedCode, /State coverage: include loading cards, empty grid messaging, and unavailable-item fallbacks/);
  assert.match(advanced.generatedCode, /repeated grid patterns/);
});

test("buildAdvancedOfflineOverrides renders stat-row patterns as scaffold regions", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticStatRowScreenshot(240, 180),
  );
  const advanced = buildAdvancedOfflineOverrides(
    {
      name: "metric-strip.png",
      type: "image/png",
      size: 512000,
      width: 1024,
      height: 768,
      offlineInspection,
    },
    { readableSize: "500.0 KB", dimensionLine: "1024x768px desktop frame." },
  );

  assert.match(advanced.summary, /Dashboard/i);
  assert.match(advanced.generatedCode, /stat-row/);
  assert.match(advanced.generatedCode, /KPI cards/);
  assert.match(advanced.generatedCode, /cardCount/);
  assert.match(advanced.generatedCode, /sampleCollections\.metrics/);
  assert.match(advanced.generatedCode, /stat rows/);
});

test("buildAdvancedOfflineOverrides renders form-group patterns as scaffold regions", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticFormScreenshot(180, 260),
  );
  const advanced = buildAdvancedOfflineOverrides(
    {
      name: "plain-upload.png",
      type: "image/png",
      size: 512000,
      width: 390,
      height: 844,
      offlineInspection,
    },
    { readableSize: "500.0 KB", dimensionLine: "390x844px portrait frame." },
  );

  assert.match(advanced.summary, /Authentication/i);
  assert.match(advanced.generatedCode, /form-group/);
  assert.match(advanced.generatedCode, /<Label htmlFor=/);
  assert.match(advanced.generatedCode, /<Input id=/);
  assert.match(advanced.generatedCode, /Submit action/);
  assert.match(advanced.generatedCode, /State coverage: wire validation errors, pending submit state, and success feedback/);
  assert.match(advanced.generatedCode, /form groups/);
});

test("buildAdvancedOfflineOverrides renders data-table patterns as scaffold regions", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticTableScreenshot(240, 180),
  );
  const advanced = buildAdvancedOfflineOverrides(
    {
      name: "admin-table.png",
      type: "image/png",
      size: 512000,
      width: 1024,
      height: 768,
      offlineInspection,
    },
    { readableSize: "500.0 KB", dimensionLine: "1024x768px desktop frame." },
  );

  assert.match(advanced.summary, /Dashboard/i);
  assert.match(advanced.generatedCode, /data-table/);
  assert.match(advanced.generatedCode, /from "@\/components\/ui\/table"/);
  assert.match(advanced.generatedCode, /<Table className="min-w-\[28rem\] text-xs"/);
  assert.match(advanced.generatedCode, /<TableHeader>/);
  assert.match(advanced.generatedCode, /<TableCell/);
  assert.match(advanced.generatedCode, /sampleCollections\.tableRows/);
  assert.match(advanced.generatedCode, /columnIndex \+ 1/);
  assert.match(advanced.generatedCode, /State coverage: add loading rows, no-results messaging, pagination overflow, and fetch-error recovery/);
  assert.match(advanced.generatedCode, /data tables/);
});

test("buildAdvancedOfflineOverrides renders chart-series patterns as scaffold regions", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticBarChartScreenshot(240, 180),
  );
  const advanced = buildAdvancedOfflineOverrides(
    {
      name: "analytics-chart.png",
      type: "image/png",
      size: 512000,
      width: 1024,
      height: 768,
      offlineInspection,
    },
    { readableSize: "500.0 KB", dimensionLine: "1024x768px desktop frame." },
  );

  assert.match(advanced.summary, /Dashboard/i);
  assert.match(advanced.generatedCode, /chart-series/);
  assert.match(advanced.generatedCode, /bar chart preview/);
  assert.match(advanced.generatedCode, /sampleCollections\.chartValues/);
  assert.match(advanced.generatedCode, /seriesCount/);
  assert.match(advanced.generatedCode, /State coverage: include loading, no-data, and metric fetch-error summaries/);
  assert.match(advanced.generatedCode, /chart series/);
});

test("buildAdvancedOfflineOverrides renders action-cluster patterns as scaffold regions", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticActionClusterScreenshot(360, 180),
  );
  const advanced = buildAdvancedOfflineOverrides(
    {
      name: "toolbar-row.png",
      type: "image/png",
      size: 512000,
      width: 360,
      height: 180,
      offlineInspection,
    },
    { readableSize: "500.0 KB", dimensionLine: "360x180px landscape frame." },
  );

  assert.match(advanced.generatedCode, /action-cluster/);
  assert.match(advanced.generatedCode, /region\.kind === "action-cluster"/);
  assert.match(advanced.generatedCode, /<Button\s+key=\{index\}/);
  assert.match(advanced.generatedCode, /variant=\{index === 0 \? "default" : "outline"\}/);
  assert.match(advanced.generatedCode, /Action \{index \+ 1\}/);
  assert.match(advanced.generatedCode, /controlCount/);
  assert.match(advanced.generatedCode, /action clusters/);
});

test("buildAdvancedOfflineOverrides renders tab-set patterns as scaffold regions", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticTabSetScreenshot(480, 240),
  );
  const advanced = buildAdvancedOfflineOverrides(
    {
      name: "tabbed-settings.png",
      type: "image/png",
      size: 512000,
      width: 480,
      height: 240,
      offlineInspection,
    },
    { readableSize: "500.0 KB", dimensionLine: "480x240px landscape frame." },
  );

  assert.match(advanced.generatedCode, /tab-set/);
  assert.match(advanced.generatedCode, /import \{ Tabs, TabsContent, TabsList, TabsTrigger \} from "@\/components\/ui\/tabs"/);
  assert.match(advanced.generatedCode, /<Tabs defaultValue=/);
  assert.match(advanced.generatedCode, /<TabsTrigger/);
  assert.match(advanced.generatedCode, /tabbed-content/);
  assert.match(advanced.generatedCode, /tab sets/);
});

test("buildAdvancedOfflineOverrides renders dialog-panel patterns as scaffold regions", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticDialogScreenshot(500, 360),
  );
  const advanced = buildAdvancedOfflineOverrides(
    {
      name: "profile-modal.png",
      type: "image/png",
      size: 512000,
      width: 500,
      height: 360,
      offlineInspection,
    },
    { readableSize: "500.0 KB", dimensionLine: "500x360px desktop frame." },
  );

  assert.match(advanced.summary, /Modal dialog/i);
  assert.match(advanced.generatedCode, /dialog-panel/);
  assert.match(advanced.generatedCode, /from "@\/components\/ui\/dialog"/);
  assert.match(advanced.generatedCode, /<Dialog defaultOpen>/);
  assert.match(advanced.generatedCode, /<DialogContent/);
  assert.match(advanced.generatedCode, /modal-dialog/);
  assert.match(advanced.generatedCode, /dialog panels/);
});

test("buildAdvancedOfflineOverrides renders empty-state patterns as scaffold regions", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticEmptyStateScreenshot(360, 260),
  );
  const advanced = buildAdvancedOfflineOverrides(
    {
      name: "no-results-empty.png",
      type: "image/png",
      size: 512000,
      width: 360,
      height: 260,
      offlineInspection,
    },
    { readableSize: "500.0 KB", dimensionLine: "360x260px desktop frame." },
  );

  assert.match(advanced.summary, /Empty state/i);
  assert.match(advanced.generatedCode, /empty-state/);
  assert.match(advanced.generatedCode, /No results yet/);
  assert.match(advanced.generatedCode, /role="status"/);
  assert.match(advanced.generatedCode, /empty states/);
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
  assert.match(artifact.generatedCode, /SVG export/);
  assert.match(artifact.generatedCode, /Email/);
  assert.match(artifact.generatedCode, /Password/);
  assert.match(artifact.generatedCode, /GeneratedAuthScreen/);
  assert.match(artifact.generatedCode, /export default function GeneratedAuthScreen/);
  assert.match(artifact.generatedCode, /const detectedElements: SvgElement\[\]/);
  assert.match(artifact.generatedCode, /const layoutRegions: SvgLayoutRegion\[\]/);
  assert.match(artifact.generatedCode, /const shadcnPrimitiveMap: Record<string, string>/);

  const blueprint = extractProductionScaffoldBlueprint(artifact.generatedCode);
  assert.ok(blueprint);
  assert.equal(blueprint.componentName, "GeneratedAuthScreen");
  assert.equal(blueprint.generator, "offline-detection");
  assert.ok(blueprint.detectedElements.length > 0);
  assert.ok(blueprint.layoutRegions.length > 0);
  assertGeneratedTsxSyntax(artifact.generatedCode, "svg-auth-screen");
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
  assert.ok(artifact.plan.some((section) => section.title === "Screen Intent"));
  assert.ok(artifact.plan.some((section) => section.title === "Design Tokens"));
  assert.ok(artifact.plan.some((section) => section.title === "Local Quality Checks"));
  assert.deepEqual(
    artifact.previewStats.map((stat) => stat.label),
    ["Regions", "Elements", "Responsive", "Contrast"],
  );
  assert.ok(artifact.detections.elements.length >= 3);
  assert.ok(artifact.detections.source.width > 0);
  assert.ok(artifact.detections.designTokens.surface);
  assert.ok(artifact.detections.elements.every((element) => element.reasons.length > 0));
  assert.equal(artifact.detections.layoutTree.strategy, "projection-groups");
  assert.equal(artifact.detections.layoutTree.screenIntent.id, "dashboard");
  assert.ok(artifact.detections.quality.confidence > 0);
  assert.match(artifact.generatedCode, /const designTokens/);
  assert.match(artifact.generatedCode, /const detectedElements/);
  assert.match(artifact.generatedCode, /const layoutRegions/);
});

const REGENERATED_PATTERN_SUMMARY_RE =
  /app shell patterns, .* dialog panels, .* empty states, .* repeated list patterns, .* repeated grid patterns, .* stat rows, .* form groups, .* data tables, .* chart series, .* action clusters, and .* tab sets remain grouped/;

test("regenerateArtifactFromDetections preserves app-shell scaffold groups", () => {
  const offlineInspection = inspectImageDataPixels(createSyntheticScreenshot(120, 80));
  const artifact = buildUiFlowArtifact({
    name: "operator-console.png",
    type: "image/png",
    size: 8192,
    width: 1440,
    height: 900,
    offlineInspection,
  });

  const regenerated = regenerateArtifactFromDetections(artifact, artifact.detections);

  assert.match(regenerated.generatedCode, /import \{ Badge \} from "@\/components\/ui\/badge"/);
  assert.match(regenerated.generatedCode, /export default function ReviewedScreenshotStarter/);
  assert.match(regenerated.generatedCode, /const detectedElements: CorrectedElement\[\]/);
  assert.match(regenerated.generatedCode, /const correctedElements = detectedElements/);
  assert.match(regenerated.generatedCode, /const detectedPatterns: CorrectedPatterns/);
  assert.match(regenerated.generatedCode, /const layoutRegions: LayoutRegion\[\]/);
  assert.match(regenerated.generatedCode, /Screenshot starter component/);
  assert.match(regenerated.generatedCode, /Implementation checklist/);
  assert.match(regenerated.generatedCode, /const shadcnPrimitiveMap/);
  assert.match(regenerated.generatedCode, /CardTitle/);
  assert.match(regenerated.generatedCode, /TabsList/);
  assert.match(regenerated.generatedCode, /Mapped to \{shadcnPrimitiveMap\[role\]/);
  assert.match(regenerated.generatedCode, /aria-label="Top navigation"/);
  assert.match(regenerated.generatedCode, /variant=\{index === 0 \? "secondary" : "ghost"\}/);
  assert.match(regenerated.generatedCode, /aria-current=\{index === 0 \? "page" : undefined\}/);
  assert.match(regenerated.generatedCode, /appShells/);
  assert.match(regenerated.generatedCode, /Detected app shell/);
  assert.match(regenerated.generatedCode, /App shell/);
  assert.match(regenerated.generatedCode, REGENERATED_PATTERN_SUMMARY_RE);

  const blueprint = extractProductionScaffoldBlueprint(regenerated.generatedCode);
  assert.ok(blueprint);
  assert.equal(blueprint.componentName, "ReviewedScreenshotStarter");
  assert.equal(blueprint.generator, "offline-detection");
  assert.ok(blueprint.detectedElements.length > 0);
  assert.ok(blueprint.layoutRegions.length > 0);
  assert.equal(blueprint.primitiveSummary.patternCounts.appShells, 1);
  assertGeneratedTsxSyntax(regenerated.generatedCode, "corrected-offline-dashboard");
});

test("regenerateArtifactFromDetections preserves repeated-list scaffold groups", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticRepeatedListScreenshot(180, 260),
  );
  const artifact = buildUiFlowArtifact({
    name: "list-feed.png",
    type: "image/png",
    size: 8192,
    width: 390,
    height: 844,
    offlineInspection,
  });

  const regenerated = regenerateArtifactFromDetections(artifact, artifact.detections);

  assert.match(regenerated.generatedCode, /const correctedPatterns/);
  assert.match(regenerated.generatedCode, /const sampleSectionData/);
  assert.match(regenerated.generatedCode, /const responsiveIntent/);
  assert.match(regenerated.generatedCode, /const correctedElementById/);
  assert.match(regenerated.generatedCode, /renderCorrectedPrimitive/);
  assert.match(regenerated.generatedCode, /function SectionStateHint/);
  assert.match(regenerated.generatedCode, /function SectionSampleDataHint/);
  assert.match(regenerated.generatedCode, /Sample rows: /);
  assert.match(regenerated.generatedCode, /State coverage: add loading skeletons, empty copy, and row-level error handling/);
  assert.match(regenerated.generatedCode, /Repeated list/);
  assert.match(regenerated.generatedCode, /groupedElementIds/);
  assert.match(regenerated.generatedCode, REGENERATED_PATTERN_SUMMARY_RE);
});

test("regenerateArtifactFromDetections preserves repeated-grid scaffold groups", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticCardGridScreenshot(240, 180),
  );
  const artifact = buildUiFlowArtifact({
    name: "card-layout.png",
    type: "image/png",
    size: 8192,
    width: 1024,
    height: 768,
    offlineInspection,
  });

  const regenerated = regenerateArtifactFromDetections(artifact, artifact.detections);

  assert.match(regenerated.generatedCode, /const correctedPatterns/);
  assert.match(regenerated.generatedCode, /repeatedGrids/);
  assert.match(regenerated.generatedCode, /Detected repeated grid/);
  assert.match(regenerated.generatedCode, /gridTemplateColumns/);
  assert.match(regenerated.generatedCode, /Sample cards: /);
  assert.match(regenerated.generatedCode, /State coverage: include loading cards, empty grid messaging, and unavailable-item fallbacks/);
  assert.match(regenerated.generatedCode, REGENERATED_PATTERN_SUMMARY_RE);
});

test("regenerateArtifactFromDetections preserves stat-row scaffold groups", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticStatRowScreenshot(240, 180),
  );
  const artifact = buildUiFlowArtifact({
    name: "metric-strip.png",
    type: "image/png",
    size: 8192,
    width: 1024,
    height: 768,
    offlineInspection,
  });

  const regenerated = regenerateArtifactFromDetections(artifact, artifact.detections);

  assert.match(regenerated.generatedCode, /statRows/);
  assert.match(regenerated.generatedCode, /Detected stat row/);
  assert.match(regenerated.generatedCode, /Stat row/);
  assert.match(regenerated.generatedCode, /Sample metrics: /);
  assert.match(regenerated.generatedCode, REGENERATED_PATTERN_SUMMARY_RE);
});

test("regenerateArtifactFromDetections preserves form-group scaffold groups", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticFormScreenshot(180, 260),
  );
  const artifact = buildUiFlowArtifact({
    name: "plain-upload.png",
    type: "image/png",
    size: 8192,
    width: 390,
    height: 844,
    offlineInspection,
  });

  const regenerated = regenerateArtifactFromDetections(artifact, artifact.detections);

  assert.match(regenerated.generatedCode, /formGroups/);
  assert.match(regenerated.generatedCode, /Detected form group/);
  assert.match(regenerated.generatedCode, /import \{ Label \} from "@\/components\/ui\/label"/);
  assert.match(regenerated.generatedCode, /<Label htmlFor=/);
  assert.match(regenerated.generatedCode, /<Input id=/);
  assert.match(regenerated.generatedCode, /State coverage: wire validation errors, pending submit state, and success feedback/);
  assert.match(regenerated.generatedCode, REGENERATED_PATTERN_SUMMARY_RE);
});

test("regenerateArtifactFromDetections preserves data-table scaffold groups", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticTableScreenshot(240, 180),
  );
  const artifact = buildUiFlowArtifact({
    name: "admin-table.png",
    type: "image/png",
    size: 8192,
    width: 1024,
    height: 768,
    offlineInspection,
  });

  const regenerated = regenerateArtifactFromDetections(artifact, artifact.detections);

  assert.match(regenerated.generatedCode, /dataTables/);
  assert.match(regenerated.generatedCode, /Detected data table/);
  assert.match(regenerated.generatedCode, /from "@\/components\/ui\/table"/);
  assert.match(regenerated.generatedCode, /<Table className="min-w-\[28rem\]"/);
  assert.match(regenerated.generatedCode, /<TableCell/);
  assert.match(regenerated.generatedCode, /Sample table columns: /);
  assert.match(regenerated.generatedCode, /State coverage: add loading rows, no-results messaging, pagination overflow, and fetch-error recovery/);
  assert.match(regenerated.generatedCode, REGENERATED_PATTERN_SUMMARY_RE);
});

test("regenerateArtifactFromDetections preserves chart-series scaffold groups", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticBarChartScreenshot(240, 180),
  );
  const artifact = buildUiFlowArtifact({
    name: "analytics-chart.png",
    type: "image/png",
    size: 8192,
    width: 1024,
    height: 768,
    offlineInspection,
  });

  const regenerated = regenerateArtifactFromDetections(artifact, artifact.detections);

  assert.match(regenerated.generatedCode, /charts/);
  assert.match(regenerated.generatedCode, /Detected chart series/);
  assert.match(regenerated.generatedCode, /Chart series/);
  assert.match(regenerated.generatedCode, /Sample chart values: /);
  assert.match(regenerated.generatedCode, /State coverage: include loading, no-data, and metric fetch-error summaries/);
  assert.match(regenerated.generatedCode, REGENERATED_PATTERN_SUMMARY_RE);
});

test("regenerateArtifactFromDetections preserves action-cluster scaffold groups", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticActionClusterScreenshot(360, 180),
  );
  const artifact = buildUiFlowArtifact({
    name: "toolbar-row.png",
    type: "image/png",
    size: 8192,
    width: 360,
    height: 180,
    offlineInspection,
  });

  const regenerated = regenerateArtifactFromDetections(artifact, artifact.detections);

  assert.match(regenerated.generatedCode, /actionClusters/);
  assert.match(regenerated.generatedCode, /Detected action cluster/);
  assert.match(regenerated.generatedCode, /Action cluster/);
  assert.match(regenerated.generatedCode, /<Button\s+key=\{childId\}/);
  assert.match(regenerated.generatedCode, /variant=\{index === 0 \? "default" : "outline"\}/);
  assert.match(regenerated.generatedCode, REGENERATED_PATTERN_SUMMARY_RE);
});

test("regenerateArtifactFromDetections preserves tab-set scaffold groups", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticTabSetScreenshot(480, 240),
  );
  const artifact = buildUiFlowArtifact({
    name: "tabbed-settings.png",
    type: "image/png",
    size: 8192,
    width: 480,
    height: 240,
    offlineInspection,
  });

  const regenerated = regenerateArtifactFromDetections(artifact, artifact.detections);

  assert.match(regenerated.generatedCode, /tabSets/);
  assert.match(regenerated.generatedCode, /Detected tab set/);
  assert.match(regenerated.generatedCode, /Tab set/);
  assert.match(regenerated.generatedCode, /import \{ Tabs, TabsContent, TabsList, TabsTrigger \} from "@\/components\/ui\/tabs"/);
  assert.match(regenerated.generatedCode, /<Tabs defaultValue=/);
  assert.match(regenerated.generatedCode, /<TabsTrigger/);
  assert.match(regenerated.generatedCode, REGENERATED_PATTERN_SUMMARY_RE);
});

test("regenerateArtifactFromDetections preserves dialog-panel scaffold groups", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticDialogScreenshot(500, 360),
  );
  const artifact = buildUiFlowArtifact({
    name: "profile-modal.png",
    type: "image/png",
    size: 8192,
    width: 500,
    height: 360,
    offlineInspection,
  });
  const regenerated = regenerateArtifactFromDetections(artifact, artifact.detections);

  assert.match(regenerated.generatedCode, /dialogPanels/);
  assert.match(regenerated.generatedCode, /Detected dialog panel/);
  assert.match(regenerated.generatedCode, /from "@\/components\/ui\/dialog"/);
  assert.match(regenerated.generatedCode, /<Dialog[^>]*defaultOpen/);
  assert.match(regenerated.generatedCode, /<DialogContent/);
  assert.match(regenerated.generatedCode, REGENERATED_PATTERN_SUMMARY_RE);
});

test("regenerateArtifactFromDetections preserves empty-state scaffold groups", () => {
  const offlineInspection = inspectImageDataPixels(
    createSyntheticEmptyStateScreenshot(360, 260),
  );
  const artifact = buildUiFlowArtifact({
    name: "no-results-empty.png",
    type: "image/png",
    size: 8192,
    width: 360,
    height: 260,
    offlineInspection,
  });
  const regenerated = regenerateArtifactFromDetections(artifact, artifact.detections);

  assert.match(regenerated.generatedCode, /emptyStates/);
  assert.match(regenerated.generatedCode, /Detected empty state/);
  assert.match(regenerated.generatedCode, /Empty state/);
  assert.match(regenerated.generatedCode, /role="status"/);
  assert.match(regenerated.generatedCode, REGENERATED_PATTERN_SUMMARY_RE);
});

test("regenerateArtifactFromDetections uses corrected active elements", () => {
  const offlineInspection = inspectImageDataPixels(createSyntheticScreenshot(120, 80));
  const artifact = buildUiFlowArtifact({
    name: "operator-console.png",
    type: "image/png",
    size: 8192,
    width: 1440,
    height: 900,
    offlineInspection,
  });
  const detections = {
    ...artifact.detections,
    elements: artifact.detections.elements.map((element, index) =>
      index === 0
        ? {
            ...element,
            kind: "button-or-input",
            primitive: "field-or-action",
            userEdited: true,
          }
        : index === 1
          ? { ...element, included: false, userEdited: true }
          : element,
    ),
  };

  const regenerated = regenerateArtifactFromDetections(artifact, detections);

  assert.match(regenerated.generatedCode, /CorrectionGridReference/);
  assert.match(regenerated.generatedCode, /const correctionSummary/);
  assert.match(regenerated.generatedCode, /Applied edits/);
  assert.match(regenerated.generatedCode, /Manual corrections are the source of truth/);
  assert.match(regenerated.generatedCode, /const screenIntent/);
  assert.match(regenerated.generatedCode, /Screen intent/);
  assert.match(regenerated.generatedCode, /field-or-action/);
  assert.match(regenerated.generatedCode, /componentRole/);
  assert.match(regenerated.generatedCode, /primitive preview/);
  assert.match(regenerated.generatedCode, /Button type="button"/);
  assert.match(regenerated.generatedCode, /Manual correction/);
  assert.match(regenerated.generatedCode, /Correction confidence/);
  assert.doesNotMatch(regenerated.generatedCode, new RegExp(detections.elements[1].id));
  assert.equal(
    regenerated.previewStats.find((stat) => stat.label === "Active Elements").value,
    String(detections.elements.length - 1),
  );
  assert.equal(
    regenerated.previewStats.find((stat) => stat.label === "Edited").value,
    "2",
  );
  assert.ok(
    regenerated.detections.elements[0].confidence >= 0.72,
    "edited included element confidence should be recomputed upward",
  );
  assert.ok(
    regenerated.detections.elements[0].reasons.some(
      (reason) => reason.code === "manual-correction",
    ),
  );
  assert.ok(
    regenerated.detections.elements[0].reasons.some(
      (reason) =>
        reason.code === "manual-correction" &&
        /type, primitive, role, geometry/.test(reason.evidence),
    ),
    "manual correction reason should name the corrected dimensions",
  );
  assert.ok(
    regenerated.detections.elements[1].reasons.some(
      (reason) => reason.code === "manual-exclusion",
    ),
  );
  assert.equal(regenerated.detections.quality.correctedElementCount, 2);
  assert.equal(regenerated.detections.quality.excludedElementCount, 1);
  assert.match(regenerated.detections.quality.strategy, /manual-correction-source-of-truth/);

  const blueprint = extractProductionScaffoldBlueprint(regenerated.generatedCode);
  assert.ok(blueprint);
  assert.equal(blueprint.detectedElements.length, detections.elements.length - 1);
  assert.equal(blueprint.detectedElements[0].id, detections.elements[0].id);
  assert.equal(blueprint.detectedElements[0].primitive, "field-or-action");
  assert.equal(blueprint.detectedElements[0].componentRole, "field-or-action");
  assert.equal(blueprint.detectedElements[0].userEdited, true);
  assert.ok(blueprint.detectedElements[0].confidence >= 0.72);
  assert.ok(
    blueprint.detectedElements[0].reasons.some((reason) =>
      /Manual correction/.test(reason),
    ),
  );
  assert.ok(
    blueprint.layoutRegions.some((region) =>
      region.children.includes(detections.elements[0].id),
    ),
  );
  assert.ok(
    blueprint.reviewChecklist.some((item) =>
      /deterministic source/.test(item),
    ),
  );
  assert.ok(
    blueprint.detectedElements.every((element) => element.id !== detections.elements[1].id),
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
