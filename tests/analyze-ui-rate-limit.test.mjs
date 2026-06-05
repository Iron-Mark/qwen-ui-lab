import test from "node:test";
import assert from "node:assert/strict";

import {
  applyFixedWindowLimit,
  createKvRateLimitStore,
  createMemoryRateLimitStore,
  isRateLimitKvConfigured,
  resolveAnalyzeUiRateLimitStore,
} from "../src/lib/analyze-ui-rate-limit-store.mjs";
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

test("applyFixedWindowLimit blocks after max requests in window", () => {
  const env = { maxRequests: 2, windowMs: 60_000 };
  const now = 1_700_000_000_000;

  const first = applyFixedWindowLimit(null, { ...env, now });
  assert.equal(first.allowed, true);
  assert.equal(first.entry.count, 1);

  const second = applyFixedWindowLimit(first.entry, { ...env, now });
  assert.equal(second.allowed, true);
  assert.equal(second.entry.count, 2);

  const blocked = applyFixedWindowLimit(second.entry, { ...env, now });
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSec >= 1);
  assert.equal(blocked.limit, 2);
});

test("applyFixedWindowLimit resets bucket after window expires", () => {
  const now = 1_700_000_000_000;
  const windowMs = 10_000;
  const first = applyFixedWindowLimit(null, {
    maxRequests: 1,
    windowMs,
    now,
  });
  assert.equal(first.allowed, true);

  const blocked = applyFixedWindowLimit(first.entry, {
    maxRequests: 1,
    windowMs,
    now,
  });
  assert.equal(blocked.allowed, false);

  const afterWindow = applyFixedWindowLimit(first.entry, {
    maxRequests: 1,
    windowMs,
    now: now + windowMs,
  });
  assert.equal(afterWindow.allowed, true);
  assert.equal(afterWindow.entry.count, 1);
});

test("memory store isolates client keys", async () => {
  const store = createMemoryRateLimitStore();
  const env = { ANALYZE_UI_RATE_LIMIT_MAX: "1" };
  const now = Date.now();

  assert.equal(
    (await checkAnalyzeUiRateLimit({ clientKey: "a", now, env, store }))
      .allowed,
    true,
  );
  assert.equal(
    (await checkAnalyzeUiRateLimit({ clientKey: "b", now, env, store }))
      .allowed,
    true,
  );
  assert.equal(
    (await checkAnalyzeUiRateLimit({ clientKey: "a", now, env, store }))
      .allowed,
    false,
  );
});

test("checkAnalyzeUiRateLimit blocks after max requests in window", async () => {
  const store = createMemoryRateLimitStore();
  const env = {
    ANALYZE_UI_RATE_LIMIT_MAX: "2",
    ANALYZE_UI_RATE_LIMIT_WINDOW_MS: "60000",
  };
  const now = 1_700_000_000_000;

  assert.equal(
    (await checkAnalyzeUiRateLimit({ clientKey: "1.2.3.4", now, env, store }))
      .allowed,
    true,
  );
  assert.equal(
    (await checkAnalyzeUiRateLimit({ clientKey: "1.2.3.4", now, env, store }))
      .allowed,
    true,
  );
  const blocked = await checkAnalyzeUiRateLimit({
    clientKey: "1.2.3.4",
    now,
    env,
    store,
  });
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSec >= 1);
  assert.equal(blocked.limit, 2);
});

test("isRateLimitKvConfigured is false when KV env unset", () => {
  assert.equal(isRateLimitKvConfigured({}), false);
  assert.equal(
    isRateLimitKvConfigured({ KV_REST_API_URL: "https://kv.example" }),
    false,
  );
});

test("isRateLimitKvConfigured is true when KV REST env is complete", () => {
  assert.equal(
    isRateLimitKvConfigured({
      KV_REST_API_URL: "https://kv.example",
      KV_REST_API_TOKEN: "token",
    }),
    true,
  );
});

test("resolveAnalyzeUiRateLimitStore falls back to memory when KV unset", () => {
  const store = resolveAnalyzeUiRateLimitStore({});
  assert.equal(typeof store.consume, "function");
  assert.equal(typeof store.reset, "function");
});

test("resolveAnalyzeUiRateLimitStore uses KV when REST env is set", () => {
  const store = resolveAnalyzeUiRateLimitStore({
    KV_REST_API_URL: "https://kv.example",
    KV_REST_API_TOKEN: "token",
  });
  assert.equal(typeof store.consume, "function");
  assert.equal(store.reset, undefined);
});

test("kv store consumes through Upstash REST and falls back on write failure", async () => {
  /** @type {Map<string, string>} */
  const remote = new Map();
  const fetchFn = async (url, init) => {
    const method = init?.method ?? "GET";
    const key = decodeURIComponent(url.split("/").pop() ?? "");

    if (method === "GET") {
      return Response.json({ result: remote.get(key) ?? null });
    }

    const body = JSON.parse(String(init?.body));
    remote.set(key, body.value);
    return Response.json({ result: "OK" });
  };

  const kvStore = createKvRateLimitStore(
    {
      KV_REST_API_URL: "https://kv.example",
      KV_REST_API_TOKEN: "token",
    },
    fetchFn,
  );

  const allowed = await kvStore.consume({
    key: "203.0.113.1",
    maxRequests: 2,
    windowMs: 60_000,
    now: 1_700_000_000_000,
  });
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.remaining, 1);

  const blocked = await kvStore.consume({
    key: "203.0.113.1",
    maxRequests: 2,
    windowMs: 60_000,
    now: 1_700_000_000_000,
  });
  assert.equal(blocked.allowed, true);

  const denied = await kvStore.consume({
    key: "203.0.113.1",
    maxRequests: 2,
    windowMs: 60_000,
    now: 1_700_000_000_000,
  });
  assert.equal(denied.allowed, false);

  const fallbackStore = createKvRateLimitStore(
    {
      KV_REST_API_URL: "https://kv.example",
      KV_REST_API_TOKEN: "token",
    },
    async (url) => {
      if (url.includes("/get/")) {
        return Response.json({ result: null });
      }
      return new Response("upstream error", { status: 503 });
    },
  );

  const fallbackAllowed = await checkAnalyzeUiRateLimit({
    clientKey: "fallback-client",
    now: Date.now(),
    env: { ANALYZE_UI_RATE_LIMIT_MAX: "1" },
    store: fallbackStore,
  });
  assert.equal(fallbackAllowed.allowed, true);

  const fallbackDenied = await checkAnalyzeUiRateLimit({
    clientKey: "fallback-client",
    now: Date.now(),
    env: { ANALYZE_UI_RATE_LIMIT_MAX: "1" },
    store: fallbackStore,
  });
  assert.equal(fallbackDenied.allowed, false);
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
