import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRepoCompareExport,
  canUseGithubRepoExport,
  getGithubRepoExportConfig,
  parseGithubRepoSlug,
} from "../src/features/export/lib/github-repo.mjs";
import { extractProductionScaffoldBlueprint } from "../src/features/export/lib/scaffold-blueprint.mjs";
import { buildScaffoldReadme } from "../src/features/export/lib/scaffold-package-docs.mjs";
import {
  buildScaffoldPackageFileMap,
  buildScaffoldZipEntries,
} from "../src/features/export/lib/scaffold-package.mjs";

test("canUseGithubRepoExport mirrors gist token detection", () => {
  assert.equal(canUseGithubRepoExport({}), false);
  assert.equal(canUseGithubRepoExport({ GITHUB_TOKEN: "ghp_test" }), true);
});

test("parseGithubRepoSlug accepts owner/repo", () => {
  assert.deepEqual(parseGithubRepoSlug("Iron-Mark/qwen-ui-lab"), {
    owner: "Iron-Mark",
    repo: "qwen-ui-lab",
  });
  assert.equal(parseGithubRepoSlug("invalid"), null);
});

test("getGithubRepoExportConfig uses defaults and overrides", () => {
  assert.deepEqual(getGithubRepoExportConfig({}), {
    owner: "Iron-Mark",
    repo: "qwen-ui-lab",
    base: "main",
  });
  assert.deepEqual(
    getGithubRepoExportConfig({
      GITHUB_EXPORT_REPO: "acme/widgets",
      GITHUB_EXPORT_BASE: "develop",
    }),
    { owner: "acme", repo: "widgets", base: "develop" },
  );
});

