import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const PUBLIC_COPY_FILES = [
  ".env.example",
  "README.md",
  "docs/README.md",
  "docs/ARCHITECTURE.md",
  "docs/CONTRIBUTING.md",
  "docs/DEMO.md",
  "docs/media/PRODUCT_MEDIA.md",
  "docs/media/PRODUCT_WALKTHROUGH_SCRIPT.md",
  "docs/media/LINKEDIN_POSTS.md",
  "docs/media/PRODUCT_WALKTHROUGH_SLIDES.marp.md",
  "docs/media/before-after-comparison.svg",
  "e2e/fixtures/sample-run-responses.json",
  "experiments/01-dashboard/first-pass-starter.tsx",
  "experiments/01-dashboard/reviewed-starter.tsx",
  "docs/ops/ANALYTICS_TAXONOMY.md",
  "docs/ops/LIVE_QWEN_ROLLOUT.md",
  "docs/ops/OAUTH_ROADMAP.md",
  "docs/ops/LOCAL_ANALYSIS_E2E.md",
  "docs/ops/SHARE_LINKS.md",
  "docs/ops/TROUBLESHOOTING_RUNBOOK.md",
  "docs/ops/ANALYTICS_STAGING_ACTIVATION.md",
  "docs/ops/PRODUCTION_SETUP_CHECKLIST.md",
  "docs/ops/STORYBOOK.md",
  "docs/specs/PULL_REQUEST_TEMPLATE.md",
  "docs/specs/ARTIFACT_CHECKLIST.md",
  "public/manifest.json",
  "public/offline.html",
  "public/references/landing-reference.svg",
  "src/lib/seo.ts",
  "src/app/globals.css",
  "src/features/home/lib/home-route.ts",
  "src/features/home/components/DashboardSampleDialog.tsx",
  "src/features/shell/components/Footer.tsx",
  "src/features/design-system/lib/export-snippets.ts",
  "src/features/design-system/lib/export-snippets.client.ts",
  "src/features/design-system/lib/design-system-route.ts",
  "src/features/design-system/components/catalog.tsx",
  "src/features/design-system/components/LawOfUxCard.tsx",
  "src/features/design-system/components/LawOfUxExamples.tsx",
  "src/features/design-system/data/uilaws.ts",
  "src/lib/i18n/dictionaries/en.ts",
  "src/lib/i18n/dictionaries/zh.ts",
  "src/lib/i18n/translate-analyze-step.mjs",
  "src/features/demo/components/SampleRunPageClient.tsx",
  "src/features/demo/lib/sample-run-archetypes.mjs",
  "src/features/demo/lib/sample-run-route.ts",
  "src/features/home/components/WorkflowBanner.tsx",
  "src/features/analytics/components/AnalyticsDashboardClient.tsx",
  "src/features/analytics/lib/analytics-route.ts",
  "src/features/analysis/components/UploadFlow.tsx",
  "src/features/analysis/lib/analysis-copy.mjs",
  "src/features/analysis/lib/analyze-ui-api.mjs",
  "src/features/analysis/lib/analyze-outcome.mjs",
  "src/features/analysis/lib/offline-analyze.mjs",
  "src/features/analysis/lib/offline-image-inspection.mjs",
  "src/features/analysis/lib/qwen-analyze.mjs",
  "src/features/analysis/lib/ui-flow.mjs",
  "src/features/analysis/lib/design-md.mjs",
  "src/features/analysis/lib/qwen-mock-fixtures.mjs",
  "src/features/export/components/ExportButton.tsx",
  "src/features/export/components/GistExportButton.tsx",
  "src/features/export/components/RepoExportButton.tsx",
  "src/features/export/lib/scaffold-package.mjs",
  "src/features/export/lib/scaffold-package-docs.mjs",
  "src/features/export/lib/scaffold-blueprint.mjs",
  "src/features/share/lib/share-result.mjs",
  "src/features/share/components/SharedSummaryCard.tsx",
  "src/features/export/lib/github-gist.mjs",
  "src/features/export/lib/github-repo.mjs",
  "src/app/demo/page.tsx",
];

