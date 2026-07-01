import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const PUBLIC_COPY_FILES = [
  "README.md",
  "docs/DEMO.md",
  "public/manifest.json",
  "public/offline.html",
  "src/lib/seo.ts",
  "src/lib/i18n/dictionaries/en.ts",
  "src/lib/i18n/dictionaries/zh.ts",
  "src/features/analysis/lib/offline-analyze.mjs",
  "src/features/analysis/lib/offline-image-inspection.mjs",
  "src/features/analysis/lib/ui-flow.mjs",
  "src/features/export/components/GistExportButton.tsx",
  "src/features/export/lib/github-gist.mjs",
  "src/features/export/lib/github-repo.mjs",
];

const BANNED_PUBLIC_PHRASES = [
  "Bundle copy",
  "bundle copy",
  "Gist export unavailable",
  "GitHub Gist export is not configured",
  "Set GITHUB_TOKEN",
  "Fallback content with recovery action",
  "Sparse fallback content",
  "Chart card with text fallback",
  "Centered fallback or onboarding",
  "Empty state or onboarding fallback",
  "Production bundle",
  "production-ready bundle",
  "Handoff bundle",
  "Meetup-ready",
  "local account (demo stub)",
  "optional email demo",
  "Cached app shell",
  "cached screenshot workflow",
];

test("public and generated copy avoid stale demo/internal phrasing", async () => {
  const violations = [];

  for (const file of PUBLIC_COPY_FILES) {
    const absolutePath = path.join(process.cwd(), file);
    const source = await fs.readFile(absolutePath, "utf8");

    for (const phrase of BANNED_PUBLIC_PHRASES) {
      if (source.includes(phrase)) {
        violations.push(`${file}: ${phrase}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});