test("buildRepoCompareExport returns compare URL and instructions", () => {
  const result = buildRepoCompareExport({
    owner: "Iron-Mark",
    repo: "qwen-ui-lab",
    base: "main",
    filename: "generated-auth.tsx",
    description: "export package",
  });

  assert.match(result.url, /^https:\/\/github\.com\/Iron-Mark\/qwen-ui-lab\/compare\//);
  assert.match(result.url, /generated-auth\.tsx/);
  assert.match(result.branch, /^qwen-ui-lab-export-/);
  assert.ok(result.instructions.length > 10);
});

test("buildScaffoldZipEntries includes readme and sanitized filename", () => {
  const entries = buildScaffoldZipEntries({
    content: "export const x = 1;",
    filename: "../evil/name.tsx",
    description: "test",
  });

  assert.equal(entries.length, 7);
  assert.ok(entries.some((entry) => entry.name === "README.md"));
  assert.ok(entries.some((entry) => entry.name === "DESIGN.md"));
  assert.ok(entries.some((entry) => entry.name === "src/components/generated/name.tsx"));
  assert.match(entries.find((entry) => entry.name === "README.md")?.content ?? "", /test/);
  assert.equal(
    entries.find((entry) => entry.name === "src/components/generated/name.tsx")?.content,
    "export const x = 1;",
  );
});

test("extractProductionScaffoldBlueprint reads offline scaffold metadata", () => {
  const blueprint = extractProductionScaffoldBlueprint(RICH_GENERATED_SCAFFOLD);

  assert.ok(blueprint);
  assert.equal(blueprint.schema, "qwen-ui-lab/scaffold-recipe@1");
  assert.equal(blueprint.componentName, "GeneratedComponent");
  assert.equal(blueprint.screenIntent.label, "Dashboard workspace");
  assert.equal(blueprint.responsiveIntent.mode, "sidebar-grid");
  assert.equal(blueprint.shadcnPrimitiveMap["data-table"], "semantic table inside Card");
  assert.equal(blueprint.primitiveSummary.primitives["data-table"], 1);
  assert.equal(blueprint.primitiveSummary.patternCounts.dataTables, 1);
  assert.deepEqual(blueprint.correctionSummary, {
    activeElements: 1,
    appliedEdits: 1,
    excludedBoxes: 1,
    sourceOfTruth: "Manual corrections are the source of truth for this regenerated scaffold.",
  });
  assert.match(blueprint.sourceHash, /^[a-f0-9]{64}$/);
  assert.ok(blueprint.reviewChecklist.some((item) => /table rows/.test(item)));
});

test("extractProductionScaffoldBlueprint handles CRLF generated scaffolds", () => {
  const blueprint = extractProductionScaffoldBlueprint(
    RICH_GENERATED_SCAFFOLD.replace(/\n/g, "\r\n"),
  );

  assert.ok(blueprint);
  assert.equal(blueprint.screenIntent.label, "Dashboard workspace");
  assert.equal(blueprint.shadcnPrimitiveMap["primary-action"], "Button");
});

test("buildScaffoldPackageFileMap keeps export package paths consistent", () => {
  assert.deepEqual(buildScaffoldPackageFileMap("detected dashboard!.tsx"), {
    stem: "detected-dashboard",
    files: {
      designDoc: "DESIGN.md",
      component: "src/components/generated/detected-dashboard.tsx",
      recipe: "src/components/generated/detected-dashboard.recipe.json",
      manifest: "src/components/generated/detected-dashboard.manifest.json",
      tokens: "src/components/generated/detected-dashboard.tokens.css",
      detectionSummary: "docs/detected-dashboard.detection.md",
    },
  });
});

test("buildScaffoldZipEntries creates export package for offline scaffolds", () => {
  const entries = buildScaffoldZipEntries({
    content: RICH_GENERATED_SCAFFOLD,
    filename: "detected-dashboard.tsx",
    description: "Detected dashboard export",
  });
  const names = entries.map((entry) => entry.name);

  assert.deepEqual(names, [
    "README.md",
    "DESIGN.md",
    "src/components/generated/detected-dashboard.tsx",
    "src/components/generated/detected-dashboard.recipe.json",
    "src/components/generated/detected-dashboard.manifest.json",
    "src/components/generated/detected-dashboard.tokens.css",
    "docs/detected-dashboard.detection.md",
  ]);
  assert.match(entries[0].content, /Screenshot UI starter package/);
  assert.match(entries[0].content, /It is a starter package for review, not a final production component/);
  assert.match(
    entries[0].content,
    /Manual corrections: 1 edited detection box, 1 excluded element captured in the recipe JSON\./,
  );
  assert.match(
    entries[0].content,
    /Review notes: 1 low-confidence element plus \d+ checklist items before merge\./,
  );
  assert.match(entries[0].content, /## Import readiness/);
  assert.match(entries[0].content, /Required UI imports: .*@\/components\/ui\/button/);
  assert.match(entries[1].content, /Design notes/);
  assert.match(entries[1].content, /## Correction summary/);
  assert.match(entries[1].content, /## Import readiness/);
  assert.match(entries[1].content, /Applied edits: 1/);
  assert.match(entries[1].content, /Excluded boxes: 1/);
  assert.match(entries[1].content, /Source of truth: Manual corrections/);
  assert.match(entries[2].content, /GeneratedComponent/);
  assert.match(entries[5].content, /--qwen-generated-accent: #2563eb/);
  assert.match(entries[6].content, /Dashboard workspace/);
  assert.match(entries[6].content, /dataTables: 1/);
  assert.match(entries[6].content, /data-table: semantic table inside Card/);
  assert.match(entries[6].content, /High confidence: 2/);
  assert.match(entries[6].content, /Low confidence: 1/);
  assert.match(entries[6].content, /Applied edits: 1/);
  assert.match(entries[6].content, /Excluded boxes: 1/);
  assert.match(entries[6].content, /Source of truth: Manual corrections/);
  assert.match(entries[6].content, /Edited element-2: kept as primary-action/);
  assert.match(entries[6].content, /Excluded element-2: primary-action/);

  const recipe = JSON.parse(entries[3].content);
  assert.equal(recipe.schema, "qwen-ui-lab/scaffold-recipe@1");
  assert.equal(recipe.files.component, "src/components/generated/detected-dashboard.tsx");
  assert.equal(recipe.files.designDoc, "DESIGN.md");
  assert.equal(recipe.files.manifest, "src/components/generated/detected-dashboard.manifest.json");
  assert.equal(recipe.integration.importPath, "@/components/generated/detected-dashboard");
  assert.equal(recipe.primitiveSummary.primitives["data-table"], 1);
  assert.equal(recipe.correctionSummary.appliedEdits, 1);
  assert.equal(recipe.correctionSummary.excludedBoxes, 1);
  assert.deepEqual(recipe.integration.dependencies, [
    "@/components/ui/badge",
    "@/components/ui/button",
    "@/components/ui/card",
    "@/components/ui/table",
  ]);

  const manifest = JSON.parse(entries[4].content);
  assert.equal(manifest.schema, "qwen-ui-lab/export-bundle@1");
  assert.equal(manifest.bundleId, `qwen-${manifest.sourceHash.slice(0, 12)}`);
  assert.equal(manifest.contents.includesOriginalImage, false);
  assert.equal(manifest.contents.includesSecrets, false);
  assert.equal(manifest.corrections.appliedEdits, 1);
  assert.equal(manifest.corrections.excludedBoxes, 1);
  assert.match(manifest.corrections.sourceOfTruth, /Manual corrections/);
  assert.equal(manifest.files.designDoc, "DESIGN.md");
  assert.equal(manifest.files.recipe, "src/components/generated/detected-dashboard.recipe.json");
  assert.ok(
    manifest.qualityGates.includes(
      "Add or verify loading, empty, error, and keyboard focus states.",
    ),
  );
});

test("buildScaffoldReadme documents the scaffold file", () => {
  const readme = buildScaffoldReadme({
    filename: "generated-dashboard.tsx",
    description: "Dashboard export",
  });
  assert.match(readme, /generated-dashboard\.tsx/);
  assert.match(readme, /Dashboard export/);
});

const RICH_GENERATED_SCAFFOLD = `import { Badge } from "@/components/ui/badge";

const designTokens = {
  "surface": "#ffffff",
  "foreground": "#111827",
  "accent": "#2563eb",
  "accentForeground": "#ffffff",
  "muted": "#f8fafc",
  "border": "#d4d4d8",
  "space": "1rem",
  "radius": "0.5rem"
};

const detectedElements = [
  {
    "id": "element-1",
    "kind": "table",
    "primitive": "data-table",
    "componentRole": "data-table",
    "confidence": 0.88
  },
  {
    "id": "element-2",
    "kind": "button",
    "primitive": "button",
    "componentRole": "primary-action",
    "confidence": 0.68,
    "included": false,
    "userEdited": true
  }
];

const detectedPatterns = {
  "textLines": 3,
  "appShells": [],
  "dataTables": [
    {
      "id": "data-table-1",
      "confidence": 0.9,
      "children": ["element-1"]
    }
  ],
  "emptyStates": []
};

const responsiveIntent = {
  "mode": "sidebar-grid",
  "breakpoints": ["base", "md", "lg"],
  "primaryFlow": "collapse sidebar into top filter drawer below lg"
};

const screenIntent = {
  "id": "dashboard",
  "label": "Dashboard workspace",
  "confidence": 0.91
};

const layoutRegions = [
  {
    "id": "region-1",
    "kind": "data-table",
    "primitive": "data-table",
    "componentRole": "data-table",
    "confidence": 0.9
  }
];

const correctionSummary = {
  "activeElements": 1,
  "appliedEdits": 1,
  "excludedBoxes": 1,
  "sourceOfTruth": "Manual corrections are the source of truth for this regenerated scaffold."
};

const shadcnPrimitiveMap: Record<string, string> = {
  "data-table": "semantic table inside Card",
  "primary-action": "Button",
};

export default function GeneratedComponent() {
  return <section><Badge>Dashboard</Badge></section>;
}
`;
