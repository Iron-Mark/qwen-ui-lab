import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildUiFlowArtifact,
  formatFileSize,
} from "../src/features/analysis/lib/ui-flow.mjs";
import {
  buildAnalyzeHealthResponse,
  buildQwenVisionRequest,
  canUseLiveQwen,
  getQwenConfig,
  isLiveQwenAnalysisEnabled,
  parseQwenAnalysisText,
} from "../src/features/analysis/lib/qwen-analyze.mjs";
import { filterCatalogEntries } from "../src/features/design-system/lib/catalog-filter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("formatFileSize formats bytes into readable units", () => {
  assert.equal(formatFileSize(512), "512 B");
  assert.equal(formatFileSize(2048), "2.0 KB");
  assert.equal(formatFileSize(5 * 1024 * 1024), "5.0 MB");
});

test("buildUiFlowArtifact produces the upload to preview workflow", () => {
  const artifact = buildUiFlowArtifact({
    name: "dashboard-reference.png",
    type: "image/png",
    size: 245760,
  });

  assert.equal(artifact.file.name, "dashboard-reference.png");
  assert.equal(artifact.file.readableSize, "240.0 KB");
  assert.deepEqual(
    artifact.steps.map((step) => step.label),
    [
      "Upload",
      "Analyze",
      "Plan",
      "Generate",
      "Preview",
      "Export",
    ],
  );
  assert.ok(
    artifact.plan.some((section) => section.title === "Component Map"),
  );
  assert.match(artifact.generatedCode, /export function GeneratedDashboard/);
  assert.equal(artifact.previewStats.length, 4);
});

test("buildUiFlowArtifact uses filename and dimensions in fallback plan", () => {
  const artifact = buildUiFlowArtifact({
    name: "mobile-login.png",
    type: "image/png",
    size: 1024,
    width: 390,
    height: 844,
  });

  assert.match(artifact.plan[0].body, /mobile-login\.png/);
  assert.match(artifact.plan[0].body, /390×844px/);
  assert.match(artifact.plan[1].body, /Mobile app shell|Authentication/i);
});

test("getQwenConfig reports missing API key without exposing secrets", () => {
  const config = getQwenConfig({});

  assert.equal(config.ok, false);
  assert.equal(config.missing, "DASHSCOPE_API_KEY");
});

test("canUseLiveQwen requires explicit QWEN_LIVE_ANALYSIS", () => {
  assert.equal(canUseLiveQwen({ DASHSCOPE_API_KEY: "secret" }), false);
  assert.equal(
    canUseLiveQwen({ DASHSCOPE_API_KEY: "secret", QWEN_LIVE_ANALYSIS: "true" }),
    true,
  );
  assert.equal(isLiveQwenAnalysisEnabled({ USE_LIVE_QWEN: "yes" }), true);
});

test("buildAnalyzeHealthResponse reports demo and live provider state", () => {
  assert.deepEqual(buildAnalyzeHealthResponse({}), {
    ok: true,
    provider: "demo",
    hasApiKey: false,
    liveAnalysisEnabled: false,
    model: null,
    baseUrl: null,
  });

  assert.deepEqual(
    buildAnalyzeHealthResponse({
      DASHSCOPE_API_KEY: "secret",
      QWEN_LIVE_ANALYSIS: "true",
      QWEN_MODEL: "qwen-test",
      QWEN_BASE_URL: "https://example.test/v1",
    }),
    {
      ok: true,
      provider: "qwen",
      hasApiKey: true,
      liveAnalysisEnabled: true,
      model: "qwen-test",
      baseUrl: "https://example.test/v1",
    },
  );
});

test("buildQwenVisionRequest uses OpenAI-compatible image_url content", () => {
  const request = buildQwenVisionRequest({
    imageDataUrl: "data:image/png;base64,abc123",
    fileName: "screen.png",
    fileType: "image/png",
    fileSize: 1234,
    model: "qwen3-vl-plus",
  });

  assert.equal(request.model, "qwen3-vl-plus");
  assert.equal(request.messages[0].role, "system");
  assert.equal(request.messages[1].role, "user");
  assert.equal(request.messages[1].content[1].type, "image_url");
  assert.equal(
    request.messages[1].content[1].image_url.url,
    "data:image/png;base64,abc123",
  );
});

test("parseQwenAnalysisText accepts fenced JSON from the model", () => {
  const parsed = parseQwenAnalysisText(`\`\`\`json
{
  "summary": "Dashboard shell",
  "plan": [
    {"title": "Layout", "body": "Header and cards"}
  ],
  "generatedCode": "export function GeneratedDashboard() { return null }",
  "previewStats": [
    {"label": "Components", "value": "4"}
  ]
}
\`\`\``);

  assert.equal(parsed.summary, "Dashboard shell");
  assert.equal(parsed.plan[0].title, "Layout");
  assert.match(parsed.generatedCode, /GeneratedDashboard/);
  assert.equal(parsed.previewStats[0].value, "4");
});

test("UI_LAWS includes Fitts Hick and Jakob with applications", () => {
  const source = readFileSync(
    resolve(__dirname, "../src/features/design-system/data/uilaws.ts"),
    "utf8",
  ).replace(/\r\n/g, "\n");

  assert.match(source, /id: "fitts"[\s\S]*name: "Fitts's Law"/);
  assert.match(source, /id: "hick"[\s\S]*application:[\s\S]*Upload flow/i);
  assert.match(source, /id: "jakob"[\s\S]*application:[\s\S]*familiar/i);
  assert.ok((source.match(/\n  {\n    id: "/g) ?? []).length >= 10);
});

test("filterCatalogEntries searches by name, level, and domain", () => {
  const sample = [
    {
      name: "Chart preview card",
      description: "Charts",
      usage: "Dashboard",
      level: "organism",
      domain: "product",
    },
    {
      name: "Theme toggle",
      description: "Switch",
      usage: "Header",
      level: "atom",
      domain: "product",
    },
    {
      name: "Law information card",
      description: "UILaws",
      usage: "Docs",
      level: "molecule",
      domain: "uilaws",
    },
  ];

  const charts = filterCatalogEntries(sample, "chart", "all", "all");
  assert.equal(charts.length, 1);

  const atoms = filterCatalogEntries(sample, "", "atom", "all");
  assert.equal(atoms.length, 1);
  assert.equal(atoms[0].level, "atom");

  const uilaws = filterCatalogEntries(sample, "", "all", "uilaws");
  assert.equal(uilaws.length, 1);
  assert.equal(uilaws[0].domain, "uilaws");
});
