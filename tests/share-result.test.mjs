import test from "node:test";
import assert from "node:assert/strict";

import {
  buildShareableSummary,
  encodeShareHash,
  decodeShareHash,
  buildShareUrl,
} from "../src/lib/share-result.mjs";

const sampleArtifact = {
  summary: "Admin dashboard with stat grid and activity rail.",
  modeLabel: "Local demo mode",
  file: { name: "dashboard-reference.svg" },
  previewStats: [
    { label: "Components", value: "6" },
    { label: "Sections", value: "4" },
  ],
  generatedCode: "export const Secret = 'must-not-leak';",
  plan: [{ title: "Hidden", body: "Should not appear in share payload" }],
};

test("buildShareableSummary omits code and secrets", () => {
  const payload = buildShareableSummary(sampleArtifact);

  assert.ok(payload);
  assert.equal(payload.summary, sampleArtifact.summary);
  assert.equal(payload.file, "dashboard-reference.svg");
  assert.equal(payload.mode, "Local demo mode");
  assert.deepEqual(payload.stats, [
    { l: "Components", v: "6" },
    { l: "Sections", v: "4" },
  ]);
  assert.equal("generatedCode" in payload, false);
  assert.equal("plan" in payload, false);
});

test("share hash round-trips read-only summary", () => {
  const payload = buildShareableSummary(sampleArtifact);
  const hash = encodeShareHash(payload);
  const decoded = decodeShareHash(`#${hash}`);

  assert.deepEqual(decoded, payload);
});

test("buildShareUrl encodes hash on home path", () => {
  const payload = buildShareableSummary(sampleArtifact);
  const url = buildShareUrl("https://demo.example", "/", payload);

  assert.match(url, /^https:\/\/demo\.example\/#/);
  assert.equal(decodeShareHash(url.split("#")[1])?.summary, payload.summary);
});

test("decodeShareHash rejects malformed payloads", () => {
  assert.equal(decodeShareHash("#share=not-base64"), null);
  assert.equal(decodeShareHash("#other=abc"), null);
  assert.equal(decodeShareHash(""), null);
});
