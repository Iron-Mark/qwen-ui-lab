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
        <Label htmlFor="name">Name</Label>
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
  assert.match(normalized, /import \{ Label \} from "@\/components\/ui\/label";/);
});

test("normalizeGeneratedShadcnImports merges missing specifiers into existing imports", () => {
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
    1,
  );
  assert.match(
    normalized,
    /import \{ Card, CardHeader, CardTitle \} from "@\/components\/ui\/card";\n\nexport default/,
  );
  assert.equal([...normalized.matchAll(/\bCard\b/g)].length, 3);
});

test("normalizeGeneratedShadcnImports treats type-only imports as unavailable for JSX", () => {
  const normalized = normalizeGeneratedShadcnImports(`import type { Button } from "@/components/ui/button";

export default function GeneratedAction() {
  return <Button type="button">Save</Button>;
}
`);

  assert.match(
    normalized,
    /import type \{ Button \} from "@\/components\/ui\/button";\nimport \{ Button \} from "@\/components\/ui\/button";\n\nexport default/,
  );
});

test("normalizeGeneratedShadcnImports leaves one blank line after inserted imports", () => {
  const normalized = normalizeGeneratedShadcnImports(`type Props = {
  label: string;
};

export default function GeneratedAction(props: Props) {
  return <Button type="button">{props.label}</Button>;
}
`);

  assert.match(
    normalized,
    /^import \{ Button \} from "@\/components\/ui\/button";\n\ntype Props =/m,
  );
  assert.doesNotMatch(normalized, /button";\n\n\ntype Props =/);
});

test("normalizeGeneratedShadcnImports adds imports for table primitives", () => {
  const normalized = normalizeGeneratedShadcnImports(`export default function GeneratedTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Acme</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
`);

  assert.match(
    normalized,
    /import \{\n  Table,\n  TableBody,\n  TableCell,\n  TableHead,\n  TableHeader,\n  TableRow,\n\} from "@\/components\/ui\/table";/,
  );
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
