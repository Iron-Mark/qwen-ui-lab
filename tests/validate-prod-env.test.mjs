import assert from "node:assert/strict";
import { test } from "node:test";
import { parseEnvFileContent, validateProdEnv } from "../scripts/validate-prod-env.mjs";

const baseProd = {
  KV_REST_API_URL: "https://kv.example",
  KV_REST_API_TOKEN: "token",
  GITHUB_TOKEN: "ghp_test",
  NEXT_PUBLIC_SITE_URL: "https://demo.example",
};

test("production passes with KV, gist, and local-analysis-first Qwen", () => {
  const result = validateProdEnv(baseProd, { target: "production" });
  assert.equal(result.ok, true);
  assert.equal(result.summary.liveAnalysisRequested, false);
});

test("parses production env file content without leaking comments", () => {
  const parsed = parseEnvFileContent(`
    # values are examples only
    export KV_REST_API_URL=https://kv.example
    KV_REST_API_TOKEN="token-value"
    GITHUB_TOKEN='ghp_test'
    NEXT_PUBLIC_OBSERVABILITY_ENABLED=false # inline comment
  `);

  assert.deepEqual(parsed, {
    KV_REST_API_URL: "https://kv.example",
    KV_REST_API_TOKEN: "token-value",
    GITHUB_TOKEN: "ghp_test",
    NEXT_PUBLIC_OBSERVABILITY_ENABLED: "false",
  });
});

test("production validation passes with parsed env file content", () => {
  const result = validateProdEnv(
    parseEnvFileContent(`
      KV_REST_API_URL=https://kv.example
      KV_REST_API_TOKEN=token
      GITHUB_TOKEN=ghp_test
      NEXT_PUBLIC_SITE_URL=https://demo.example
    `),
    { target: "production" },
  );

  assert.equal(result.ok, true);
});

test("production accepts Vercel production host as canonical URL source", () => {
  const result = validateProdEnv(
    {
      KV_REST_API_URL: "https://kv.example",
      KV_REST_API_TOKEN: "token",
      GITHUB_TOKEN: "ghp_test",
      VERCEL_PROJECT_PRODUCTION_URL: "qwen-ui-lab.vercel.app",
    },
    { target: "production" },
  );

  assert.equal(result.ok, true);
  assert.equal(result.summary.publicSiteUrl, "https://qwen-ui-lab.vercel.app");
});

test("production fails without a public canonical URL", () => {
  const result = validateProdEnv(
    {
      KV_REST_API_URL: "https://kv.example",
      KV_REST_API_TOKEN: "token",
      GITHUB_TOKEN: "ghp_test",
    },
    { target: "production" },
  );

  assert.equal(result.ok, false);
  assert.match(result.failures.join(" "), /NEXT_PUBLIC_SITE_URL/);
});

test("production rejects localhost canonical URL", () => {
  const result = validateProdEnv(
    {
      ...baseProd,
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    },
    { target: "production" },
  );

  assert.equal(result.ok, false);
  assert.match(result.failures.join(" "), /localhost/);
});

test("production requires HTTPS canonical URL", () => {
  const result = validateProdEnv(
    {
      ...baseProd,
      NEXT_PUBLIC_SITE_URL: "http://demo.example",
    },
    { target: "production" },
  );

  assert.equal(result.ok, false);
  assert.match(result.failures.join(" "), /HTTPS/);
});

test("production rejects canonical URL with path", () => {
  const result = validateProdEnv(
    {
      ...baseProd,
      NEXT_PUBLIC_SITE_URL: "https://demo.example/app",
    },
    { target: "production" },
  );

  assert.equal(result.ok, false);
  assert.match(result.failures.join(" "), /without a path/);
});

test("preview warns but does not fail without public canonical URL", () => {
  const result = validateProdEnv({}, { target: "preview" });

  assert.equal(result.ok, true);
  assert.equal(result.summary.publicSiteUrlConfigured, false);
  assert.match(result.warnings.join(" "), /public site URL unset/i);
});

test("production fails without KV", () => {
  const result = validateProdEnv(
    { GITHUB_TOKEN: "ghp_test" },
    { target: "production" },
  );
  assert.equal(result.ok, false);
  assert.match(result.failures.join(" "), /KV_REST_API/);
});

test("production fails without GITHUB_TOKEN", () => {
  const result = validateProdEnv(
    {
      KV_REST_API_URL: "https://kv.example",
      KV_REST_API_TOKEN: "token",
    },
    { target: "production" },
  );
  assert.equal(result.ok, false);
  assert.match(result.failures.join(" "), /GITHUB_TOKEN/);
});

test("production fails when live Qwen enabled", () => {
  const result = validateProdEnv(
    {
      ...baseProd,
      QWEN_LIVE_ANALYSIS: "true",
      DASHSCOPE_API_KEY: "sk-test",
      QWEN_MODEL: "qwen3-vl-plus",
    },
    { target: "production" },
  );
  assert.equal(result.ok, false);
  assert.match(result.failures.join(" "), /local-analysis-first/);
});

test("production requires Sentry DSN when error monitoring on", () => {
  const result = validateProdEnv(
    {
      ...baseProd,
      NEXT_PUBLIC_OBSERVABILITY_ENABLED: "true",
      NEXT_PUBLIC_ERROR_MONITORING_ENABLED: "true",
    },
    { target: "production" },
  );
  assert.equal(result.ok, false);
  assert.match(result.failures.join(" "), /SENTRY_DSN/);
});

test("production passes Sentry when monitoring on and DSN set", () => {
  const result = validateProdEnv(
    {
      ...baseProd,
      NEXT_PUBLIC_OBSERVABILITY_ENABLED: "true",
      NEXT_PUBLIC_ERROR_MONITORING_ENABLED: "true",
      NEXT_PUBLIC_SENTRY_DSN: "https://key@o0.ingest.sentry.io/1",
    },
    { target: "production" },
  );
  assert.equal(result.ok, true);
});

test("preview live rehearsal requires full live trio", () => {
  const result = validateProdEnv(
    {
      QWEN_LIVE_ANALYSIS: "true",
    },
    { target: "preview" },
  );
  assert.equal(result.ok, false);
  assert.match(result.failures.join(" "), /DASHSCOPE_API_KEY/);
});

test("preview live passes with documented vars", () => {
  const result = validateProdEnv(
    {
      KV_REST_API_URL: "https://kv.example",
      KV_REST_API_TOKEN: "token",
      QWEN_LIVE_ANALYSIS: "true",
      DASHSCOPE_API_KEY: "sk-test",
      QWEN_MODEL: "qwen3-vl-plus",
    },
    { target: "preview" },
  );
  assert.equal(result.ok, true);
  assert.equal(result.summary.liveCallsExecutable, true);
});

test("rejects NEXT_PUBLIC_QWEN_API_KEY on any target", () => {
  const result = validateProdEnv(
    {
      ...baseProd,
      NEXT_PUBLIC_QWEN_API_KEY: "leak",
    },
    { target: "production" },
  );
  assert.equal(result.ok, false);
});
