import assert from "node:assert/strict";
import test from "node:test";
import { buildScaffoldZipEntries } from "../src/features/export/lib/scaffold-package.mjs";
import { createStoredZip } from "../src/features/export/lib/scaffold-zip.mjs";

test("createStoredZip produces a readable zip with README and scaffold", () => {
  const archive = createStoredZip([
    { name: "README.md", content: "# Export\n" },
    { name: "generated.tsx", content: "export function Demo() { return null; }\n" },
  ]);

  assert.ok(archive.length > 50);
  assert.equal(archive[0], 0x50);
  assert.equal(archive[1], 0x4b);
  const text = new TextDecoder().decode(archive);
  assert.match(text, /README\.md/);
  assert.match(text, /generated\.tsx/);
  assert.match(text, /export function Demo/);
});

test("buildScaffoldZipEntries exports fallback code as an export package", () => {
  const entries = buildScaffoldZipEntries({
    filename: "generated.tsx",
    description: "Fallback export",
    content: `import { Button } from "@/components/ui/button";

export default function GeneratedComponent() {
  return <Button>Save</Button>;
}
`,
  });

  const names = entries.map((entry) => entry.name).sort();
  assert.deepEqual(names, [
    "DESIGN.md",
    "README.md",
    "docs/generated.detection.md",
    "src/components/generated/generated.manifest.json",
    "src/components/generated/generated.recipe.json",
    "src/components/generated/generated.tokens.css",
    "src/components/generated/generated.tsx",
  ]);
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /Screenshot UI starter package/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /\| File \| Size \| Lines \|/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /\| `src\/components\/generated\/generated\.tsx` \| \d+ B \| \d+ \|/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /import GeneratedComponent from "@\/components\/generated\/generated";/,
  );
  assert.match(entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "", /Design notes/);
  assert.match(
    entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "",
    /return <GeneratedComponent \/>;/,
  );
  assert.match(
    entries.find((entry) => entry.name === "src/components/generated/generated.manifest.json")
      ?.content ?? "",
    /"designDoc": "DESIGN\.md"/,
  );
});

test("buildScaffoldZipEntries includes design notes for rich generated packages", () => {
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
  assert.ok(names.includes("src/components/generated/dashboard.recipe.json"));
  assert.ok(names.includes("docs/dashboard.detection.md"));
  assert.match(entries.find((entry) => entry.name === "README.md")?.content ?? "", /DESIGN\.md/);
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /1 shadcn-style primitive mapping was included for review\./,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /\| `docs\/dashboard\.detection\.md` \| [\d.]+ KB \| \d+ \|/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /import Dashboard from "@\/components\/generated\/dashboard";/,
  );
  assert.match(
    entries.find((entry) => entry.name === "README.md")?.content ?? "",
    /## Import readiness/,
  );
  assert.match(entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "", /Dashboard/);
  assert.match(
    entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "",
    /## Correction summary/,
  );
  assert.match(
    entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "",
    /Keep `src\/components\/generated\/dashboard\.recipe\.json`/,
  );
  assert.match(
    entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "",
    /Required UI imports: `@\/components\/ui\/button`/,
  );
  const recipe = JSON.parse(
    entries.find((entry) => entry.name === "src/components/generated/dashboard.recipe.json")
      ?.content ?? "{}",
  );
  assert.deepEqual(recipe.integration.dependencies, ["@/components/ui/button"]);
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
    entries.find((entry) => entry.name === "src/components/generated/settings.recipe.json")
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
});
