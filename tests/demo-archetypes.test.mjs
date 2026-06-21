import test from "node:test";
import assert from "node:assert/strict";

import {
  DEMO_ARCHETYPE_QUERY_VALUES,
  demoArchetypeLabel,
  resolveDemoArchetype,
} from "../src/features/demo/lib/demo-archetypes.mjs";
import {
  getReferenceSampleById,
  referenceSampleExportFilename,
} from "../src/features/analysis/lib/reference-samples.mjs";

test("resolveDemoArchetype maps shop to ecommerce sample", () => {
  assert.equal(resolveDemoArchetype("shop"), "ecommerce");
  assert.equal(resolveDemoArchetype(null), "dashboard");
  assert.equal(resolveDemoArchetype("AUTH"), "auth");
  assert.equal(resolveDemoArchetype("unknown"), "dashboard");
});

test("referenceSampleExportFilename uses readable slug", () => {
  assert.equal(referenceSampleExportFilename("dashboard"), "generated-dashboard.tsx");
  assert.equal(referenceSampleExportFilename("ecommerce"), "generated-shop.tsx");
  assert.equal(referenceSampleExportFilename("auth"), "generated-auth.tsx");
});

test("demo archetype labels match bundled reference metadata", () => {
  const sample = getReferenceSampleById("mobile");
  assert.equal(sample.id, "mobile");
  assert.equal(sample.fileName, "mobile-reference.png");
  assert.ok(demoArchetypeLabel("landing").toLowerCase().includes("landing"));
});

test("DEMO_ARCHETYPE_QUERY_VALUES lists public query keys", () => {
  assert.deepEqual(DEMO_ARCHETYPE_QUERY_VALUES, [
    "dashboard",
    "auth",
    "mobile",
    "landing",
    "settings",
    "shop",
  ]);
});
