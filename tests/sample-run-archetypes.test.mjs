import test from "node:test";
import assert from "node:assert/strict";

import {
  SAMPLE_RUN_QUERY_VALUES,
  sampleRunLabel,
  resolveSampleRunId,
} from "../src/features/demo/lib/sample-run-archetypes.mjs";
import {
  getSampleRunById,
  sampleRunExportFilename,
} from "../src/features/analysis/lib/reference-samples.mjs";

test("resolveSampleRunId maps shop to ecommerce sample", () => {
  assert.equal(resolveSampleRunId("shop"), "ecommerce");
  assert.equal(resolveSampleRunId(null), "dashboard");
  assert.equal(resolveSampleRunId("AUTH"), "auth");
  assert.equal(resolveSampleRunId("unknown"), "dashboard");
});

test("sampleRunExportFilename uses readable slug", () => {
  assert.equal(sampleRunExportFilename("dashboard"), "starter-dashboard.tsx");
  assert.equal(sampleRunExportFilename("ecommerce"), "starter-shop.tsx");
  assert.equal(sampleRunExportFilename("auth"), "starter-auth.tsx");
});

test("sample run labels match sample metadata", () => {
  const sample = getSampleRunById("mobile");
  assert.equal(sample.id, "mobile");
  assert.equal(sample.fileName, "mobile-reference.png");
  assert.ok(sampleRunLabel("landing").toLowerCase().includes("landing"));
});

test("SAMPLE_RUN_QUERY_VALUES lists public query keys", () => {
  assert.deepEqual(SAMPLE_RUN_QUERY_VALUES, [
    "dashboard",
    "auth",
    "mobile",
    "landing",
    "settings",
    "shop",
  ]);
});