const CORRUPTION_GUARD_FILES = [
  "GENERATED_ASSET_PACK.md",
  "README.md",
  "docs/README.md",
  "docs/DEMO.md",
  "docs/media/PRODUCT_MEDIA.md",
  "docs/media/PRODUCT_WALKTHROUGH_SCRIPT.md",
  "docs/media/PRODUCT_WALKTHROUGH_SLIDES.marp.md",
  "docs/ops/LIVE_QWEN_ROLLOUT.md",
  "docs/ops/OAUTH_ROADMAP.md",
  "docs/ops/LOCAL_ANALYSIS_E2E.md",
  "src/lib/i18n/dictionaries/en.ts",
  "src/features/export/lib/scaffold-package.mjs",
  "src/features/export/lib/scaffold-package-docs.mjs",
  "src/features/export/lib/scaffold-blueprint.mjs",
  "src/features/analytics/components/AnalyticsDashboardClient.tsx",
  "tests/architecture.test.mjs",
  "tests/github-repo.test.mjs",
  "tests/scaffold-zip.test.mjs",
];

const LOCAL_PATH_GUARD_FILES = [
  "GENERATED_ASSET_PACK.md",
  "README.md",
  "docs/README.md",
  "docs/media/PRODUCT_WALKTHROUGH_SCRIPT.md",
  "docs/ops/LOCAL_ANALYSIS_E2E.md",
  "docs/ops/PWA.md",
  "docs/specs/PULL_REQUEST_TEMPLATE.md",
];

const OPS_PRODUCT_COPY_FILES = [
  "docs/ops/DEPLOYMENT_CHECKLIST.md",
  "docs/ops/LIVE_QWEN_ROLLOUT.md",
  "docs/ops/OAUTH_ROADMAP.md",
  "docs/ops/POST_LAUNCH.md",
  "docs/ops/PRODUCTION_DEPLOY_LANE.md",
  "docs/ops/PRODUCTION_ENV_READINESS.md",
  "docs/ops/RELEASE_NOTES_DRAFT.md",
  "docs/ops/ROLLBACK_CHECKLIST.md",
  "docs/ops/TROUBLESHOOTING_RUNBOOK.md",
];

const EXPERIMENT_ARTIFACT_FILES = [
  "experiments/01-dashboard/first-pass-starter.tsx",
  "experiments/01-dashboard/reviewed-starter.tsx",
];

const COPY_DOWNLOAD_SURFACE_FILES = [
  "docs/ops/ANALYTICS_TAXONOMY.md",
  "docs/ops/STORYBOOK.md",
  "src/features/design-system/components/catalog.tsx",
  "src/features/design-system/data/uilaws.ts",
  "src/features/design-system/lib/design-system-route.ts",
  "src/lib/laws-of-ux.ts",
];

const EXPORT_RECOVERY_COPY_FILES = [
  "src/features/export/components/ExportButton.tsx",
  "src/features/export/components/GistExportButton.tsx",
  "src/features/export/components/RepoExportButton.tsx",
  "src/features/export/lib/github-gist.mjs",
];

