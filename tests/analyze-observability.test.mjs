import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAnalyzeFailureError,
  isReportableAnalyzeFailure,
} from "../src/features/analysis/lib/analyze-observability.mjs";

test("expected demo analyze paths are not reported", () => {
  assert.equal(
    isReportableAnalyzeFailure({
      providerState: "fallback",
      instantDemo: true,
      code: "live_analysis_disabled",
    }),
    false,
  );
  assert.equal(
    isReportableAnalyzeFailure({
      providerState: "fallback",
      code: "missing_qwen_api_key",
    }),
    false,
  );
  assert.equal(
    isReportableAnalyzeFailure({ providerState: "qwen", code: null }),
    false,
  );
});

test("live analyze failures are reportable", () => {
  assert.equal(
    isReportableAnalyzeFailure({
      providerState: "fallback",
      code: "qwen_network_error",
    }),
    true,
  );
});

test("buildAnalyzeFailureError is privacy-safe", () => {
  const error = buildAnalyzeFailureError({ code: "invalid_qwen_json" });
  assert.equal(error.name, "AnalyzeRouteError");
  assert.match(error.message, /invalid_qwen_json/);
});
