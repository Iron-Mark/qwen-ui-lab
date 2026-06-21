import assert from "node:assert/strict";
import test from "node:test";
import { handleAnalyzeHealthGet } from "../src/features/analysis/lib/analyze-health-api.mjs";

async function withLiveEnv(value, callback) {
  const previousLive = process.env.QWEN_LIVE_ANALYSIS;
  const previousKey = process.env.DASHSCOPE_API_KEY;

  if (value?.live === undefined) {
    delete process.env.QWEN_LIVE_ANALYSIS;
  } else {
    process.env.QWEN_LIVE_ANALYSIS = value.live;
  }
  if (value?.key === undefined) {
    delete process.env.DASHSCOPE_API_KEY;
  } else {
    process.env.DASHSCOPE_API_KEY = value.key;
  }

  try {
    return await callback();
  } finally {
    if (previousLive === undefined) {
      delete process.env.QWEN_LIVE_ANALYSIS;
    } else {
      process.env.QWEN_LIVE_ANALYSIS = previousLive;
    }
    if (previousKey === undefined) {
      delete process.env.DASHSCOPE_API_KEY;
    } else {
      process.env.DASHSCOPE_API_KEY = previousKey;
    }
  }
}

test("handleAnalyzeHealthGet returns demo provider state by default", async () => {
  await withLiveEnv({}, async () => {
    const response = handleAnalyzeHealthGet();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ok: true,
      provider: "demo",
      hasApiKey: false,
      liveAnalysisEnabled: false,
      model: null,
      baseUrl: null,
    });
  });
});
