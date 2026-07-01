import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const PUBLIC_COPY_FILES = [
  "README.md",
  "docs/README.md",
  "docs/ARCHITECTURE.md",
  "docs/DEMO.md",
  "docs/media/MEETUP_MEDIA.md",
  "docs/media/LINKEDIN_POSTS.md",
  "docs/media/MEETUP_SLIDES.marp.md",
  "docs/ops/OFFLINE_DEMO_E2E.md",
  "public/manifest.json",
  "public/offline.html",
  "src/lib/seo.ts",
  "src/lib/i18n/dictionaries/en.ts",
  "src/lib/i18n/dictionaries/zh.ts",
  "src/features/demo/components/SampleReferencePageClient.tsx",
  "src/features/demo/lib/demo-archetypes.mjs",
  "src/features/demo/lib/demo-route.ts",
  "src/features/analysis/lib/offline-analyze.mjs",
  "src/features/analysis/lib/offline-image-inspection.mjs",
  "src/features/analysis/lib/ui-flow.mjs",
  "src/features/analysis/lib/design-md.mjs",
  "src/features/export/components/GistExportButton.tsx",
  "src/features/export/lib/scaffold-package-docs.mjs",
  "src/features/export/lib/github-gist.mjs",
  "src/features/export/lib/github-repo.mjs",
];

const BANNED_PUBLIC_PHRASES = [
  "Bundle copy",
  "bundle copy",
  "qwen-ui-lab export package",
  "Add qwen-ui-lab generated UI package",
  "Gist export unavailable",
  "GitHub Gist export is not configured",
  "Set GITHUB_TOKEN",
  "sample reference",
  "Sample reference",
  "bundled reference",
  "Bundled reference",
  "bundled screenshot",
  "Bundled screenshot references",
  "Try a bundled reference",
  "Load reference",
  "Uploaded reference",
  "UI reference",
  "SVG reference",
  "Reference image",
  "Fallback content with recovery action",
  "Sparse fallback content",
  "Chart card with text fallback",
  "Centered fallback or onboarding",
  "Empty state or onboarding fallback",
  "Production bundle",
  "production-ready bundle",
  "Handoff bundle",
  "final production",
  "production data wiring",
  "production-facing layout",
  "production components",
  "before production",
  "before merge",
  "before treating the component as final",
  "No element-level confidence reasons were exported",
  "exported for manual review",
  "inspect the generated component manually",
  "Review layout against the original screenshot before shipping",
  "not be merged",
  "Meetup-ready",
  "local account (demo stub)",
  "optional email demo",
  "Cached app shell",
  "cached screenshot workflow",
  "badgeDemo",
  "oneClickDemo",
  "trustDemo",
  "tryLiveDemo",
  "backToDemo",
  "modeLocalDemo",
  "statusDemoComplete",
  "toastInstantDemo",
  "toastRestoredDemo",
  "DemoPageClient",
  "demoArchetype",
  "demoArchetypeLabel",
  "resolveDemoArchetype",
  "DEMO_ARCHETYPE_QUERY_VALUES",
  "autoRunDemo",
];

const BANNED_MOJIBAKE_PATTERNS = [
  { label: "latin-1 mojibake prefix", pattern: /[ÃÂ][\u0080-\uFFFF]/u },
  { label: "windows-1252 mojibake prefix", pattern: /â[\u0080-\uFFFF]/u },
  { label: "replacement character", pattern: /\uFFFD/u },
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

test("public and generated copy avoid mojibake artifacts", async () => {
  const violations = [];

  for (const file of PUBLIC_COPY_FILES) {
    const absolutePath = path.join(process.cwd(), file);
    const source = await fs.readFile(absolutePath, "utf8");

    for (const { label, pattern } of BANNED_MOJIBAKE_PATTERNS) {
      const match = source.match(pattern);
      if (match) {
        violations.push(`${file}: ${label}: ${match[0]}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});
