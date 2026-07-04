import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

import {
  createObservabilityConfig,
  shouldTrackInCurrentMode,
  createMonitoringHooks,
  sanitizeAnalyticsEvent,
} from "../src/lib/observability.mjs";

const DOCUMENTED_CLIENT_METADATA_KEYS = [
  "source",
  "providerState",
  "fileType",
  "fileSize",
  "route",
  "status",
  "durationMs",
  "step",
  "result",
  "trigger",
  "feature",
  "domain",
  "level",
  "entryId",
  "sampleId",
  "queryLength",
  "totalVisible",
];

test("observability defaults to disabled and privacy-safe", () => {
  const config = createObservabilityConfig({});

  assert.equal(config.enabled, false);
  assert.equal(config.analyticsEnabled, false);
  assert.equal(config.errorMonitoringEnabled, false);
  assert.equal(config.allowInLocalAnalysisMode, false);
  assert.equal(config.allowInDemoMode, false);
});

test("observability can be enabled explicitly with env flags", () => {
  const config = createObservabilityConfig({
    NEXT_PUBLIC_OBSERVABILITY_ENABLED: "true",
    NEXT_PUBLIC_ANALYTICS_ENABLED: "true",
    NEXT_PUBLIC_ERROR_MONITORING_ENABLED: "true",
    NEXT_PUBLIC_OBSERVABILITY_ALLOW_LOCAL_ANALYSIS: "1",
  });

  assert.equal(config.enabled, true);
  assert.equal(config.analyticsEnabled, true);
  assert.equal(config.errorMonitoringEnabled, true);
  assert.equal(config.allowInLocalAnalysisMode, true);
  assert.equal(config.allowInDemoMode, true);
});

test("observability keeps legacy demo-mode env alias compatible", () => {
  const config = createObservabilityConfig({
    NEXT_PUBLIC_OBSERVABILITY_ENABLED: "true",
    NEXT_PUBLIC_OBSERVABILITY_ALLOW_DEMO_MODE: "true",
  });

  assert.equal(config.allowInLocalAnalysisMode, true);
  assert.equal(config.allowInDemoMode, true);
});

test("tracking is blocked in local sample mode unless explicitly allowed", () => {
  const defaultConfig = createObservabilityConfig({
    NEXT_PUBLIC_OBSERVABILITY_ENABLED: "true",
  });
  assert.equal(shouldTrackInCurrentMode("demo", defaultConfig), false);
  assert.equal(shouldTrackInCurrentMode("live", defaultConfig), true);

  const demoAllowed = createObservabilityConfig({
    NEXT_PUBLIC_OBSERVABILITY_ENABLED: "true",
    NEXT_PUBLIC_OBSERVABILITY_ALLOW_LOCAL_ANALYSIS: "true",
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
    feature: "starter_component",
    trigger: "copy",
    domain: "product",
    level: "molecule",
    sampleId: "dashboard",
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
      feature: "starter_component",
      trigger: "copy",
      domain: "product",
      level: "molecule",
      sampleId: "dashboard",
      queryLength: 4,
      totalVisible: 18,
    },
  });
});

test("analytics sanitizer preserves documented client metadata keys", () => {
  const metadataValues = {
    source: "upload_flow",
    providerState: "local-analysis",
    fileType: "image/png",
    fileSize: 2048,
    route: "/demo?secret=hidden",
    status: "completed",
    durationMs: 1200,
    step: "generate",
    result: "success",
    trigger: "sample_picker",
    feature: "sample_run",
    domain: "product",
    level: "molecule",
    entryId: "shadcn-button",
    sampleId: "dashboard",
    queryLength: 4,
    totalVisible: 18,
  };
  const metadata = Object.fromEntries(
    DOCUMENTED_CLIENT_METADATA_KEYS.map((key) => [key, metadataValues[key]]),
  );

  assert.deepEqual(sanitizeAnalyticsEvent("analysis.completed", metadata), {
    eventName: "analysis.completed",
    metadata: {
      ...metadata,
      route: "/demo",
    },
  });
});

test("analytics taxonomy documents the sanitizer metadata allowlist", async () => {
  const source = await fs.readFile(
    path.join(process.cwd(), "docs/ops/ANALYTICS_TAXONOMY.md"),
    "utf8",
  );
  const section = source.match(
    /## Allowlisted Metadata Keys\s+Only these keys are accepted:\s+([\s\S]*?)\n## /,
  );

  assert.ok(section, "Expected analytics taxonomy to document allowlisted metadata keys.");

  const documentedKeys = [...section[1].matchAll(/- `([^`]+)`/g)].map(
    (match) => match[1],
  );

  assert.deepEqual(documentedKeys, DOCUMENTED_CLIENT_METADATA_KEYS);
});

test("analytics route metadata strips query strings", () => {
  const sanitized = sanitizeAnalyticsEvent("design_system.viewed", {
    route: "/design-system?domain=product&email=hidden@example.com",
    source: "design_system_page",
  });

  assert.deepEqual(sanitized, {
    eventName: "design_system.viewed",
    metadata: {
      route: "/design-system",
      source: "design_system_page",
    },
  });
});
