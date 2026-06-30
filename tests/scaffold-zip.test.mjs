import assert from "node:assert/strict";
import test from "node:test";
import { buildScaffoldZipEntries } from "../src/features/export/lib/github-repo.mjs";
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
  assert.match(entries.find((entry) => entry.name === "README.md")?.content ?? "", /export package/);
  assert.match(entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "", /Design notes/);
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
  assert.match(entries.find((entry) => entry.name === "DESIGN.md")?.content ?? "", /Dashboard/);
});
