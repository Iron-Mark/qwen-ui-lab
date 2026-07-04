import assert from "node:assert/strict";
import test from "node:test";

import { BRAND_THEME_OPTIONS } from "../src/features/shell/lib/brand-theme-options.ts";
import { BRAND_THEME_VALUES } from "../src/lib/theme-preferences.ts";

test("brand theme menu options cover each supported brand theme once", () => {
  assert.deepEqual(
    BRAND_THEME_OPTIONS.map((option) => option.value),
    BRAND_THEME_VALUES,
  );

  const labels = new Set(BRAND_THEME_OPTIONS.map((option) => option.label));
  assert.equal(labels.size, BRAND_THEME_OPTIONS.length);

  for (const option of BRAND_THEME_OPTIONS) {
    assert.ok(option.label.trim(), `${option.value} should have a visible label`);
    assert.ok(option.subtitle.trim(), `${option.value} should have helper copy`);
  }
});
