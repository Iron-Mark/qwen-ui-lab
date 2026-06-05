import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const PUBLIC = "public";

describe("PWA manifest", () => {
  it("includes installability fields", () => {
    const manifest = JSON.parse(readFileSync(join(PUBLIC, "manifest.json"), "utf8"));
    assert.equal(manifest.start_url, "/");
    assert.equal(manifest.scope, "/");
    assert.equal(manifest.display, "standalone");
    assert.match(manifest.name, /qwen-ui-lab/i);
    assert.ok(manifest.short_name);
    assert.ok(manifest.description);
    assert.ok(manifest.theme_color);
    assert.ok(manifest.background_color);

    const pngIcons = (manifest.icons ?? []).filter(
      (icon) => icon.type === "image/png" && icon.sizes !== "any",
    );
    assert.ok(pngIcons.some((icon) => icon.sizes === "192x192"));
    assert.ok(pngIcons.some((icon) => icon.sizes === "512x512"));
  });
});

describe("service worker shell", () => {
  it("precaches offline fallback and uses a versioned cache", () => {
    const swPath = join(PUBLIC, "sw.js");
    assert.ok(existsSync(swPath));
    const sw = readFileSync(swPath, "utf8");
    assert.match(sw, /CACHE_NAME\s*=\s*"qwen-ui-lab-v\d+"/);
    assert.match(sw, /\/offline\.html/);
    assert.match(sw, /\/manifest\.json/);
    assert.match(sw, /skipWaiting/);
    assert.match(sw, /SKIP_WAITING/);
    assert.doesNotMatch(sw, /CACHE_NAME\s*=\s*"qwen-ui-lab-v0"/);
  });

  it("caches GET /api/health with network-first for offline repeat visits", () => {
    const sw = readFileSync(join(PUBLIC, "sw.js"), "utf8");
    assert.match(sw, /HEALTH_API_PATH\s*=\s*"\/api\/health"/);
    assert.match(sw, /url\.pathname\s*===\s*HEALTH_API_PATH/);
    assert.match(sw, /networkFirst\(event\.request\)/);
  });

  it("offline page exists", () => {
    assert.ok(existsSync(join(PUBLIC, "offline.html")));
  });
});
