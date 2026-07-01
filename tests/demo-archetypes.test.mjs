import test from "node:test";
import assert from "node:assert/strict";

import {
  SAMPLE_REFERENCE_QUERY_VALUES,
  sampleReferenceLabel,
  resolveSampleReferenceId,
} from "../src/features/demo/lib/demo-archetypes.mjs";
import {
  getReferenceSampleById,
  referenceSampleExportFilename,
} from "../src/features/analysis/lib/reference-samples.mjs";

test("resolveSampleReferenceId maps shop to ecommerce sample", () => {
  assert.equal(resolveSampleReferenceId("shop"), "ecommerce");
  assert.equal(resolveSampleReferenceId(null), "dashboard");
  assert.equal(resolveSampleReferenceId("AUTH"), "auth");
  assert.equal(resolveSampleReferenceId("unknown"), "dashboard");
});

test("referenceSampleExportFilename uses readable slug", () => {
  assert.equal(referenceSampleExportFilename("dashboard"), "generated-dashboard.tsx");
  assert.equal(referenceSampleExportFilename("ecommerce"), "generated-shop.tsx");
  assert.equal(referenceSampleExportFilename("auth"), "generated-auth.tsx");
});

test("sample reference labels match bundled reference metadata", () => {
  const sample = getReferenceSampleById("mobile");
  assert.equal(sample.id, "mobile");
  assert.equal(sample.fileName, "mobile-reference.png");
  assert.ok(sampleReferenceLabel("landing").toLowerCase().includes("landing"));
});

test("SAMPLE_REFERENCE_QUERY_VALUES lists public query keys", () => {
  assert.deepEqual(SAMPLE_REFERENCE_QUERY_VALUES, [
    "dashboard",
    "auth",
    "mobile",
    "landing",
    "settings",
    "shop",
  ]);
});
