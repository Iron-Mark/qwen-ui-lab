import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const dialogSource = readFileSync(
  join("src", "components", "ui", "dialog.tsx"),
  "utf8",
);
const dialogActionFooterSource = readFileSync(
  join("src", "components", "ui", "dialog-action-footer.tsx"),
  "utf8",
);

test("dialog close button keeps a 44px touch target at every breakpoint", () => {
  assert.match(dialogSource, /\bsize-11\b/);
  assert.doesNotMatch(dialogSource, /\bsm:size-9\b/);
  assert.doesNotMatch(dialogSource, /\bsize-9\b/);
});

test("dialog action footers keep wrapped actions readable on mobile", () => {
  assert.match(dialogActionFooterSource, /\bthemed-scrollbar\b/);
  assert.ok(dialogActionFooterSource.includes("max-h-[42dvh]"));
  assert.match(dialogActionFooterSource, /\boverflow-y-auto\b/);
  assert.match(dialogActionFooterSource, /\bsm:overflow-visible\b/);
});
