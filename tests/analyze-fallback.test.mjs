import test from "node:test";
import assert from "node:assert/strict";

import {
  FALLBACK_BANNER,
  fallbackReasonFromPayload,
  postAnalyzeUi,
  resolveAnalyzeOutcome,
} from "../src/lib/analyze-outcome.mjs";
import { analyzeUiImageWithQwen } from "../src/lib/qwen-analyze.mjs";

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
  assert.equal(outcome.message, FALLBACK_BANNER);
  assert.match(outcome.detail, /DASHSCOPE_API_KEY/);
  assert.equal(outcome.artifact.file.name, sampleFile.name);
  assert.equal(outcome.artifact.modeLabel, "Local demo mode");
  assert.ok(outcome.artifact.generatedCode.includes("GeneratedDashboard"));
  assert.equal(outcome.artifact.previewStats.length, 4);
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
    assert.equal(outcome.message, FALLBACK_BANNER);
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
    /Qwen request failed/,
  );
});

test("postAnalyzeUi falls back when route returns missing key", async () => {
  const outcome = await postAnalyzeUi(sampleFile, "data:image/png;base64,abc", {
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
  assert.equal(outcome.artifact.modeLabel, "Local demo mode");
});

test("postAnalyzeUi falls back on non-JSON responses", async () => {
  const outcome = await postAnalyzeUi(sampleFile, "data:image/png;base64,abc", {
    fetchFn: async () => new Response("upstream gateway timeout", { status: 502 }),
  });

  assert.equal(outcome.providerState, "fallback");
  assert.match(outcome.detail, /non-JSON response/);
});

test("postAnalyzeUi falls back when fetch throws", async () => {
  const outcome = await postAnalyzeUi(sampleFile, "data:image/png;base64,abc", {
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

test("analyzeUiImageWithQwen reports auth failures from Qwen", async () => {
  const result = await analyzeUiImageWithQwen({
    imageDataUrl: "data:image/png;base64,abc",
    fileName: sampleFile.name,
    fileType: sampleFile.type,
    fileSize: sampleFile.size,
    env: { DASHSCOPE_API_KEY: "bad-key", QWEN_BASE_URL: "https://example.test/v1" },
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
    env: { DASHSCOPE_API_KEY: "test-key" },
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
    env: { DASHSCOPE_API_KEY: "test-key" },
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
    env: { DASHSCOPE_API_KEY: "test-key" },
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
