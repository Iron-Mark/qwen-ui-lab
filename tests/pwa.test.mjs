import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, it } from "node:test";

const PUBLIC = "public";

function readPngSize(filePath) {
  const buffer = readFileSync(filePath);
  assert.equal(buffer.readUInt32BE(0), 0x89504e47);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readIcoEntries(filePath) {
  const buffer = readFileSync(filePath);
  const count = buffer.readUInt16LE(4);
  return Array.from({ length: count }, (_, index) => {
    const offset = 6 + index * 16;
    return {
      width: buffer[offset] || 256,
      height: buffer[offset + 1] || 256,
      bitCount: buffer.readUInt16LE(offset + 6),
    };
  });
}

function extractPrecachePaths(source) {
  const match = source.match(/const PRECACHE = \[(?<body>[\s\S]*?)\];/);
  assert.ok(match?.groups?.body, "service worker should define a PRECACHE list");
  return Array.from(match.groups.body.matchAll(/"(?<path>\/[^"]+)"/g), (entry) => entry.groups.path);
}

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
    assert.equal(manifest.lang, "en-US");
    assert.deepEqual(manifest.display_override, ["standalone", "browser"]);

    const pngIcons = (manifest.icons ?? []).filter(
      (icon) => icon.type === "image/png" && icon.sizes !== "any",
    );
    assert.ok(pngIcons.some((icon) => icon.sizes === "192x192"));
    assert.ok(pngIcons.some((icon) => icon.sizes === "512x512"));
    assert.ok(
      (manifest.icons ?? []).some(
        (icon) => icon.purpose === "maskable" && icon.src === "/icons/icon-maskable.svg",
      ),
    );
    assert.ok(
      (manifest.icons ?? []).some(
        (icon) =>
          icon.purpose === "maskable" &&
          icon.type === "image/png" &&
          icon.sizes === "512x512" &&
          icon.src === "/icons/icon-maskable-512.png",
      ),
    );
    assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === "/#upload-flow"));
    assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === "/design-system"));
    assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === "/demo"));
    assert.ok(manifest.screenshots.some((screenshot) => screenshot.form_factor === "wide"));
    assert.ok(manifest.screenshots.some((screenshot) => screenshot.form_factor === "narrow"));
  });

  it("keeps static and generated manifest copy aligned", () => {
    const manifest = JSON.parse(readFileSync(join(PUBLIC, "manifest.json"), "utf8"));
    const manifestSource = readFileSync(join("src", "lib", "seo.ts"), "utf8");
    const sampleShortcut = manifest.shortcuts.find((shortcut) => shortcut.url === "/demo");
    const screenshotLabels = (manifest.screenshots ?? []).map((screenshot) => screenshot.label);

    assert.equal(manifest.name, "qwen-ui-lab - screenshot to React");
    assert.equal(
      manifest.description,
      "Screenshot-to-React workflow with inspectable starter packages.",
    );
    assert.match(manifestSource, /name:\s*`\$\{SITE_NAME\} - screenshot to React`/);
    assert.equal(sampleShortcut?.name, "Sample run");
    assert.equal(sampleShortcut?.description, "Open a guided layout and review a starter preview.");
    assert.ok(screenshotLabels.includes("Dashboard layout workspace"));
    assert.ok(screenshotLabels.includes("Mobile layout workspace"));

    for (const value of [
      manifest.description,
      sampleShortcut.name,
      sampleShortcut.description,
      ...screenshotLabels,
    ]) {
      assert.ok(manifestSource.includes(value), `${value} should stay mirrored in createManifestConfig`);
    }
  });

  it("matches declared icon and screenshot dimensions", () => {
    assert.deepEqual(readPngSize(join(PUBLIC, "icons", "icon-192.png")), {
      width: 192,
      height: 192,
    });
    assert.deepEqual(readPngSize(join(PUBLIC, "icons", "icon-512.png")), {
      width: 512,
      height: 512,
    });
    assert.deepEqual(readPngSize(join(PUBLIC, "icons", "icon-maskable-512.png")), {
      width: 512,
      height: 512,
    });
    assert.deepEqual(readPngSize(join(PUBLIC, "icons", "apple-touch-icon.png")), {
      width: 180,
      height: 180,
    });
    assert.deepEqual(readPngSize(join(PUBLIC, "references", "dashboard-reference.png")), {
      width: 1440,
      height: 900,
    });
    assert.deepEqual(readPngSize(join(PUBLIC, "references", "mobile-reference.png")), {
      width: 390,
      height: 844,
    });

    const icoEntries = readIcoEntries(join("src", "app", "favicon.ico"));
    assert.ok(icoEntries.some((entry) => entry.width === 16 && entry.height === 16));
    assert.ok(icoEntries.some((entry) => entry.width === 32 && entry.height === 32));
    assert.ok(icoEntries.some((entry) => entry.width === 48 && entry.height === 48));
    assert.ok(icoEntries.some((entry) => entry.width === 256 && entry.height === 256));
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
    assert.match(sw, /\/manifest\.webmanifest/);
    assert.match(sw, /\/social\/home-social-preview-1200x630\.png/);
    assert.match(sw, /\/social\/design-system-social-preview-1200x630\.png/);
    assert.match(sw, /\/icons\/icon-maskable-512\.png/);
    assert.match(sw, /navigationPreload/);
    assert.match(sw, /skipWaiting/);
    assert.match(sw, /SKIP_WAITING/);
    assert.doesNotMatch(sw, /CACHE_NAME\s*=\s*"qwen-ui-lab-v0"/);
  });

  it("precaches only real public assets and route shells", () => {
    const sw = readFileSync(join(PUBLIC, "sw.js"), "utf8");
    const precachePaths = extractPrecachePaths(sw);
    const routeShells = new Set(["/", "/design-system", "/manifest.webmanifest"]);
    const missingAssets = [];

    assert.ok(precachePaths.length > 0);
    assert.ok(!precachePaths.some((path) => path.startsWith("/generated-assets/")));

    for (const path of precachePaths) {
      if (routeShells.has(path)) continue;
      const publicPath = join(PUBLIC, path.slice(1));
      if (!existsSync(publicPath)) {
        missingAssets.push(path);
      }
    }

    assert.deepEqual(missingAssets, []);
  });

  it("caches GET /api/health with network-first for offline repeat visits", () => {
    const sw = readFileSync(join(PUBLIC, "sw.js"), "utf8");
    assert.match(sw, /HEALTH_API_PATH\s*=\s*"\/api\/health"/);
    assert.match(sw, /url\.pathname\s*===\s*HEALTH_API_PATH/);
    assert.match(sw, /networkFirst\(event\.request\)/);
  });

  it("offline page exists", () => {
    const offline = readFileSync(join(PUBLIC, "offline.html"), "utf8");
    assert.match(offline, /Offline - qwen-ui-lab/);
    assert.match(offline, /Saved workspace/);
    assert.match(offline, /Open workflow/);
    assert.match(offline, /Open sample/);
    assert.match(offline, /sharing and uncached assets/);
    assert.doesNotMatch(offline, /live analysis|live links/i);
    assert.doesNotMatch(offline, /\u00e2/);
  });
});

describe("public asset validation", () => {
  it("documents candidate-only generated asset exclusions", () => {
    const result = spawnSync(process.execPath, ["scripts/validate-public-assets.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Skipped candidate-only asset dirs: public\/generated-assets/);
    assert.match(result.stdout, /Asset validation passed/);
  });
});

describe("production PWA server launcher", () => {
  it("starts Next directly through Node without shell spawning", () => {
    const source = readFileSync(join("scripts", "start-prod-e2e.mjs"), "utf8");

    assert.match(source, /node_modules", "next", "dist", "bin", "next"/);
    assert.match(source, /run\(process\.execPath, \[nextCliPath, "build"\]\)/);
    assert.match(source, /run\(process\.execPath, \[nextCliPath, "start", "--port", port\]\)/);
    assert.match(source, /shell:\s*false/);
    assert.doesNotMatch(source, /shell:\s*process\.platform/);
    assert.doesNotMatch(source, /await run\("npm"/);
    assert.doesNotMatch(source, /await run\("npx"/);
  });
});
