import test from "node:test";
import assert from "node:assert/strict";

import { buildProductionReadiness } from "../src/features/ops/lib/production-readiness.mjs";
import { handleReadinessGet } from "../src/features/ops/lib/readiness-api.mjs";

test("production readiness reports local-analysis fallbacks without secrets", () => {
  const readiness = buildProductionReadiness({});

  assert.equal(readiness.ok, true);
  assert.equal(readiness.provider, "demo");
  assert.equal(readiness.shareStorage, "memory");
  assert.equal(readiness.durableShareLinks, false);
  assert.equal(readiness.checks.find((check) => check.id === "demo-fallback")?.status, "ready");
  assert.equal(readiness.checks.find((check) => check.id === "share-storage")?.status, "fallback");
  assert.equal(readiness.checks.find((check) => check.id === "public-site-url")?.status, "fallback");
  assert.equal(readiness.hasQwenApiKey, false);
  assert.equal("apiKey" in readiness, false);
});

test("production readiness marks configured production integrations ready", () => {
  const readiness = buildProductionReadiness({
    DASHSCOPE_API_KEY: "secret",
    QWEN_LIVE_ANALYSIS: "true",
    KV_REST_API_URL: "https://kv.example",
    KV_REST_API_TOKEN: "kv-token",
    GITHUB_TOKEN: "github-token",
    NEXT_PUBLIC_SITE_URL: "https://demo.example",
  });

  assert.equal(readiness.provider, "qwen");
  assert.equal(readiness.shareStorage, "kv");
  assert.equal(readiness.durableShareLinks, true);
  assert.equal(readiness.publicSiteUrl, "https://demo.example");
  assert.equal(readiness.checks.find((check) => check.id === "live-qwen")?.status, "ready");
  assert.equal(readiness.checks.find((check) => check.id === "github-gist")?.status, "ready");
  assert.equal(readiness.checks.find((check) => check.id === "github-repo")?.status, "ready");
  assert.equal(readiness.checks.find((check) => check.id === "public-site-url")?.status, "ready");
});

test("production readiness accepts Vercel production URL fallback", () => {
  const readiness = buildProductionReadiness({
    VERCEL_PROJECT_PRODUCTION_URL: "qwen-ui-lab.vercel.app",
  });

  assert.equal(readiness.publicSiteUrl, "https://qwen-ui-lab.vercel.app");
  assert.equal(readiness.checks.find((check) => check.id === "public-site-url")?.status, "ready");
});

test("production readiness flags invalid public URL values", () => {
  const readiness = buildProductionReadiness({
    NEXT_PUBLIC_SITE_URL: "https://",
  });

  const publicSiteCheck = readiness.checks.find((check) => check.id === "public-site-url");
  assert.equal(publicSiteCheck?.status, "missing");
  assert.match(publicSiteCheck?.detail ?? "", /valid HTTPS public origin/);
});

test("production readiness rejects public URL values with paths", () => {
  const readiness = buildProductionReadiness({
    NEXT_PUBLIC_SITE_URL: "https://demo.example/app",
  });

  const publicSiteCheck = readiness.checks.find((check) => check.id === "public-site-url");
  assert.equal(publicSiteCheck?.status, "missing");
  assert.match(publicSiteCheck?.detail ?? "", /public origin/);
});

test("readiness API returns JSON payload", async () => {
  const response = handleReadinessGet({});
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.ok(Array.isArray(body.checks));
});
