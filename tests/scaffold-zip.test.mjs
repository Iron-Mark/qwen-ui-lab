import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDetectionSummaryMarkdown,
  buildFallbackPackageReadme,
  buildPackageDesignMarkdown,
  buildProductionManifest,
} from "../src/features/export/lib/scaffold-package-docs.mjs";
import {
  DEFAULT_NO_REVIEW_UPDATES,
  DEFAULT_REVIEW_UPDATES_BASIS,
} from "../src/features/export/lib/scaffold-blueprint.mjs";
import { buildScaffoldZipEntries } from "../src/features/export/lib/scaffold-package.mjs";
import { createStoredZip } from "../src/features/export/lib/scaffold-zip.mjs";

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("createStoredZip produces a readable zip with README and scaffold", () => {
  const archive = createStoredZip([
    { name: "README.md", content: "# Export\n" },
    { name: "starter-fixture.tsx", content: "export function StarterFixture() { return null; }\n" },
  ]);

  assert.ok(archive.length > 50);
  assert.equal(archive[0], 0x50);
  assert.equal(archive[1], 0x4b);
  const text = new TextDecoder().decode(archive);
  assert.match(text, /README\.md/);
  assert.match(text, /starter-fixture\.tsx/);
  assert.match(text, /export function StarterFixture/);
});

test("createStoredZip uses starter naming for empty entry names", () => {
  const archive = createStoredZip([
    { name: "", content: "export function StarterFixture() { return null; }\n" },
  ]);
  const text = new TextDecoder().decode(archive);
  assert.match(text, /starter-component\.tsx/);
});

test("buildScaffoldZipEntries exports sparse code as an export package", () => {
  const entries = buildScaffoldZipEntries({
    filename: "starter-fixture.tsx",
    description: "Starter export",
    content: `import { Button } from "@/components/ui/button";

export default function StarterComponent() {
  return <Button>Save</Button>;
}
`,
  });

  const names = entries.map((entry) => entry.name).sort();
  assert.deepEqual(names, [
    "DESIGN.md",
    "README.md",
    "docs/starter-fixture.detection.md",
    "src/components/starters/starter-fixture.manifest.json",
    "src/components/starters/starter-fixture.recipe.json",
    "src/components/starters/starter-fixture.tokens.css",
    "src/components/starters/starter-fixture.tsx",
  ]);
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /Screenshot-to-React starter package/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /\| File \| Size \| Lines \|/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /\| `src\/components\/starters\/starter-fixture\.tsx` \| \d+ B \| \d+ \|/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /import StarterComponent from "@\/components\/starters\/starter-fixture";/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /## Review contract/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /## What changed from the screenshot/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    new RegExp(escapeRegExp(DEFAULT_NO_REVIEW_UPDATES)),
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /Keep `src\/components\/starters\/starter-fixture\.recipe\.json`, `src\/components\/starters\/starter-fixture\.manifest\.json`, and `docs\/starter-fixture\.detection\.md`/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /before connecting the component to a route/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /Use this as a starter package/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /Unzip this starter package into your app/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /Created with \[qwen-ui-lab\]/,
  );
  assert.doesNotMatch(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /Exported from \[qwen-ui-lab\]/,
  );
  assert.doesNotMatch(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /before shipping/,
  );
  assert.match(entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "", /Design notes/);
  assert.match(
    entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "",
    /return <StarterComponent \/>;/,
  );
  assert.match(
    entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "",
    /Compare the component with the source screenshot during review/,
  );
  assert.doesNotMatch(
    entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "",
    /before shipping/,
  );
  assert.match(
    entries.find((entry) => entry.name === "docs/starter-fixture.detection.md")?.content ?? "",
    /No element-level confidence reasons were available; compare the component with the source screenshot during review\./,
  );
  assert.doesNotMatch(
    entries.find((entry) => entry.name === "docs/starter-fixture.detection.md")?.content ?? "",
    /manual review|No element-level confidence reasons were exported/,
  );
  assert.match(
    entries.find((entry) => entry.name === "src/components/starters/starter-fixture.manifest.json")
      ?.content ?? "",
    /"designDoc": "DESIGN\.md"/,
  );
  assert.match(
    entries.find((entry) => entry.name === "src/components/starters/starter-fixture.recipe.json")
      ?.content ?? "",
    /"generator": "component-starter-package"/,
  );
  const recipe = JSON.parse(
    entries.find((entry) => entry.name === "src/components/starters/starter-fixture.recipe.json")
      ?.content ?? "{}",
  );
  assert.match(
    recipe.shadcnPrimitiveMap.button,
    /starter component/,
  );
  assert.doesNotMatch(
    recipe.shadcnPrimitiveMap.button,
    /generated component/,
  );
  assert.doesNotMatch(
    entries.find((entry) => entry.name === "src/components/starters/starter-fixture.recipe.json")
      ?.content ?? "",
    /manual-scaffold-export/,
  );
  const tokenCss = entries.find((entry) => entry.name === "src/components/starters/starter-fixture.tokens.css")
    ?.content ?? "";
  assert.match(tokenCss, /\.starter-screen/);
  assert.match(tokenCss, /--starter-accent/);
  assert.doesNotMatch(tokenCss, /\.generated-screen/);
  assert.doesNotMatch(tokenCss, /--qwen-generated/);
});