const BANNED_PUBLIC_PHRASES = [
  "Bundle copy",
  "Bundle identity",
  "Package notes",
  "Project guide",
  "package copy",
  "bundleDownloaded",
  "bundleId",
  "design system bundle",
  "export bundle",
  "export-bundle",
  "bundle copy",
  "qwen-ui-lab export package",
  "Export Package",
  "Export packages are intended",
  "starter package export",
  "export a starter package",
  "export workflow",
  "export panel",
  "export flow",
  "exported snippets",
  "exported code",
  "upload-to-export",
  "Export controls",
  "Export complete",
  "end (export)",
  "snippet export",
  "Export snippets",
  "Upload a UI screenshot and export",
  "then export a React",
  "copy or export the starter component",
  "export snippets your team",
  "from the export package",
  "Add qwen-ui-lab generated UI package",
  "Gist export unavailable",
  "GitHub Gist export is not configured",
  "GitHub Gist export needs setup",
  "GitHub Gist needs setup",
  "GitHub Gist setup needed",
  "Could not reach gist export API",
  "Could not reach repo export API",
  "Repo export returned an unexpected response",
  "Could not prepare repo export",
  "Could not export component to repo",
  "Open GitHub Gist manually",
  "GitHub Gist created but no URL was returned",
  "Set GITHUB_TOKEN",
  "Automatic Gist links",
  "Automatic GitHub Gist links",
  "Gist links need setup first",
  "Could not prepare GitHub Gist export",
  "Could not create GitHub Gist",
  "File exported",
  "Export failed",
  "Export ready",
  "Export JSON",
  "Preparing export...",
  "Copy failed - try Export",
  "导出起始项目包",
  "检视导出项目包",
  "项目包导出会下载",
  "组件已导出",
  "Design.md 已导出",
  "The component is copied",
  "sample reference",
  "Open sample run",
  "Try a sample run",
  "Pick a sample run",
  "Could not load sample run",
  "Could not load the sample run",
  "打开样例运行",
  "试用样例运行",
  "无法加载样例运行",
  "preloaded sample screenshot",
  "preloaded sample run",
  "Prepared-layout flow",
  "prepared-layout flow",
  "prepared sample result",
  "prepared sample run",
  "Sample reference",
  "finished-screen generator",
  "bundled reference",
  "Bundled reference",
  "bundled screenshot",
  "Bundled screenshot references",
  "bundled sample",
  "Try a bundled reference",
  "Load reference",
  "uploaded-reference",
  "Uploaded reference",
  "UI reference",
  "Original UI reference",
  "SVG reference",
  "Reference image",
  "reference image",
  "Qwen UI sample",
  "screenshot reference",
  "sample screenshot workflow",
  "sample analysis",
  "sample run analysis",
  "Sample run workspace",
  "Mobile sample workspace",
  "export-ready examples",
  "export-ready files",
  "export-ready snippets",
  "export-ready groups",
  "Screenshot export",
  "Dashboard export based",
  "Dashboard / analytics export",
  "Auth export",
  "Mobile export",
  "Settings export",
  "Catalog export",
  "SVG export",
  "Review exported regions",
  "exported recipe",
  "Chart region exported",
  "Implementation pattern:",
  "reviewed primitives",
  "starter groups",
  "{edited} edited boxes and {excluded} omitted boxes",
  "{edited} 个已编辑框和 {excluded} 个已省略框",
  "Applied edits:",
  "Omitted boxes:",
  "exportMetricEdits: \"Edits\"",
  "exportMetricExcluded: \"Excluded\"",
  "exportMetricEdits: \"修正\"",
  "exportMetricExcluded: \"排除\"",
  "edited detection box",
  "excluded element captured",
  "Review edit",
  "review edit",
  "review edits",
  "Your edits guide",
  "No detection-box edits",
  "edits can be compared",
  "excluded from starter output",
  "review-edits-applied",
  "reviewer updates",
  "reviewer-updates-applied",
  "reviewer hid this box",
  "reviewer confirms",
  "Reviewer corrections guide this starter",
  "Reviewer corrections were applied",
  "Correction tools",
  "Review changes",
  " edited</Badge>",
  " excluded</Badge>",
  "Omitted from starter",
  "Reviewer omitted from exported starter",
  "Excluded elements:",
  "User-edited elements:",
  "Source kinds | Edited",
  "user edits and excluded elements",
  "This edited box",
  "Edited type",
  "Edited element-",
  "Excluded element-",
  "low-confidence or edited boxes",
  "Primitive mappings were exported",
  "No grouped patterns were exported",
  "No shadcn primitive map was exported",
  "No layout regions were exported",
  "No detected elements were exported",
  "No low-confidence regions or elements were exported",
  "React export package",
  "portable export package",
  "Unzip this export package",
  "This export package is created",
  "The export now includes",
  "responsive export",
  "shape the export",
  "screenshot-to-code",
  "screenshot to code",
  "saved screenshot workflow",
  "Screenshot-to-React sample screenshot",
  "Screenshot sample",
  "Saved reference analysis",
  "Open sample screenshot",
  "Sample layout",
  "sample layout",
  "sample layout:",
  "Open dashboard",
  "zero-click sample result",
  "Saved dashboard and design system workspace",
  "\u5df2\u4e0a\u4f20\u53c2\u8003\u56fe",
  "\u5df2\u4e0a\u4f20\u7684 UI \u53c2\u8003\u56fe",
  "\u53c2\u8003\u56fe",
  "\u53c2\u8003\u56fe\u7247",
  "\u6837\u4f8b\u622a\u56fe",
  "\u8bd5\u7528\u6837\u4f8b\u622a\u56fe",
  "\u52a0\u8f7d\u53c2\u8003\u56fe",
  "React + Tailwind \u9879\u76ee\u5305",
  "\u52a0\u8f7d {label} \u6837\u4f8b",
  "\u5df2\u52a0\u8f7d {label} \u6837\u4f8b",
  "Fallback content with recovery action",
  "Fallback medium confidence",
  "Sparse fallback content",
  "Chart card with text fallback",
  "Centered fallback or onboarding",
  "Empty state or onboarding fallback",
  "Production bundle",
  "production-ready bundle",
  "production-readiness checks",
  "shareable secret link",
  "Handoff bundle",
  "handoff checklist",
  "Handoff checklist",
  "sample data constants",
  "text fallback",
  "unavailable-item fallbacks",
  "fetch-error recovery",
  "Draft rows:",
  "Draft cards:",
  "Draft metrics:",
  "Draft table columns:",
  "Draft chart values:",
  "draft data",
  "Screenshot UI starter package",
  "screenshot UI starter package",
  "Add screenshot UI starter package",
  "Analysis mode:",
  "final production",
  "final visual review",
  "final production components",
  "human-refactored-final",
  "AI-generated baseline",
  "Qwen Code scaffold",
  "MockedQwenDashboard",
  "Ship UI faster with AI",
  "AI assisted scaffolding",
  "assisted scaffolding",
  "React package",
  "React + Tailwind package",
  "React/Tailwind package",
  "Replace sample content",
  "Replace sample copy",
  "Replace sample data",
  "Replace sample table",
  "BEFORE human review",
  "production-quality version",
  "Refined starter",
  "Screenshot Starter Refinement",
  "Before finalizing",
  "before finalizing any starter component",
  "Manual (requires human action)",
  "manual edits",
  "exported TSX",
  "Add the exported component",
  "Exported components:",
  "Exported at:",
  "Component file:",
  "Exported from [qwen-ui-lab]",
  "After approval",
  "are approved",
  "Plan props, mock data",
  "Use mock data from local data files",
  "Mock data is separated",
  "Typed mock data",
  "Mock data hardcoded",
  "mock data files",
  "Chart placeholder",
  "Chart Placeholder",
  "Placeholder text",
  "Placeholder for charting library",
  "placeholder for future chart",
  "placeholder content",
  "placeholder copy should be replaced",
  "placeholder data arrays",
  "placeholder controls",
  "chart placeholders",
  "reviewable package",
  "reviewable starter package",
  "reviewable export packages",
  "reviewable React + Tailwind",
  "reviewable regions",
  "generated UI should be reviewable",
  "generated decision",
  "stays reviewable",
  "import the files",
  "files you can import",
  "before exporting it",
  "drop-in finished screen",
  "magic final code",
  "final scaffold",
  "review scaffold",
  "final screenshot clone",
  "not mysterious",
  "not a black box",
  "starter code, not a finished product claim",
  "generated TSX component",
  "generated component TSX",
  "production data wiring",
  "real data wiring",
  "wire real data",
  "wiring real data",
  "Wire real data",
  "production-facing layout",
  "production components",
  "production-usable TSX",
  "before production",
  "before merge",
  "before treating the component as final",
  "before generation",
  "before using the component in an app",
  "before using it in an app",
  "before wiring it into an app",
  "import-ready layout",
  "Import checklist",
  "Ready for import review",
  "Generating preview",
  "Ship React-ready",
  "faster path to conversion",
  "导出前先审查",
  "使用结果前先检查",
  "立即分析并生成",
  "导入前",
  "导入项目之前",
  "No element-level confidence reasons were exported",
  "exported for manual review",
  "inspect the generated component manually",
  "manual visual review",
  "manual checklist",
  "Heuristic check",
  "patterns used in qwen-ui-lab",
  "surface mapping",
  "Review the generated code directly",
  "review-ready layout",
  "implementation review",
  "validate breakpoints manually",
  "classify the page type manually",
  "Confirm navigation landmarks manually",
  "Verify the layout manually",
  "Inspect the zip entries before import",
  "Quick import",
  "Import readiness",
  "package overview and import checklist",
  "Run app lint/build after importing",
  "Run lint/build after importing",
  "imported component",
  "source-control review",
  "same pull request",
  "with the pull request",
  "visual review is complete",
  "reviewed in source control",
  "source-controlled project files",
  "manual gist paste",
  "paste package contents manually",
  "manual-scaffold-export",
  "manual-correction-source-of-truth",
  "component-only-export",
  "before shipping",
  "Review layout against the original screenshot before shipping",
  "Review layout against the original screenshot before import",
  "not be merged",
  "Meetup-ready",
  ["local account (", "demo", "stub)"].join(" "),
  ["optional email", "demo"].join(" "),
  "stub URL",
  "Demo/Live mode impact",
  "Demo/live mode impact",
  "public demo",
  "demo target",
  "demo-safe",
  "Cached app shell",
  "cached screenshot workflow",
  "export a React component",
  "badgeDemo",
  "oneClickDemo",
  "instantDemo",
  "instant_demo",
  "NEXT_PUBLIC_OBSERVABILITY_ALLOW_DEMO_MODE",
  "trustDemo",
  "tryLiveDemo",
  "tryBundledReference",
  "backToDemo",
  "modeLocalDemo",
  "statusDemoComplete",
  "toastInstantDemo",
  "toastRestoredDemo",
  "DemoPageClient",
  "DemoPage",
  "buildDemoAnalyzeResponse",
  "demoArchetype",
  "demoArchetypeLabel",
  "resolveDemoArchetype",
  "DEMO_ARCHETYPE_QUERY_VALUES",
  "autoRunDemo",
  "DASHSCOPE_API_KEY is not configured on the server",
  "Incorrect API key provided",
  "Live Qwen is disabled",
  "E2E mock",
  "app-specific demo imports",
  "set QWEN_LIVE_ANALYSIS=true",
  "Could not reach the Qwen API",
  "Qwen returned text that was not valid analysis JSON",
  "Qwen returned an empty analysis response",
  "Qwen analysis was unavailable",
  "Request timed out after 30 seconds",
  "Failed to fetch",
  "Server response was not JSON",
  "Calling Qwen vision API",
  "Retrying after transient error",
  "Qwen3-VL Analysis",
  "Qwen3-VL UI analysis",
  "Human Refactor",
  "Upload a reference",
  "AI-assisted screenshot-to-React workflow",
  "AI-assisted UI scaffolding",
  "AI UI analysis",
  "AI analysis summary",
  "AI-ready component catalog",
  "Dashboard UI reference",
  "detector dashboard",
  "qwen-ui-lab dashboard",
  "Dashboard sample run",
  "Mobile app sample run",
  "Generated layout preview",
  "// Generated",
  "Generated empty state",
  "Generated hero",
  "Generated catalog",
  "generated preview",
  "generated scaffold",
  "generated scaffolds",
  "See what a generated result looks like",
  "full generated sample",
  "Preview the generated dashboard",
  "generated UI components",
  "Home dashboard plus screenshot upload",
  "dashboard reference",
  "Manual corrections are the source of truth",
  "Edits become the source of truth",
  "source of truth",
  "deterministic regeneration hints",
  "regeneration metadata",
  "recipe metadata",
  "package metadata for engineering review",
  "before regeneration",
  "generated region",
  "generated starter",
  "generated component.",
  "generated component from",
  "generated output",
  "generated-first-pass.tsx",
  "Before / After: Screenshot Scaffold Refinement",
  "component generation",
  "manual edits and",
  "Manual corrections",
  "manual detection-box edits",
  "Debug labels",
  "live-provider mode",
  "Analytics (internal)",
  "Staging-only funnel",
  "Internal \u00c2\u00b7 staging",
  "Internal \u00b7 staging",
  "Documentation-only view",
  "Implementation checklist",
];

