import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const componentPreviewCardSource = readFileSync(
  join(
    "src",
    "features",
    "design-system",
    "components",
    "ComponentPreviewCard.tsx",
  ),
  "utf8",
);

test("component preview variant and device controls are touch-safe", () => {
  assert.match(componentPreviewCardSource, /\bmin-h-11 rounded-full px-3\b/);
  assert.match(componentPreviewCardSource, /\bmin-h-11 rounded-full border\b/);
  assert.match(componentPreviewCardSource, /\bsize-11 min-h-11 rounded-full\b/);
  assert.doesNotMatch(componentPreviewCardSource, /\bh-8 w-8 rounded-full\b/);
  assert.doesNotMatch(componentPreviewCardSource, /\bsize-10 min-h-10 rounded-full\b/);
  assert.doesNotMatch(componentPreviewCardSource, /\bh-9 rounded-full\b/);
});
