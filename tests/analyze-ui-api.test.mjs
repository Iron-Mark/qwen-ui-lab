import assert from "node:assert/strict";
import test from "node:test";
import { handleAnalyzeUiPost } from "../src/features/analysis/lib/analyze-ui-api.mjs";
import { MAX_ANALYZE_REQUEST_BYTES } from "../src/features/analysis/lib/analyze-request-validation.mjs";

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
