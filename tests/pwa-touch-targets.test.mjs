import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const installBannerSource = readFileSync(
  join("src", "features", "pwa", "components", "PwaInstallBanner.tsx"),
  "utf8",
);
const serviceWorkerSource = readFileSync(
  join("src", "features", "pwa", "components", "ServiceWorkerRegister.tsx"),
  "utf8",
);

test("PWA install banner actions keep 44px touch targets", () => {
  assert.match(installBannerSource, /min-h-11 px-3/);
  assert.match(installBannerSource, /size:\s*"icon-lg"/);
  assert.doesNotMatch(installBannerSource, /\bh-8 px-2\.5\b/);
  assert.doesNotMatch(installBannerSource, /\bh-9 w-9\b/);
});

test("PWA update notice actions keep 44px touch targets", () => {
  assert.match(serviceWorkerSource, /min-h-11 px-3/);
  assert.match(serviceWorkerSource, /size:\s*"icon-lg"/);
  assert.doesNotMatch(serviceWorkerSource, /\bh-8 px-2\.5\b/);
  assert.doesNotMatch(serviceWorkerSource, /\bh-9 w-9\b/);
});
