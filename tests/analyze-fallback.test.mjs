import test from "node:test";
import assert from "node:assert/strict";

import {
  FALLBACK_BANNER_MISSING,
  FALLBACK_BANNER_ERROR,
  fallbackReasonFromPayload,
  fetchAnalyzeHealth,
  postAnalyzeUi,
  resolveAnalyzeOutcome,
} from "../src/features/analysis/lib/analyze-outcome.mjs";
import {
  analyzeUiImageWithQwen,
  canUseLiveQwen,
  isLiveQwenAnalysisEnabled,
} from "../src/features/analysis/lib/qwen-analyze.mjs";

const sampleFile = {
  name: "dashboard-reference.png",
  type: "image/png",
  size: 245760,
};

test("resolveAnalyzeOutcome returns Qwen artifact on success", () => {
  const qwenArtifact = {
    file: { name: sampleFile.name },
    modeLabel: "Qwen provider: qwen3-vl-plus",
  };

  const outcome = resolveAnalyzeOutcome({
    file: sampleFile,
    responseOk: true,
    payload: {
      ok: true,
      artifact: qwenArtifact,
      provider: { model: "qwen3-vl-plus" },
    },
  });

  assert.equal(outcome.providerState, "qwen");
  assert.equal(outcome.artifact, qwenArtifact);
  assert.match(outcome.message, /qwen3-vl-plus/);
  assert.equal(outcome.detail, null);
});

test("resolveAnalyzeOutcome falls back when API key is missing", () => {
  const outcome = resolveAnalyzeOutcome({
    file: sampleFile,
    responseOk: false,
    payload: {
      ok: false,
      code: "missing_qwen_api_key",
      message: "DASHSCOPE_API_KEY is not configured on the server.",
    },
  });

  assert.equal(outcome.providerState, "fallback");
  assert.equal(outcome.message, FALLBACK_BANNER_MISSING);
  assert.match(outcome.detail, /DASHSCOPE_API_KEY/);
  assert.equal(outcome.artifact.file.name, sampleFile.name);
  assert.equal(outcome.artifact.modeLabel, "Ready to analyze");
  assert.ok(outcome.artifact.generatedCode.includes("GeneratedDashboard"));
  assert.equal(outcome.artifact.previewStats.length, 4);
  assert.equal(outcome.instantDemo, true);
});

test("resolveAnalyzeOutcome marks local analysis for missing key flag", () => {
  const outcome = resolveAnalyzeOutcome({
    file: sampleFile,
    responseOk: false,
    payload: { ok: false, code: "missing_qwen_api_key" },
    instantDemo: true,
  });

  assert.equal(outcome.instantDemo, true);
});

test("resolveAnalyzeOutcome falls back on auth and invalid JSON errors", () => {
  for (const payload of [
    {
      ok: false,
      code: "qwen_request_failed",
      message: "Incorrect API key provided.",
    },
    {
      ok: false,
      code: "invalid_qwen_json",
      message: "Qwen returned text, but it was not valid analysis JSON.",
    },
    {
      ok: false,
      code: "empty_qwen_response",
      message: "Qwen returned an empty analysis response.",
    },
  ]) {
    const outcome = resolveAnalyzeOutcome({
      file: sampleFile,
      responseOk: false,
      payload,
    });

    assert.equal(outcome.providerState, "fallback");
    assert.equal(outcome.message, FALLBACK_BANNER_ERROR);
    assert.ok(outcome.detail);
  }
});

test("resolveAnalyzeOutcome falls back on network and timeout errors", () => {
  const outcome = resolveAnalyzeOutcome({
    file: sampleFile,
    fetchError: "Request timed out after 30 seconds.",
  });

  assert.equal(outcome.providerState, "fallback");
  assert.match(outcome.detail, /timed out/);
  assert.equal(outcome.artifact.previewStats.length, 4);
});

