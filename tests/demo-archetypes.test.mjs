import test from "node:test";
import assert from "node:assert/strict";

import {
  DEMO_ARCHETYPE_QUERY_VALUES,
  demoArchetypeExportFilename,
  demoArchetypeLabel,
  getDemoArchetypeSample,
  resolveDemoArchetype,
} from "../src/features/analysis/lib/demo-archetypes.mjs";

test("resolveDemoArchetype maps shop to ecommerce sample", () => {
  assert.equal(resolveDemoArchetype("shop"), "ecommerce");
  assert.equal(resolveDemoArchetype(null), "dashboard");
  assert.equal(resolveDemoArchetype("AUTH"), "auth");
  assert.equal(resolveDemoArchetype("unknown"), "dashboard");
});

test("demoArchetypeExportFilename uses readable slug", () => {
  assert.equal(demoArchetypeExportFilename("dashboard"), "generated-dashboard.tsx");
  assert.equal(demoArchetypeExportFilename("ecommerce"), "generated-shop.tsx");
  assert.equal(demoArchetypeExportFilename("auth"), "generated-auth.tsx");
});

test("getDemoArchetypeSample returns bundled reference metadata", () => {
  const sample = getDemoArchetypeSample("mobile");
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