test("buildScaffoldZipEntries includes design notes for rich starter packages", () => {
  const entries = buildScaffoldZipEntries({
    filename: "dashboard.tsx",
    description: "Dashboard export",
    content: `const designTokens = {"surface":"#ffffff","foreground":"#111111"};
const screenIntent = {"label":"Dashboard","confidence":0.92};
const responsiveIntent = {"mode":"adaptive","breakpoints":["mobile","desktop"],"primaryFlow":"Stack cards on mobile."};
const detectedPatterns = {"cards":[{"id":"card-1"}]};
const detectedElements = [{"componentRole":"button","confidence":0.86,"reason":"clear action affordance"}];
const layoutRegions = [{"componentRole":"stats","confidence":0.9}];
const shadcnPrimitiveMap = {"Button":"Mapped from action controls."};

export default function Dashboard() {
  return <main>Dashboard</main>;
}
`,
  });

  const names = entries.map((entry) => entry.name).sort();
  assert.ok(names.includes("DESIGN.md"));
  assert.ok(names.includes("src/components/starters/dashboard.recipe.json"));
  assert.ok(names.includes("docs/dashboard.detection.md"));
  assert.match(entries.find((entry) => entry.name === "README.md")?.content ?? "", /DESIGN\.md/);
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /1 shadcn-style primitive mapping was included for verification\./,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /\| `docs\/dashboard\.detection\.md` \| [\d.]+ KB \| \d+ \|/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /import Dashboard from "@\/components\/starters\/dashboard";/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /## Package readiness/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /After verification, keep `DESIGN\.md` if it helps future maintenance/,
  );
  assert.doesNotMatch(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /before shipping/,
  );
  assert.match(entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "", /Dashboard/);
  assert.match(
    entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "",
    /## Review updates/,
  );
  assert.match(
    entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "",
    /## Review contract/,
  );
  assert.match(
    entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "",
    /Keep `src\/components\/starters\/dashboard\.recipe\.json`/,
  );
  assert.match(
    entries.find((entry) => entry.name === "docs/dashboard.detection.md")?.content ?? "",
    /## Review notes/,
  );
  assert.match(
    entries.find((entry) => entry.name === "docs/dashboard.detection.md")?.content ?? "",
    /Treat `src\/components\/starters\/dashboard\.recipe\.json` as the rebuild recipe/,
  );
  assert.match(
    entries.find((entry) => entry.name === "docs/dashboard.detection.md")?.content ?? "",
    /## Why elements were detected/,
  );
  assert.match(
    entries.find((entry) => entry.name === "docs/dashboard.detection.md")?.content ?? "",
    /button: detector evidence; clear action affordance\./,
  );
  assert.match(
    entries.find((entry) => entry.name === "docs/dashboard.detection.md")?.content ?? "",
    /No low-confidence regions or elements were captured/,
  );
  assert.match(
    entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "",
    /Required UI imports: `@\/components\/ui\/button`/,
  );
  const recipe = JSON.parse(
    entries.find((entry) => entry.name === "src/components/starters/dashboard.recipe.json")
      ?.content ?? "{}",
  );
  assert.deepEqual(recipe.integration.dependencies, ["@/components/ui/button"]);
});

