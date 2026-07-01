import assert from "node:assert/strict";
import test from "node:test";

import { normalizeGeneratedShadcnImports } from "../src/features/analysis/lib/generated-imports.mjs";
import { buildUiFlowArtifact } from "../src/features/analysis/lib/ui-flow.mjs";

test("normalizeGeneratedShadcnImports adds imports for known JSX primitives", () => {
  const normalized = normalizeGeneratedShadcnImports(`export default function GeneratedSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Input aria-label="Name" />
        <Button>Save</Button>
      </CardContent>
    </Card>
  );
}
`);

  assert.match(
    normalized,
    /import \{ Button \} from "@\/components\/ui\/button";/,
  );
  assert.match(
    normalized,
    /import \{\n  Card,\n  CardContent,\n  CardHeader,\n  CardTitle,\n\} from "@\/components\/ui\/card";/,
  );
  assert.match(normalized, /import \{ Input \} from "@\/components\/ui\/input";/);
});

test("normalizeGeneratedShadcnImports only fills missing specifiers", () => {
  const normalized = normalizeGeneratedShadcnImports(`import { Card } from "@/components/ui/card";

export default function GeneratedCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ready</CardTitle>
      </CardHeader>
    </Card>
  );
}
`);

  assert.equal(
    [...normalized.matchAll(/from "@\/components\/ui\/card"/g)].length,
    2,
  );
  assert.match(
    normalized,
    /import \{ CardHeader, CardTitle \} from "@\/components\/ui\/card";/,
  );
  assert.equal([...normalized.matchAll(/\bCard \}/g)].length, 1);
});

test("buildUiFlowArtifact normalizes override generated imports", () => {
  const artifact = buildUiFlowArtifact(
    { name: "manual.tsx", type: "image/png", size: 1024, width: 800, height: 600 },
    {
      generatedCode: `export default function ManualGenerated() {
  return <Button type="button">Save</Button>;
}`,
    },
  );

  assert.match(
    artifact.generatedCode,
    /import \{ Button \} from "@\/components\/ui\/button";/,
  );
});
