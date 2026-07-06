import assert from "node:assert/strict";
import test from "node:test";

import {
  BRAND_THEME_COOKIE_NAME,
  DEFAULT_BRAND_THEME,
  DEFAULT_THEME,
  THEME_COOKIE_NAME,
  createPreferenceCookie,
  readPreferenceCookie,
  resolveBrandTheme,
  resolveTheme,
} from "../src/lib/theme-preferences.ts";

test("theme preference helpers validate cookie values", () => {
  assert.equal(resolveTheme("dark"), "dark");
  assert.equal(resolveTheme("light"), "light");
  assert.equal(resolveTheme("system"), DEFAULT_THEME);
  assert.equal(resolveTheme(undefined), DEFAULT_THEME);

  assert.equal(resolveBrandTheme("purple"), "purple");
  assert.equal(resolveBrandTheme("blue"), "blue");
  assert.equal(resolveBrandTheme("sunset"), "sunset");
  assert.equal(resolveBrandTheme("indigo"), "purple");
  assert.equal(resolveBrandTheme("emerald"), "blue");
  assert.equal(resolveBrandTheme("neon"), DEFAULT_BRAND_THEME);
  assert.equal(resolveBrandTheme(undefined), DEFAULT_BRAND_THEME);
});

test("theme preference cookies are durable and path-scoped", () => {
  assert.equal(
    createPreferenceCookie(THEME_COOKIE_NAME, "dark"),
    "qwen-ui-theme=dark; Path=/; Max-Age=31536000; SameSite=Lax",
  );
  assert.equal(
    createPreferenceCookie(BRAND_THEME_COOKIE_NAME, "blue"),
    "qwen-ui-brand=blue; Path=/; Max-Age=31536000; SameSite=Lax",
  );
});

test("theme preference cookies can be read from browser cookie headers", () => {
  assert.equal(
    readPreferenceCookie("other=1; qwen-ui-theme=dark; qwen-ui-brand=sunset", "qwen-ui-theme"),
    "dark",
  );
  assert.equal(
    readPreferenceCookie("qwen-ui-brand=sunset%20theme; other=1", "qwen-ui-brand"),
    "sunset theme",
  );
  assert.equal(
    readPreferenceCookie(
      "x-qwen-ui-theme=light; qwen-ui-theme=dark; qwen-ui-theme-extra=light",
      "qwen-ui-theme",
    ),
    "dark",
  );
  assert.equal(readPreferenceCookie("qwen-ui-theme=%E0%A4%A", "qwen-ui-theme"), null);
  assert.equal(readPreferenceCookie("other=1", "qwen-ui-theme"), null);
});
