import assert from "node:assert/strict";
import test from "node:test";
import { handleAnalyzeUiPost } from "../src/features/analysis/lib/analyze-ui-api.mjs";
import { MAX_ANALYZE_REQUEST_BYTES } from "../src/features/analysis/lib/analyze-request-validation.mjs";
import { resetAnalyzeUiRateLimitStore } from "../src/features/analysis/lib/analyze-ui-rate-limit.mjs";

const ORIGINAL_ENV = {
  DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY,
  QWEN_LIVE_ANALYSIS: process.env.QWEN_LIVE_ANALYSIS,
  ANALYZE_UI_RATE_LIMIT_MAX: process.env.ANALYZE_UI_RATE_LIMIT_MAX,
};

test.afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  resetAnalyzeUiRateLimitStore();
});

function postAnalyzeRequest(body, headers = {}) {
  return new Request("https://example.test/api/analyze-ui", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body,
  });
}

test("handleAnalyzeUiPost rejects oversized content length before parsing JSON", async () => {
  const response = await handleAnalyzeUiPost(
    postAnalyzeRequest("{", {
      "content-length": String(MAX_ANALYZE_REQUEST_BYTES + 1),
    }),
  );

  assert.equal(response.status, 413);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.code, "request_too_large");
});

test("handleAnalyzeUiPost returns a stable invalid JSON response", async () => {
  const response = await handleAnalyzeUiPost(postAnalyzeRequest("{"));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    ok: false,
    code: "invalid_json",
    message: "Request body must be JSON.",
  });
});

test("handleAnalyzeUiPost rate-limit copy stays user-facing", async () => {
  process.env.DASHSCOPE_API_KEY = "test-key";
  process.env.QWEN_LIVE_ANALYSIS = "true";
  process.env.ANALYZE_UI_RATE_LIMIT_MAX = "1";

  const headers = { "x-forwarded-for": "203.0.113.20" };

  const first = await handleAnalyzeUiPost(postAnalyzeRequest("{", headers));
  assert.equal(first.status, 400);

  const second = await handleAnalyzeUiPost(postAnalyzeRequest("{", headers));
  assert.equal(second.status, 429);
  const payload = await second.json();
  assert.equal(payload.code, "rate_limit_exceeded");
  assert.match(payload.message, /Too many screenshot analyses/);
  assert.doesNotMatch(payload.message, /live analysis|provider|api key/i);
});
