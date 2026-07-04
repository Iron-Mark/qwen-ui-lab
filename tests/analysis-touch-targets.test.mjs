import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const workflowStepperSource = readFileSync(
  join("src", "features", "analysis", "components", "WorkflowStepper.tsx"),
  "utf8",
);
const uiLawsComplianceSource = readFileSync(
  join("src", "features", "analysis", "components", "UiLawsCompliance.tsx"),
  "utf8",
);

test("workflow stepper keeps step indicators touch-safe", () => {
  assert.match(workflowStepperSource, /\bmin-h-11\b/);
  assert.doesNotMatch(workflowStepperSource, /\bmin-h-8\b/);
  assert.doesNotMatch(workflowStepperSource, /\bsm:h-7\b/);
});

test("UX compliance actions keep touch-safe targets", () => {
  assert.doesNotMatch(uiLawsComplianceSource, /\bmin-h-9\b/);
  const touchSafeLinks = uiLawsComplianceSource.match(/\bmin-h-11\b/g) ?? [];
  assert.ok(touchSafeLinks.length >= 4);
});
