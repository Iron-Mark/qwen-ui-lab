import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

function runDoctor(env = {}) {
  return spawnSync(process.execPath, ["scripts/doctor.mjs"], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      ...env,
    },
    encoding: "utf8",
  });
}

test("doctor reports local analysis defaults as neutral info", () => {
  const result = runDoctor();

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /info DASHSCOPE_API_KEY - not set - local analysis only/);
  assert.match(
    result.stdout,
    /info QWEN_LIVE_ANALYSIS - local analysis mode \(no upstream calls\)/,
  );
  assert.doesNotMatch(result.stdout, /fail DASHSCOPE_API_KEY/);
  assert.doesNotMatch(result.stdout, /fail QWEN_LIVE_ANALYSIS/);
  assert.match(result.stdout, /Doctor: all checks passed/);
});

test("doctor keeps live flag disabled with key as neutral info", () => {
  const result = runDoctor({ DASHSCOPE_API_KEY: "test-key" });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ok DASHSCOPE_API_KEY - configured/);
  assert.match(
    result.stdout,
    /info QWEN_LIVE_ANALYSIS - not enabled - local analysis only \(key alone does not call Qwen\)/,
  );
  assert.doesNotMatch(result.stdout, /fail QWEN_LIVE_ANALYSIS/);
  assert.match(result.stdout, /Skipping Qwen API ping/);
});
