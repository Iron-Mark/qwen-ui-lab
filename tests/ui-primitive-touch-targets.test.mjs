import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const inputSource = readFileSync(
  join("src", "components", "ui", "input.tsx"),
  "utf8",
);
const selectSource = readFileSync(
  join("src", "components", "ui", "select.tsx"),
  "utf8",
);
const tabsSource = readFileSync(
  join("src", "components", "ui", "tabs.tsx"),
  "utf8",
);
const responsiveTabsSource = readFileSync(
  join("src", "components", "ui", "responsive-tabs.tsx"),
  "utf8",
);

test("form primitives use touch-safe default heights", () => {
  assert.match(inputSource, /\bmin-h-11\b/);
  assert.doesNotMatch(inputSource, /\bh-8\b/);

  assert.match(selectSource, /\bmin-h-11\b/);
  assert.doesNotMatch(selectSource, /\bh-9\b/);
});

test("tab primitives avoid cramped rails and broad transitions", () => {
  assert.match(tabsSource, /\bmin-h-11\b/);
  assert.match(tabsSource, /\bmin-h-10\b/);
  assert.doesNotMatch(tabsSource, /\bgroup-data-horizontal\/tabs:h-8\b/);
  assert.doesNotMatch(tabsSource, /\btransition-all\b/);
  assert.match(tabsSource, /\bmotion-reduce:transition-none\b/);
});

test("responsive tab rows protect tight dialog widths", () => {
  assert.match(responsiveTabsSource, /\bmax-w-full\b/);
  assert.ok(responsiveTabsSource.includes("[&_[data-slot=tabs-trigger]]:min-w-0"));
  assert.ok(responsiveTabsSource.includes("[&_[data-slot=tabs-trigger]]:whitespace-normal"));
  assert.ok(responsiveTabsSource.includes("sm:[&_[data-slot=tabs-trigger]]:whitespace-nowrap"));
});