test("export package normalizes legacy correction-source wording", () => {
  const entries = buildScaffoldZipEntries({
    filename: "dashboard.tsx",
    description: "Dashboard export",
    content: `const detectedElements = [{"componentRole":"button","confidence":0.86,"reason":"clear action affordance","userEdited":true}];
const correctionSummary = {"activeElements":1,"appliedEdits":1,"excludedBoxes":0,"sourceOfTruth":"Manual corrections are the source of truth for this review."};

export default function Dashboard() {
  return <main>Dashboard</main>;
}
`,
  });
  const combinedPackageText = entries.map((entry) => entry.content).join("\n---FILE---\n");
  const recipe = JSON.parse(
    entries.find((entry) => entry.name === "src/components/starters/dashboard.recipe.json")
      ?.content ?? "{}",
  );

  assert.equal(
    recipe.correctionSummary.sourceOfTruth,
    DEFAULT_REVIEW_UPDATES_BASIS,
  );
  assert.doesNotMatch(combinedPackageText, /source of truth/i);
  assert.doesNotMatch(combinedPackageText, /Manual corrections/i);
  assert.match(combinedPackageText, /Review updates/);
});

test("export package docs use concrete sparse-package review guidance", () => {
  const readme = buildFallbackPackageReadme({
    filename: "starter-review.tsx",
    description: "Starter export",
    componentName: "StarterComponent",
    files: {
      component: "src/components/starters/starter-review.tsx",
      recipe: "src/components/starters/starter-review.recipe.json",
      manifest: "src/components/starters/starter-review.manifest.json",
      tokens: "src/components/starters/starter-review.tokens.css",
      detectionSummary: "docs/starter-review.detection.md",
    },
    inventory: [],
    dependencies: [],
  });

  assert.match(
    readme,
    /Verify README\.md, DESIGN\.md, component TSX, recipe JSON, manifest JSON, tokens CSS, and detection notes during integration/,
  );
  assert.doesNotMatch(readme, /undefined/);
  assert.doesNotMatch(readme, /Inspect the zip entries before import/);

  const design = buildPackageDesignMarkdown({
    description: "Starter export",
    componentName: "StarterComponent",
    files: {
      component: "src/components/starters/starter-review.tsx",
    },
    blueprint: {},
  });

  assert.match(
    design,
    /Compare mobile, tablet, and desktop layouts against the source screenshot/,
  );
  assert.match(design, /DESIGN\.md/);
  assert.doesNotMatch(design, /undefined/);
  assert.doesNotMatch(design, /Verify the layout manually/);

  const manifest = buildProductionManifest({
    blueprint: {
      componentName: "StarterComponent",
      generator: "component-starter-package",
      sourceHash: "abcdef1234567890",
    },
    dependencies: [],
    files: {
      component: "src/components/starters/starter-review.tsx",
    },
    stem: "starter-review",
  });

  assert.equal(manifest.files.designDoc, "DESIGN.md");
  assert.equal(manifest.files.recipe, "src/components/starters/starter-review.recipe.json");
  assert.equal(manifest.files.manifest, "src/components/starters/starter-review.manifest.json");
  assert.equal(manifest.files.tokens, "src/components/starters/starter-review.tokens.css");
  assert.equal(manifest.files.detectionSummary, "docs/starter-review.detection.md");
});

test("export package docs tolerate sparse blueprint metadata", () => {
  const detectionSummary = buildDetectionSummaryMarkdown({
    files: {
      recipe: "src/components/starters/sparse.recipe.json",
    },
  });

  assert.match(
    detectionSummary,
    /Validate the starter against the source screenshot before connecting product data/,
  );
  assert.doesNotMatch(detectionSummary, /undefined/);

  const manifest = buildProductionManifest({
    blueprint: {
      componentName: "StarterComponent",
      generator: "component-starter-package",
    },
    dependencies: [],
    files: {
      component: "src/components/starters/sparse.tsx",
    },
    stem: "sparse",
  });

  assert.equal(manifest.sourceHash, "unknown-source");
  assert.equal(manifest.packageId, "qwen-unknown-sour");
  assert.equal(manifest.files.designDoc, "DESIGN.md");
});

