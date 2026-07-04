import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const primitiveFiles = [
  join("src", "components", "ui", "accordion.tsx"),
  join("src", "components", "ui", "badge.tsx"),
  join("src", "components", "ui", "progress.tsx"),
  join("src", "components", "ui", "tabs.tsx"),
];

test("shared primitives avoid broad layout transitions", () => {
  for (const file of primitiveFiles) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\btransition-all\b/, file);
  }
});

test("stateful primitives respect reduced-motion preferences", () => {
  for (const file of primitiveFiles) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /\bmotion-reduce:transition-none\b/, file);
  }
});
