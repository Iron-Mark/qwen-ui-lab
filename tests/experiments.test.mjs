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
  assert.equal(
    resolveExperimentVariant("headerDesignSystemCta", "subject-a", config),
    "control",
  );
});

test("experiment can be enabled explicitly with env flags", () => {
  const config = createExperimentConfig({
    NEXT_PUBLIC_EXPERIMENTS_ENABLED: "true",
    NEXT_PUBLIC_EXP_HEADER_DESIGN_SYSTEM_CTA: "true",
  });

  assert.equal(config.enabled, true);
  assert.equal(config.experiments.headerDesignSystemCta.enabled, true);
  assert.equal(config.experiments.headerDesignSystemCta.variants.length, 2);
});

test("variant assignment is deterministic for subject key", () => {
  const config = createExperimentConfig({
    NEXT_PUBLIC_EXPERIMENTS_ENABLED: "true",
    NEXT_PUBLIC_EXP_HEADER_DESIGN_SYSTEM_CTA: "true",
  });

  const first = resolveExperimentVariant("headerDesignSystemCta", "stable-subject", config);
  const second = resolveExperimentVariant("headerDesignSystemCta", "stable-subject", config);

  assert.equal(first, second);
  assert.ok(["control", "with-labs-badge"].includes(first));
});

test("experiment keys are discoverable for diagnostics", () => {
  const keys = listExperimentKeys();
  assert.ok(keys.includes("headerDesignSystemCta"));
});
