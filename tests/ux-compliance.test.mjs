import test from "node:test";
import assert from "node:assert/strict";

import { buildUiFlowArtifact } from "../src/lib/ui-flow.mjs";
import {
  evaluateUxCompliance,
  complianceSummary,
  inferArchetypeIdFromArtifact,
  getArchetypeHighlightLaws,
  lawOfUxCatalogHref,
} from "../src/lib/ux-compliance.mjs";
test("evaluateUxCompliance scores demo artifact", () => {
  const artifact = buildUiFlowArtifact({
    name: "dashboard-reference.png",
    type: "image/png",
    size: 1024,
  });
  const checks = evaluateUxCompliance(artifact);
  assert.ok(checks.length >= 10);
  const fitts = checks.find((c) => c.id === "fitts");
  assert.ok(fitts);
  assert.equal(fitts.name, "Fitts's Law");
  assert.ok(["met", "partial", "review"].includes(fitts.status));

  for (const id of [
    "aesthetic-usability",
    "hick",
    "jakob",
    "miller",
    "peak-end",
    "von-restorff",
  ]) {
    assert.ok(checks.some((c) => c.id === id), `missing check ${id}`);
  }

  const summary = complianceSummary(checks);
  assert.equal(summary.total, checks.length);
  assert.ok(summary.met >= 1);
});

test("inferArchetypeIdFromArtifact classifies auth references", () => {
  const artifact = buildUiFlowArtifact({
    name: "auth-reference.svg",
    type: "image/svg+xml",
    size: 4096,
  });
  assert.equal(inferArchetypeIdFromArtifact(artifact), "auth");
  const highlights = getArchetypeHighlightLaws("auth");
  assert.ok(highlights.includes("fitts"));
  assert.equal(lawOfUxCatalogHref("fitts"), "/design-system?domain=laws-of-ux&selected=law-of-ux-fitts");
});
