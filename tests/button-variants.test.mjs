import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const buttonSource = readFileSync(
  join("src", "components", "ui", "button.tsx"),
  "utf8",
);

test("large icon buttons keep a 44px touch target", () => {
  assert.match(buttonSource, /"icon-lg":\s*"size-11"/);
  assert.doesNotMatch(buttonSource, /"icon-lg":\s*"size-10"/);
});

test("button press motion respects reduced-motion preferences", () => {
  assert.ok(
    buttonSource.includes(
      "transition-[background-color,border-color,color,box-shadow,opacity,transform]",
    ),
  );
  assert.doesNotMatch(buttonSource, /\btransition-all\b/);
  assert.match(buttonSource, /\bmotion-reduce:transition-none\b/);
  assert.match(buttonSource, /\bmotion-reduce:active:translate-y-0\b/);
});