test("fallbackReasonFromPayload maps known server codes", () => {
  assert.match(
    fallbackReasonFromPayload({ code: "qwen_network_error" }),
    /Could not reach the Qwen API/,
  );
  assert.match(
    fallbackReasonFromPayload({ code: "qwen_request_failed" }),
    /Live analysis was unavailable/,
  );
});

test("isLiveQwenAnalysisEnabled is false unless explicitly opted in", () => {
  assert.equal(isLiveQwenAnalysisEnabled({}), false);
  assert.equal(isLiveQwenAnalysisEnabled({ DASHSCOPE_API_KEY: "k" }), false);
  assert.equal(isLiveQwenAnalysisEnabled({ QWEN_LIVE_ANALYSIS: "true" }), true);
  assert.equal(isLiveQwenAnalysisEnabled({ USE_LIVE_QWEN: "1" }), true);
  assert.equal(isLiveQwenAnalysisEnabled({ QWEN_LIVE_ANALYSIS: "false" }), false);
});

test("canUseLiveQwen requires key and live flag", () => {
  assert.equal(canUseLiveQwen({}), false);
  assert.equal(canUseLiveQwen({ DASHSCOPE_API_KEY: "k" }), false);
  assert.equal(
    canUseLiveQwen({ DASHSCOPE_API_KEY: "k", QWEN_LIVE_ANALYSIS: "true" }),
    true,
  );
});

test("fetchAnalyzeHealth reports demo when live analysis is disabled", async () => {
  const health = await fetchAnalyzeHealth({
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          hasApiKey: true,
          liveAnalysisEnabled: false,
          provider: "demo",
        }),
      ),
  });

  assert.equal(health.hasApiKey, true);
  assert.equal(health.liveAnalysisEnabled, false);
  assert.equal(health.provider, "demo");
});

test("postAnalyzeUi skips analyze route when live analysis is disabled", async () => {
  let analyzeCalled = false;
  const outcome = await postAnalyzeUi(sampleFile, "data:image/png;base64,abc", {
    fetchFn: async (url) => {
      if (String(url).includes("/api/health")) {
        return new Response(
          JSON.stringify({
            hasApiKey: true,
            liveAnalysisEnabled: false,
            provider: "demo",
          }),
        );
      }
      analyzeCalled = true;
      return new Response("{}");
    },
  });

  assert.equal(analyzeCalled, false);
  assert.equal(outcome.providerState, "fallback");
  assert.equal(outcome.instantDemo, true);
  assert.equal(outcome.code, "live_analysis_disabled");
  assert.equal(outcome.artifact.modeLabel, "Ready to analyze");
});

test("postAnalyzeUi falls back when route returns missing key", async () => {
  const outcome = await postAnalyzeUi(sampleFile, "data:image/png;base64,abc", {
    skipHealthCheck: true,
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          ok: false,
          code: "missing_qwen_api_key",
          message: "DASHSCOPE_API_KEY is not configured on the server.",
        }),
        { status: 503 },
      ),
  });

  assert.equal(outcome.providerState, "fallback");
  assert.equal(outcome.artifact.modeLabel, "Ready to analyze");
});

test("postAnalyzeUi falls back on non-JSON responses", async () => {
  const outcome = await postAnalyzeUi(sampleFile, "data:image/png;base64,abc", {
    skipHealthCheck: true,
    fetchFn: async () => new Response("upstream gateway timeout", { status: 502 }),
  });

  assert.equal(outcome.providerState, "fallback");
  assert.match(outcome.detail, /non-JSON response/);
});

test("postAnalyzeUi falls back when fetch throws", async () => {
  const outcome = await postAnalyzeUi(sampleFile, "data:image/png;base64,abc", {
    skipHealthCheck: true,
    fetchFn: async () => {
      throw new Error("Failed to fetch");
    },
  });

  assert.equal(outcome.providerState, "fallback");
  assert.match(outcome.detail, /Failed to fetch/);
});

