import test from "node:test";
import assert from "node:assert/strict";

import { resolveLocale } from "../src/lib/i18n/locale.mjs";

test("resolveLocale defaults to en and accepts zh stub", () => {
  assert.equal(resolveLocale(null), "en");
  assert.equal(resolveLocale("zh"), "zh");
  assert.equal(resolveLocale("fr"), "en");
});
