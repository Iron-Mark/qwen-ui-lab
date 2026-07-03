import test from "node:test";
import assert from "node:assert/strict";

import { postAnalyzeUi } from "../src/features/analysis/lib/analyze-outcome.mjs";
import { REMOTE_ANALYSIS_COPY } from "../src/features/analysis/lib/analysis-copy.mjs";
import { analyzeUiImageWithQwen } from "../src/features/analysis/lib/qwen-analyze.mjs";
import {
  MOCK_CI_API_KEY,
  MOCK_QWEN_ANALYSIS_JSON,
  MOCK_QWEN_BASE_URL,
  MOCK_QWEN_MODEL,
  buildMockLiveAnalyzeUiRouteResponse,
  buildMockLiveQwenEnv,
  buildMockQwenChatCompletionResponse,
  LIVE_QWEN_HEALTH_RESPONSE,
} from "../src/features/analysis/lib/qwen-mock-fixtures.mjs";

const sampleFile = {
  name: "dashboard-reference.png",
  type: "image/png",
  size: 245760,
};

test("analyzeUiImageWithQwen returns structured artifact when upstream mock returns valid JSON", async () => {
  const upstreamCalls = [];

  const result = await analyzeUiImageWithQwen({
    imageDataUrl: "data:image/png;base64,abc",
    fileName: sampleFile.name,
    fileType: sampleFile.type,
    fileSize: sampleFile.size,
    env: buildMockLiveQwenEnv(),
    fetchFn: async (url, init) => {
      upstreamCalls.push(String(url));
      assert.match(String(url), /\/chat\/completions$/);
      assert.equal(
        init?.headers?.Authorization,
        `Bearer ${MOCK_CI_API_KEY}`,
      );
      return new Response(
        JSON.stringify(buildMockQwenChatCompletionResponse()),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    },
  });

  assert.equal(upstreamCalls.length, 1);
  assert.equal(result.ok, true);
  assert.equal(result.artifact.modeLabel, REMOTE_ANALYSIS_COPY.readyForReview);
  assert.doesNotMatch(result.artifact.modeLabel, /qwen|provider|model/i);
  assert.equal(result.artifact.plan[0].title, MOCK_QWEN_ANALYSIS_JSON.plan[0].title);
  assert.match(result.artifact.generatedCode, /ContractDashboardStarter/);
  assert.equal(
    result.artifact.previewStats[0].label,
    MOCK_QWEN_ANALYSIS_JSON.previewStats[0].label,
  );
  assert.equal(result.artifact.previewStats[0].value, "5");
  assert.equal(result.provider.model, MOCK_QWEN_MODEL);
  assert.equal(result.provider.baseUrl, MOCK_QWEN_BASE_URL);
});

test("analyzeUiImageWithQwen defaults missing upstream code to a starter component", async () => {
  const result = await analyzeUiImageWithQwen({
    imageDataUrl: "data:image/png;base64,abc",
    fileName: sampleFile.name,
    fileType: sampleFile.type,
    fileSize: sampleFile.size,
    env: buildMockLiveQwenEnv(),
    fetchFn: async () =>
      new Response(
        JSON.stringify(
          buildMockQwenChatCompletionResponse({
            summary: "Missing code contract.",
            plan: [],
            previewStats: [],
          }),
        ),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
  });

  assert.equal(result.ok, true);
  assert.match(result.artifact.generatedCode, /DashboardStarter/);
  assert.doesNotMatch(result.artifact.generatedCode, /GeneratedDashboard/);
});

test("postAnalyzeUi calls analyze-ui when health reports live mode and maps success artifact", async () => {
  let analyzePosts = 0;
  const routePayload = buildMockLiveAnalyzeUiRouteResponse(sampleFile);

  const outcome = await postAnalyzeUi(sampleFile, "data:image/png;base64,abc", {
    fetchFn: async (url, init) => {
      const target = String(url);
      if (target.includes("/api/health")) {
        return new Response(JSON.stringify(LIVE_QWEN_HEALTH_RESPONSE), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (target.includes("/api/analyze-ui")) {
        analyzePosts += 1;
        assert.equal(init?.method, "POST");
        return new Response(JSON.stringify(routePayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("not found", { status: 404 });
    },
  });

  assert.equal(analyzePosts, 1);
  assert.equal(outcome.providerState, "qwen");
  assert.equal(outcome.sampleRun, false);
  assert.equal(outcome.message, REMOTE_ANALYSIS_COPY.complete);
  assert.doesNotMatch(outcome.message, /qwen|configured model/i);
  assert.equal(outcome.artifact.plan[0].title, "Contract Layout Read");
  assert.match(outcome.artifact.generatedCode, /ContractDashboardStarter/);
  assert.equal(outcome.artifact.previewStats[0].label, "Contract Sections");
});
