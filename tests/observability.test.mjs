import test from "node:test";
import assert from "node:assert/strict";

import {
  createObservabilityConfig,
  shouldTrackInCurrentMode,
  createMonitoringHooks,
  sanitizeAnalyticsEvent,
} from "../src/lib/observability.mjs";

test("observability defaults to disabled and privacy-safe", () => {
  const config = createObservabilityConfig({});

  assert.equal(config.enabled, false);
  assert.equal(config.analyticsEnabled, false);
  assert.equal(config.errorMonitoringEnabled, false);
  assert.equal(config.allowInDemoMode, false);
});

test("observability can be enabled explicitly with env flags", () => {
  const config = createObservabilityConfig({
    NEXT_PUBLIC_OBSERVABILITY_ENABLED: "true",
    NEXT_PUBLIC_ANALYTICS_ENABLED: "true",
    NEXT_PUBLIC_ERROR_MONITORING_ENABLED: "true",
    NEXT_PUBLIC_OBSERVABILITY_ALLOW_DEMO_MODE: "1",
  });

  assert.equal(config.enabled, true);
  assert.equal(config.analyticsEnabled, true);
  assert.equal(config.errorMonitoringEnabled, true);
  assert.equal(config.allowInDemoMode, true);
});

test("tracking is blocked in demo mode unless explicitly allowed", () => {
  const defaultConfig = createObservabilityConfig({
    NEXT_PUBLIC_OBSERVABILITY_ENABLED: "true",
  });
  assert.equal(shouldTrackInCurrentMode("demo", defaultConfig), false);
  assert.equal(shouldTrackInCurrentMode("live", defaultConfig), true);

  const demoAllowed = createObservabilityConfig({
    NEXT_PUBLIC_OBSERVABILITY_ENABLED: "true",
    NEXT_PUBLIC_OBSERVABILITY_ALLOW_DEMO_MODE: "true",
  });
  assert.equal(shouldTrackInCurrentMode("demo", demoAllowed), true);
});

test("monitoring hooks are no-op when disabled", () => {
  let errorCalls = 0;
  let eventCalls = 0;
  const hooks = createMonitoringHooks({
    config: createObservabilityConfig({}),
    dispatchError: () => {
      errorCalls += 1;
    },
    dispatchEvent: () => {
      eventCalls += 1;
    },
  });

  hooks.captureError(new Error("Sensitive details"));
  hooks.trackEvent("upload.analyze_clicked", {
    email: "hidden@example.com",
    prompt: "secret",
  });

  assert.equal(errorCalls, 0);
  assert.equal(eventCalls, 0);
});

test("analytics payload is sanitized to allowlisted metadata", () => {
  const sanitized = sanitizeAnalyticsEvent("upload.completed", {
    fileType: "image/png",
    fileSize: 1024,
    source: "dropzone",
    feature: "generated_scaffold",
    trigger: "copy",
    domain: "product",
    level: "molecule",
    queryLength: 4,
    totalVisible: 18,
    email: "hidden@example.com",
    notes: "contains sensitive info",
  });

  assert.deepEqual(sanitized, {
    eventName: "upload.completed",
    metadata: {
      fileType: "image/png",
      fileSize: 1024,
      source: "dropzone",
      feature: "generated_scaffold",
      trigger: "copy",
      domain: "product",
      level: "molecule",
      queryLength: 4,
      totalVisible: 18,
    },
  });
});
