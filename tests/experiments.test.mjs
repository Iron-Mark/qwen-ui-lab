import test from "node:test";
import assert from "node:assert/strict";

import {
  createExperimentConfig,
  resolveExperimentVariant,
  listExperimentKeys,
} from "../src/lib/experiments.mjs";

test("experiments are disabled by default", () => {
  const config = createExperimentConfig({});
  assert.equal(config.enabled, false);
  assert.equal(config.experiments.headerDesignSystemCta.enabled, false);
  assert.equal(config.experiments.uploadFlowHeadline.enabled, false);
  assert.equal(config.experiments.uploadFlowAnalyzeCta.enabled, false);
  assert.equal(config.experiments.uploadFlowSamplePathHint.enabled, false);
  assert.equal(
    resolveExperimentVariant("headerDesignSystemCta", "subject-a", config),
    "control",
  );
  assert.equal(
    resolveExperimentVariant("uploadFlowHeadline", "subject-a", config),
    "control",
  );
});

test("experiment can be enabled explicitly with env flags", () => {
  const config = createExperimentConfig({
    NEXT_PUBLIC_EXPERIMENTS_ENABLED: "true",
    NEXT_PUBLIC_EXP_HEADER_DESIGN_SYSTEM_CTA: "true",
    NEXT_PUBLIC_EXP_UPLOAD_FLOW_HEADLINE: "true",
    NEXT_PUBLIC_EXP_UPLOAD_FLOW_ANALYZE_CTA: "true",
    NEXT_PUBLIC_EXP_UPLOAD_FLOW_SAMPLE_PATH_HINT: "true",
  });

  assert.equal(config.enabled, true);
  assert.equal(config.experiments.headerDesignSystemCta.enabled, true);
  assert.equal(config.experiments.headerDesignSystemCta.variants.length, 2);
  assert.equal(config.experiments.uploadFlowHeadline.enabled, true);
  assert.equal(config.experiments.uploadFlowAnalyzeCta.enabled, true);
  assert.equal(config.experiments.uploadFlowSamplePathHint.enabled, true);
});

test("variant assignment is deterministic for subject key", () => {
  const config = createExperimentConfig({
    NEXT_PUBLIC_EXPERIMENTS_ENABLED: "true",
    NEXT_PUBLIC_EXP_HEADER_DESIGN_SYSTEM_CTA: "true",
    NEXT_PUBLIC_EXP_UPLOAD_FLOW_HEADLINE: "true",
  });

  const first = resolveExperimentVariant("headerDesignSystemCta", "stable-subject", config);
  const second = resolveExperimentVariant("headerDesignSystemCta", "stable-subject", config);

  assert.equal(first, second);
  assert.ok(["control", "with-labs-badge"].includes(first));
  const firstHeadline = resolveExperimentVariant("uploadFlowHeadline", "stable-subject", config);
  const secondHeadline = resolveExperimentVariant("uploadFlowHeadline", "stable-subject", config);
  assert.equal(firstHeadline, secondHeadline);
  assert.ok(["control", "faster-first-value"].includes(firstHeadline));
});

test("experiment keys are discoverable for diagnostics", () => {
  const keys = listExperimentKeys();
  assert.ok(keys.includes("headerDesignSystemCta"));
  assert.ok(keys.includes("uploadFlowHeadline"));
  assert.ok(keys.includes("uploadFlowAnalyzeCta"));
  assert.ok(keys.includes("uploadFlowSamplePathHint"));
});
