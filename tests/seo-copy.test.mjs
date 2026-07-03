import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const seoSource = readFileSync(
  fileURLToPath(new URL("../src/lib/seo.ts", import.meta.url)),
  "utf8",
);
const homeRouteSource = readFileSync(
  fileURLToPath(new URL("../src/features/home/lib/home-route.ts", import.meta.url)),
  "utf8",
);

test("site metadata keeps starter-package positioning", () => {
  assert.match(seoSource, /React \+ Tailwind starter packages/);
  assert.match(seoSource, /React \+ Tailwind starter package/);
  assert.match(seoSource, /React\/Tailwind starter package download/);
  assert.match(seoSource, /starter project files/);
  assert.doesNotMatch(seoSource, /React \+ Tailwind package/);
  assert.doesNotMatch(seoSource, /React\/Tailwind package/);
  assert.doesNotMatch(seoSource, /export-ready project files/);
});

test("home route metadata mirrors starter-package positioning", () => {
  assert.match(homeRouteSource, /React \+ Tailwind starter package/);
  assert.match(homeRouteSource, /React\/Tailwind starter package/);
  assert.match(homeRouteSource, /React \+ Tailwind starter package download/);
  assert.doesNotMatch(homeRouteSource, /React \+ Tailwind package/);
  assert.doesNotMatch(homeRouteSource, /React\/Tailwind package/);
});