test("analyzeUiImageWithQwen reports missing API key", async () => {
  const result = await analyzeUiImageWithQwen({
    imageDataUrl: "data:image/png;base64,abc",
    fileName: sampleFile.name,
    fileType: sampleFile.type,
    fileSize: sampleFile.size,
    env: {},
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, "missing_qwen_api_key");
  assert.equal(result.status, 503);
});

test("analyzeUiImageWithQwen returns demo mock when key is set but live is disabled", async () => {
  let fetchCalled = false;
  const result = await analyzeUiImageWithQwen({
    imageDataUrl: "data:image/png;base64,abc",
    fileName: sampleFile.name,
    fileType: sampleFile.type,
    fileSize: sampleFile.size,
    env: { DASHSCOPE_API_KEY: "test-key" },
    fetchFn: async () => {
      fetchCalled = true;
      return new Response("{}");
    },
  });

  assert.equal(fetchCalled, false);
  assert.equal(result.ok, true);
  assert.equal(result.demo, true);
  assert.equal(result.artifact.modeLabel, "Ready to analyze");
});

test("resolveAnalyzeOutcome treats server demo payload as instant offline", () => {
  const outcome = resolveAnalyzeOutcome({
    file: sampleFile,
    responseOk: true,
    payload: {
      ok: true,
      demo: true,
      artifact: { file: { name: sampleFile.name }, modeLabel: "Ready to analyze" },
      provider: { model: "demo" },
    },
  });

  assert.equal(outcome.providerState, "fallback");
  assert.equal(outcome.instantDemo, true);
});

test("analyzeUiImageWithQwen reports auth failures from Qwen", async () => {
  const result = await analyzeUiImageWithQwen({
    imageDataUrl: "data:image/png;base64,abc",
    fileName: sampleFile.name,
    fileType: sampleFile.type,
    fileSize: sampleFile.size,
    env: {
      DASHSCOPE_API_KEY: "bad-key",
      QWEN_LIVE_ANALYSIS: "true",
      QWEN_BASE_URL: "https://example.test/v1",
    },
    fetchFn: async () =>
      new Response(JSON.stringify({ error: { message: "Unauthorized" } }), {
        status: 401,
      }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, "qwen_request_failed");
  assert.equal(result.status, 401);
});

test("analyzeUiImageWithQwen reports network errors", async () => {
  const result = await analyzeUiImageWithQwen({
    imageDataUrl: "data:image/png;base64,abc",
    fileName: sampleFile.name,
    fileType: sampleFile.type,
    fileSize: sampleFile.size,
    env: { DASHSCOPE_API_KEY: "test-key", QWEN_LIVE_ANALYSIS: "true" },
    fetchFn: async () => {
      throw new TypeError("fetch failed");
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, "qwen_network_error");
  assert.equal(result.status, 503);
});

test("analyzeUiImageWithQwen reports empty model responses", async () => {
  const result = await analyzeUiImageWithQwen({
    imageDataUrl: "data:image/png;base64,abc",
    fileName: sampleFile.name,
    fileType: sampleFile.type,
    fileSize: sampleFile.size,
    env: { DASHSCOPE_API_KEY: "test-key", QWEN_LIVE_ANALYSIS: "true" },
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "" } }],
        }),
        { status: 200 },
      ),
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, "empty_qwen_response");
  assert.equal(result.status, 502);
});

test("analyzeUiImageWithQwen reports invalid JSON from model", async () => {
  const result = await analyzeUiImageWithQwen({
    imageDataUrl: "data:image/png;base64,abc",
    fileName: sampleFile.name,
    fileType: sampleFile.type,
    fileSize: sampleFile.size,
    env: { DASHSCOPE_API_KEY: "test-key", QWEN_LIVE_ANALYSIS: "true" },
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "not-json" } }],
        }),
        { status: 200 },
      ),
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, "invalid_qwen_json");
  assert.equal(result.status, 502);
});
