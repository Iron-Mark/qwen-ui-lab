import assert from "node:assert/strict";
import test from "node:test";
import {
  INVALID_JSON_REQUEST_ERROR,
  readJsonRequestBody,
} from "../src/lib/api-request.mjs";

test("readJsonRequestBody returns parsed request JSON", async () => {
  const result = await readJsonRequestBody(
    new Request("http://localhost/api", {
      method: "POST",
      body: JSON.stringify({ ok: true }),
    }),
  );

  assert.deepEqual(result, { ok: true, body: { ok: true } });
});

test("readJsonRequestBody returns a stable invalid JSON error", async () => {
  const result = await readJsonRequestBody(
    new Request("http://localhost/api", {
      method: "POST",
      body: "{not-json",
    }),
  );

  assert.deepEqual(result, {
    ok: false,
    error: INVALID_JSON_REQUEST_ERROR,
  });
});
