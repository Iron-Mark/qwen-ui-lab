import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("local QA and generated report folders stay ignored", async () => {
  const gitignore = await readFile(".gitignore", "utf8");

  for (const pattern of ["/.local-logs/", "/test-results", "/.perf/"]) {
    assert.match(gitignore, new RegExp(`^${escapeRegExp(pattern)}$`, "m"));
  }
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
