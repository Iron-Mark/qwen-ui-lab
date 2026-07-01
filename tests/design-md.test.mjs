import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDesignMarkdown,
  DESIGN_MD_FILENAME,
} from "../src/features/analysis/lib/design-md.mjs";

const sampleArtifact = {
  file: {
    name: "dashboard-reference.png",
    type: "image/png",
    size: 120_000,
    readableSize: "117.2 KB",
    width: 1200,
    height: 800,
  },
  steps: [
    { id: "upload", label: "Upload" },
    { id: "analyze", label: "Analyze" },
    { id: "export", label: "Export" },
  ],
  plan: [
    {
      title: "Layout Read",
      body: "Header, metrics, chart, and activity regions detected.",
    },
    {
      title: "Component Map",
      body: "Use app header, stat cards, chart panel, and list rows.",
    },
  ],
  previewStats: [
    { label: "Sections", value: "4" },
    { label: "Components", value: "8" },
  ],
  generatedCode: `
export function GeneratedDashboard() {
  return <main>Dashboard scaffold</main>;
}
`,
  modeLabel: "Ready to analyze",
  summary: "Local detector produced a dashboard export from visible geometry.",
  detections: {
    source: { width: 1200, height: 800 },
    designTokens: {
      surface: "#101010",
      foreground: "#f8fafc",
      accent: "#60a5fa",
      spacing: "cozy",
    },
    elements: [
      {
        id: "header-1",
        kind: "header",
        primitive: "AppHeader",
        confidence: 0.92,
        included: true,
        box: { x: 0, y: 0, width: 1200, height: 80 },
        reasons: [
          {
            code: "top-band",
            label: "Top band position",
            evidence: "Header-like band at the top.",
            weight: 0.22,
          },
        ],
      },
      {
        id: "card-1",
        kind: "card-or-panel",
        primitive: "Card",
        confidence: 0.84,
        included: true,
        userEdited: true,
        box: { x: 32, y: 120, width: 260, height: 120 },
        reasons: [
          {
            code: "large-container",
            label: "Container scale",
            evidence: "Large card region.",
            weight: 0.16,
          },
        ],
      },
      {
        id: "card-2",
        kind: "card-or-panel",
        primitive: "Card",
        confidence: 0.8,
        included: true,
        box: { x: 320, y: 120, width: 260, height: 120 },
        reasons: [
          {
            code: "large-container",
            label: "Container scale",
            evidence: "Large card region.",
            weight: 0.16,
          },
        ],
      },
      {
        id: "text-1",
        kind: "text-row",
        primitive: "text",
        confidence: 0.72,
        included: false,
        userEdited: true,
        box: { x: 40, y: 720, width: 420, height: 24 },
        reasons: [
          {
            code: "text-line-grouping",
            label: "Aligned text signal",
            evidence: "OCR-free text line grouping.",
            weight: 0.14,
          },
        ],
      },
    ],
    layoutTree: {
      strategy: "projection-groups",
      groups: [{ id: "header" }, { id: "metrics" }],
    },
    quality: {
      confidence: 0.86,
      ambiguity: "low",
      elementCount: 3,
      strategy: "projection-groups",
    },
  },
};

test("buildDesignMarkdown exports dynamic design documentation from artifact results", () => {
  const markdown = buildDesignMarkdown({
    artifact: sampleArtifact,
    componentFilename: "generated-dashboard.tsx",
    exportedAt: "2026-06-22T00:00:00.000Z",
  });

  assert.equal(DESIGN_MD_FILENAME, "DESIGN.md");
  assert.match(markdown, /^# DESIGN\.md/);
  assert.match(markdown, /Component file: generated-dashboard\.tsx/);
  assert.match(markdown, /Exported components: GeneratedDashboard/);
  assert.match(markdown, /Average active confidence: 85% \(high\)/);
  assert.match(markdown, /Detector quality confidence: 86% \(high\)/);
  assert.match(markdown, /\| Card \| 2 \| 82% \| card-or-panel \| 1 \|/);
  assert.match(markdown, /\| accent \| #60a5fa \|/);
  assert.match(markdown, /Primitive snapping grouped 3 active detections into 2 component families/);
  assert.match(markdown, /Top band position/);
  assert.match(markdown, /Aligned text signal/);
  assert.match(markdown, /Download DESIGN\.md and verify component inventory plus detector signals are present/);
});

test("buildDesignMarkdown handles artifacts without detections", () => {
  const markdown = buildDesignMarkdown({
    artifact: {
      file: { name: "wireframe.png", type: "image/png", readableSize: "4 KB" },
      plan: [],
      previewStats: [],
      generatedCode: "export const GeneratedWireframe = () => null;",
    },
    componentFilename: "generated-wireframe.tsx",
    exportedAt: "2026-06-22T00:00:00.000Z",
  });

  assert.match(markdown, /Exported components: GeneratedWireframe/);
  assert.match(markdown, /No active detection boxes were available/);
  assert.match(markdown, /No design tokens were detected/);
  assert.match(markdown, /Run a manual visual review because no detection boxes were available/);
});
