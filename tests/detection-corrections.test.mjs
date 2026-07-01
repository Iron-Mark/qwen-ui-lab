import assert from "node:assert/strict";
import test from "node:test";
import {
  correctedDetectionConfidence,
  describeManualDetectionChanges,
  mergeManualCorrectionReasons,
  summarizeCorrectedElementChanges,
} from "../src/features/analysis/lib/detection-corrections.mjs";

test("correctedDetectionConfidence raises included edits and lowers exclusions", () => {
  assert.equal(correctedDetectionConfidence(0.6, true), 0.72);
  assert.equal(correctedDetectionConfidence(0.9, true), 0.97);
  assert.equal(correctedDetectionConfidence(0.8, false), 0.38);
  assert.equal(correctedDetectionConfidence(undefined, true), 0.72);
});

test("describeManualDetectionChanges names edited detection dimensions", () => {
  const element = {
    kind: "card-or-panel",
    primitive: "card",
    componentRole: "card",
    included: true,
    box: { x: 10, y: 20, width: 100, height: 80 },
  };

  assert.deepEqual(
    describeManualDetectionChanges(element, {
      kind: "button-or-input",
      primitive: "field-or-action",
      componentRole: "primary-action",
      included: false,
      box: { x: 12, y: 20, width: 120, height: 80 },
    }),
    ["type", "primitive", "role", "inclusion", "geometry"],
  );
});

test("mergeManualCorrectionReasons replaces stale correction reasons", () => {
  const reasons = mergeManualCorrectionReasons({
    reasons: [
      { code: "manual-correction", label: "Old", evidence: "old", weight: 1 },
      { code: "geometry", label: "Geometry", evidence: "wide", weight: 0.6 },
    ],
    included: false,
    confidence: 0.38,
    changes: ["type", "geometry"],
    source: "regeneration",
  });

  assert.equal(reasons.filter((reason) => reason.code === "manual-correction").length, 1);
  assert.equal(reasons[0].code, "manual-correction");
  assert.match(reasons[0].evidence, /Edited type, geometry/);
  assert.match(reasons[0].evidence, /source of truth for regeneration/);
  assert.equal(reasons[1].code, "manual-exclusion");
  assert.equal(reasons.at(-1).code, "geometry");
});

test("summarizeCorrectedElementChanges derives regeneration dimensions", () => {
  assert.deepEqual(
    summarizeCorrectedElementChanges({
      kind: "button-or-input",
      primitive: "field-or-action",
      componentRole: "primary-action",
      included: false,
      box: { x: 0, y: 0, width: 10, height: 10 },
    }),
    ["type", "primitive", "role", "geometry", "inclusion"],
  );
});