test("export package docs normalize invalid component names", () => {
  const readme = buildFallbackPackageReadme({
    description: "Whitespace component export",
    componentName: "   ",
    files: {
      component: "src/components/starters/whitespace.tsx",
    },
  });

  assert.match(readme, /React \+ Tailwind component entry point \(`StarterComponent`\)/);
  assert.match(readme, /import StarterComponent from "@\/components\/starters\/whitespace";/);
  assert.doesNotMatch(readme, /import\s+from/);

  const design = buildPackageDesignMarkdown({
    description: "Invalid component export",
    componentName: "not-valid-name",
    files: {
      component: "src/components/starters/invalid.tsx",
    },
    blueprint: {},
  });

  assert.match(design, /- Name: `StarterComponent`/);

  const manifest = buildProductionManifest({
    blueprint: {
      componentName: "not-valid-name",
      generator: "component-starter-package",
    },
    dependencies: [],
    files: {
      component: "src/components/starters/invalid.tsx",
    },
    stem: "invalid",
  });

  assert.equal(manifest.component.name, "StarterComponent");
});

test("export package docs normalize dependency lists", () => {
  const readme = buildFallbackPackageReadme({
    description: "Dependency export",
    componentName: "StarterComponent",
    files: {
      component: "src/components/starters/dependencies.tsx",
    },
    dependencies: "not-an-array",
  });

  assert.match(readme, /No shadcn component imports were inferred/);
  assert.match(readme, /No shadcn dependencies were inferred/);

  const design = buildPackageDesignMarkdown({
    description: "Dependency design",
    componentName: "StarterComponent",
    files: {
      component: "src/components/starters/dependencies.tsx",
    },
    dependencies: [
      "@/components/ui/card",
      "",
      "@/components/ui/button",
      "@/components/ui/card",
    ],
    blueprint: {},
  });

  assert.match(
    design,
    /Required UI imports: `@\/components\/ui\/button`, `@\/components\/ui\/card`/,
  );
  assert.match(
    design,
    /- `@\/components\/ui\/button`\n- `@\/components\/ui\/card`/,
  );
});

test("export package docs normalize inventory rows", () => {
  const readme = buildFallbackPackageReadme({
    description: "Inventory export",
    componentName: "StarterComponent",
    files: {
      component: "src/components/starters/inventory.tsx",
    },
    inventory: [
      null,
      { path: "   ", bytes: 42, lines: 2 },
      { path: "src/components/starters/inventory.tsx", bytes: "bad", lines: 12.9 },
      { path: "DESIGN.md", bytes: 2048, lines: -4 },
    ],
  });

  assert.doesNotMatch(readme, /`undefined`|`\s+`/);
  assert.match(readme, /\| `src\/components\/starters\/inventory\.tsx` \| 0 B \| 12 \|/);
  assert.match(readme, /\| `DESIGN\.md` \| 2\.0 KB \| 0 \|/);
  assert.doesNotMatch(readme, /\| `\s*` \|/);

  const emptyInventoryReadme = buildFallbackPackageReadme({
    description: "Inventory export",
    componentName: "StarterComponent",
    files: {
      component: "src/components/starters/inventory.tsx",
    },
    inventory: [{ path: "", bytes: 10, lines: 1 }],
  });

  assert.match(emptyInventoryReadme, /Inventory unavailable/);
});

test("buildScaffoldZipEntries infers dependencies from known JSX primitives", () => {
  const entries = buildScaffoldZipEntries({
    filename: "settings.tsx",
    description: "Settings export",
    content: `export default function SettingsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Input aria-label="Workspace name" />
        <Button>Save</Button>
      </CardContent>
    </Card>
  );
}
`,
  });

  const recipe = JSON.parse(
    entries.find((entry) => entry.name === "src/components/starters/settings.recipe.json")
      ?.content ?? "{}",
  );
  const manifest = JSON.parse(
    entries.find((entry) => entry.name === "src/components/starters/settings.manifest.json")
      ?.content ?? "{}",
  );
  assert.deepEqual(recipe.integration.dependencies, [
    "@/components/ui/button",
    "@/components/ui/card",
    "@/components/ui/input",
  ]);
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /Required UI imports: `@\/components\/ui\/button`, `@\/components\/ui\/card`, `@\/components\/ui\/input`/,
  );
  assert.match(
    manifest.reviewContract.safeToRemoveSupportFilesAfter,
    /product data states/,
  );
  assert.doesNotMatch(
    manifest.reviewContract.safeToRemoveSupportFilesAfter,
    /data-state/,
  );
});
