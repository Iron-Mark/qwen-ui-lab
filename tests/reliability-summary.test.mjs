import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReliabilitySummary,
  parseShareSmokeSummary,
  parseSyntheticSummary,
  sanitizeSummaryText,
} from "../scripts/build-reliability-summary.mjs";

test("parseSyntheticSummary extracts the health summary block", () => {
  const parsed = parseSyntheticSummary(`
Synthetic check target: https://qwen-ui-lab.vercel.app/api/health
[attempt 1] PASS status=200 latency=640ms provider=demo liveAnalysisEnabled=false

Summary:
- attempts: 5
- success_rate: 100%
- avg_latency_ms: 759
- p95_latency_ms: 1192
- expected_liveAnalysisEnabled: false
- live_mode_mismatches: 0

PASS: Synthetic health check completed within thresholds.
`);

  assert.equal(parsed.status, "pass");
  assert.equal(parsed.summary.attempts, "5");
  assert.equal(parsed.summary.success_rate, "100%");
  assert.equal(parsed.summary.p95_latency_ms, "1192");
  assert.equal(parsed.summary.live_mode_mismatches, "0");
});

test("parseShareSmokeSummary reports smoke sections and pass counts", () => {
  const parsed = parseShareSmokeSummary(`
Running share/export browser smoke against https://qwen-ui-lab.vercel.app

> portable hash share route
  1 passed (4.2s)

> upload/export/copy share flow
  1 passed (5.1s)

PASS: Share/export browser smoke completed.
`);

  assert.equal(parsed.status, "pass");
  assert.deepEqual(parsed.sections, [
    "portable hash share route",
    "upload/export/copy share flow",
  ]);
  assert.equal(parsed.passedCount, 2);
});

test("buildReliabilitySummary keeps issue content compact and sanitized", () => {
  const summary = buildReliabilitySummary({
    target: "https://qwen-ui-lab.vercel.app/share/local#share=privatePayload",
    expectedLive: "false",
    healthOutcome: "failure",
    shareOutcome: "success",
    runUrl: "https://github.com/owner/repo/actions/runs/123",
    commit: "abcdef",
    healthLog: `
Synthetic check target: C:\\Users\\person\\repo\\api\\health

Summary:
- attempts: 5
- success_rate: 80%
- avg_latency_ms: 910
- p95_latency_ms: 2100
- live_mode_mismatches: 1

CRITICAL: One or more health probes failed.
`,
    shareLog: `
> portable hash share route
  1 passed (4.2s)

PASS: Share/export browser smoke completed.
`,
  });

  assert.match(summary, /Synthetic health/);
  assert.match(summary, /success 80%, p95 2100ms, avg 910ms, live mismatches 1/);
  assert.match(summary, /#share=<redacted>/);
  assert.doesNotMatch(summary, /privatePayload/);
  assert.doesNotMatch(summary, /C:\\Users/);
});

test("sanitizeSummaryText removes local paths and share payloads", () => {
  const sanitized = sanitizeSummaryText(
    "open C:\\Users\\person\\repo\\file.txt and /home/person/repo/file.txt#share=abc123",
  );

  assert.doesNotMatch(sanitized, /C:\\Users/);
  assert.doesNotMatch(sanitized, /\/home\/person/);
  assert.match(sanitized, /#share=<redacted>/);
});
