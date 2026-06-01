import test from "node:test";
import assert from "node:assert/strict";

import { buildUiFlowArtifact } from "../src/lib/ui-flow.mjs";
import {
  evaluateUxCompliance,
  complianceSummary,
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
