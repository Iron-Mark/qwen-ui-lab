import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const lawExamplesSource = readFileSync(
  join(
    "src",
    "features",
    "design-system",
    "components",
    "LawOfUxExamples.tsx",
  ),
  "utf8",
);

test("interactive UX-law examples expose state semantics", () => {
  assert.match(lawExamplesSource, /aria-pressed=\{mode === value\}/);
  assert.match(lawExamplesSource, /aria-pressed=\{index <= step\}/);
  assert.match(lawExamplesSource, /aria-expanded=\{advanced\}/);
  assert.match(lawExamplesSource, /role="progressbar"/);
  assert.match(lawExamplesSource, /aria-valuenow=\{step \+ 1\}/);
});

test("interactive UX-law examples keep touch-safe buttons and scoped motion", () => {
  const touchSafeMatches = lawExamplesSource.match(/\bmin-h-11\b/g) ?? [];
  assert.ok(touchSafeMatches.length >= 5);
  assert.doesNotMatch(lawExamplesSource, /\btransition-all\b/);
  assert.match(lawExamplesSource, /transition-\[width\]/);
  assert.match(lawExamplesSource, /\bmotion-reduce:transition-none\b/);
});

test("decorative UX-law indicators stay out of the accessibility tree", () => {
  assert.match(
    lawExamplesSource,
    /animate-pulse rounded-full bg-accent" aria-hidden="true"/,
  );
});
