import test from "node:test";
import assert from "node:assert/strict";

import {
  checkAnalyzeUiRateLimit,
  getAnalyzeUiRateLimitConfig,
  getRequestClientIp,
  resetAnalyzeUiRateLimitStore,
} from "../src/lib/analyze-ui-rate-limit.mjs";

test.afterEach(() => {
  resetAnalyzeUiRateLimitStore();
});

test("getAnalyzeUiRateLimitConfig uses defaults", () => {
  const config = getAnalyzeUiRateLimitConfig({});
  assert.equal(config.maxRequests, 12);
  assert.equal(config.windowMs, 60_000);
});

test("getAnalyzeUiRateLimitConfig reads env overrides", () => {
  const config = getAnalyzeUiRateLimitConfig({
    ANALYZE_UI_RATE_LIMIT_MAX: "3",
    ANALYZE_UI_RATE_LIMIT_WINDOW_MS: "5000",
  });
  assert.equal(config.maxRequests, 3);
  assert.equal(config.windowMs, 5000);
});

test("checkAnalyzeUiRateLimit blocks after max requests in window", () => {
  const env = {
    ANALYZE_UI_RATE_LIMIT_MAX: "2",
    ANALYZE_UI_RATE_LIMIT_WINDOW_MS: "60000",
  };
  const now = 1_700_000_000_000;

  assert.equal(
    checkAnalyzeUiRateLimit({ clientKey: "1.2.3.4", now, env }).allowed,
    true,
  );
  assert.equal(
    checkAnalyzeUiRateLimit({ clientKey: "1.2.3.4", now, env }).allowed,
    true,
  );
  const blocked = checkAnalyzeUiRateLimit({
    clientKey: "1.2.3.4",
    now,
    env,
  });
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSec >= 1);
  assert.equal(blocked.limit, 2);
});

test("checkAnalyzeUiRateLimit isolates client keys", () => {
  const env = { ANALYZE_UI_RATE_LIMIT_MAX: "1" };
  const now = Date.now();

  assert.equal(
    checkAnalyzeUiRateLimit({ clientKey: "a", now, env }).allowed,
    true,
  );
  assert.equal(
    checkAnalyzeUiRateLimit({ clientKey: "b", now, env }).allowed,
    true,
  );
  assert.equal(
    checkAnalyzeUiRateLimit({ clientKey: "a", now, env }).allowed,
    false,
  );
});

test("getRequestClientIp prefers x-forwarded-for first hop", () => {
  const request = new Request("https://example.com/api/analyze-ui", {
    headers: {
      "x-forwarded-for": "203.0.113.1, 10.0.0.1",
      "x-real-ip": "198.51.100.2",
    },
  });
  assert.equal(getRequestClientIp(request), "203.0.113.1");
});

test("getRequestClientIp falls back to x-real-ip", () => {
  const request = new Request("https://example.com/api/analyze-ui", {
    headers: { "x-real-ip": "198.51.100.2" },
  });
  assert.equal(getRequestClientIp(request), "198.51.100.2");
});
