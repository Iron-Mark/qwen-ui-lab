import test from "node:test";
import assert from "node:assert/strict";

import {
  buildUiFlowArtifact,
  formatFileSize,
} from "../src/lib/ui-flow.mjs";
import {
  buildQwenVisionRequest,
  getQwenConfig,
  parseQwenAnalysisText,
} from "../src/lib/qwen-analyze.mjs";

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

test("getQwenConfig reports missing API key without exposing secrets", () => {
  const config = getQwenConfig({});

  assert.equal(config.ok, false);
  assert.equal(config.missing, "DASHSCOPE_API_KEY");
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