const BANNED_MOJIBAKE_PATTERNS = [
  { label: "latin-1 mojibake prefix", pattern: /[\u00c3\u00c2][\u0080-\uFFFF]/u },
  { label: "windows-1252 mojibake prefix", pattern: /\u00e2[\u0080-\uFFFF]/u },
  { label: "replacement character", pattern: /\uFFFD/u },
];

const BANNED_PUBLIC_PATTERNS = [
  {
    label: "provider-specific analyzer message",
    pattern:
      /message:\s*["`][^"`]*(?:Qwen|DASHSCOPE_API_KEY|API key|live analysis|provider)[^"`]*["`]/i,
  },
  {
    label: "provider-specific status label",
    pattern: /modeLabel:\s*["`][^"`]*(?:Qwen|provider|model|demo|fallback)[^"`]*["`]/i,
  },
  {
    label: "provider-specific toast or banner copy",
    pattern: /(?:toast|banner)[A-Za-z0-9_]*:\s*["`][^"`]*(?:Qwen|API key|live analysis|provider)[^"`]*["`]/i,
  },
];

const CORRUPTED_DOC_LINK_PATTERNS = [
  "chetype|New here-|\\?archetype|Try screenshot-to-React workflow",
  "scaffold-package-chetype",
  "analytics-funnel-chetype",
  "design-system-domain=",
  "/api/share-id=",
  "localhost:3000/demo",
  "npm run dev running at localhost",
  "Open `http://localhost:3000`",
  "/demo-archetype=",
  "`-archetype=",
  "New here-",
];

const LOCAL_PATH_PATTERNS = [
  /C:[/\\]Users[/\\]/i,
  /[/\\]\.codex[/\\]/i,
  /\bDownloads[/\\]/i,
  /\bgenerated_images[/\\]/i,
];

const BANNED_OPS_PRODUCT_PHRASES = [
  "meetup-safe",
  "meetup default",
  "meetup timeline",
  "meetup script",
  "Operators running meetups",
  "demo by default",
  "provider mode (`demo` or `qwen`)",
  "strictest demo",
  "Demo / offline",
  "Demo host",
  "Demo baseline",
  "demo prep",
  "demo consumers",
  "public-demo",
  "demo vs live",
  "for the demo",
  "live presentation script",
  "production-ready",
  "home page readiness panel",
  "Production readiness panel on the home page",
  "running in fallback mode",
  "Free tier generous for demos",
  "forced fallback flow",
  "sendMagicLinkStub",
];

test("public and exported copy avoid stale demo/internal phrasing", async () => {
  const violations = [];

  for (const file of PUBLIC_COPY_FILES) {
    const absolutePath = path.join(process.cwd(), file);
    const source = await fs.readFile(absolutePath, "utf8");

    for (const phrase of BANNED_PUBLIC_PHRASES) {
      if (source.includes(phrase)) {
        violations.push(`${file}: ${phrase}`);
      }
    }

    for (const { label, pattern } of BANNED_PUBLIC_PATTERNS) {
      const match = source.match(pattern);
      if (match) {
        violations.push(`${file}: ${label}: ${match[0]}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("public and exported copy avoid mojibake artifacts", async () => {
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

test("public design-system export surfaces use copy/download wording", async () => {
  const violations = [];

  for (const file of COPY_DOWNLOAD_SURFACE_FILES) {
    const source = await fs.readFile(path.join(process.cwd(), file), "utf8");
    if (source.includes("copy/export")) {
      violations.push(`${file}: copy/export`);
    }
    if (source.includes("Copy/Export")) {
      violations.push(`${file}: Copy/Export`);
    }
    if (source.includes("Copy or download snippet")) {
      violations.push(`${file}: Copy or download snippet`);
    }
    if (source.includes('label: "Export"')) {
      violations.push(`${file}: label: "Export"`);
    }
  }

  assert.deepEqual(violations, []);
});

test("export recovery copy gives a next action", async () => {
  const combined = (
    await Promise.all(
      EXPORT_RECOVERY_COPY_FILES.map((file) =>
        fs.readFile(path.join(process.cwd(), file), "utf8"),
      ),
    )
  ).join("\n");

  assert.match(combined, /Copy the component/);
  assert.match(combined, /Try downloading instead/);
  assert.match(combined, /Download the package instead/);
  assert.doesNotMatch(combined, /"Exported"/);
  assert.doesNotMatch(combined, /"Export ready"/);
  assert.doesNotMatch(combined, /"Export to GitHub Gist"/);
  assert.doesNotMatch(combined, /"Preparing export\.\.\."/);
  assert.doesNotMatch(combined, /Could not (?:prepare|reach).*export/i);
  assert.doesNotMatch(combined, /export failed/i);
});

test("experiment artifacts stay ascii and portable", async () => {
  const violations = [];

  for (const file of EXPERIMENT_ARTIFACT_FILES) {
    const source = await fs.readFile(path.join(process.cwd(), file), "utf8");
    const match = source.match(/[^\x00-\x7F]/);
    if (match) {
      violations.push(`${file}: ${match[0]}`);
    }
  }

  assert.deepEqual(violations, []);
});

test("docs and package copy keep archetype links intact", async () => {
  const violations = [];

  for (const file of CORRUPTION_GUARD_FILES) {
    const absolutePath = path.join(process.cwd(), file);
    const source = await fs.readFile(absolutePath, "utf8");

    for (const pattern of CORRUPTED_DOC_LINK_PATTERNS) {
      if (source.includes(pattern)) {
        violations.push(`${file}: ${pattern}`);
      }
    }
  }

  const docsReadme = await fs.readFile(path.join(process.cwd(), "docs/README.md"), "utf8");
  const demoDocs = await fs.readFile(path.join(process.cwd(), "docs/DEMO.md"), "utf8");

  assert.match(docsReadme, /\?archetype=(auth|mobile|landing|settings|shop)/);
  assert.match(demoDocs, /\/demo\?archetype=auth/);
  assert.deepEqual(violations, []);
});

test("shareable docs avoid local machine paths", async () => {
  const violations = [];

  for (const file of LOCAL_PATH_GUARD_FILES) {
    const absolutePath = path.join(process.cwd(), file);
    const source = await fs.readFile(absolutePath, "utf8");

    for (const pattern of LOCAL_PATH_PATTERNS) {
      const match = source.match(pattern);
      if (match) {
        violations.push(`${file}: ${match[0]}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("artifact and walkthrough paths point to existing repo files", async () => {
  const files = [
    "docs/specs/ARTIFACT_CHECKLIST.md",
    "docs/media/PRODUCT_WALKTHROUGH_SCRIPT.md",
  ];
  const missing = [];

  for (const file of files) {
    const source = await fs.readFile(path.join(process.cwd(), file), "utf8");
    const pathMatches = [...source.matchAll(/`([^`\n]+)`/g)].map((match) => match[1]);
    const localFilePaths = pathMatches.filter(
      (value) =>
        !value.startsWith("/") &&
        !value.startsWith("http") &&
        !value.includes("*") &&
        /\.[a-z0-9]+$/i.test(value),
    );

    for (const relativePath of localFilePaths) {
      try {
        await fs.access(path.join(process.cwd(), relativePath));
      } catch {
        missing.push(`${file}: ${relativePath}`);
      }
    }
  }

  assert.deepEqual(missing, []);
});

test("ops docs use product-first local-analysis wording", async () => {
  const violations = [];

  for (const file of OPS_PRODUCT_COPY_FILES) {
    const absolutePath = path.join(process.cwd(), file);
    const source = await fs.readFile(absolutePath, "utf8");

    for (const phrase of BANNED_OPS_PRODUCT_PHRASES) {
      if (source.includes(phrase)) {
        violations.push(`${file}: ${phrase}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});
