import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const touchedUiFiles = [
  join("src", "features", "analysis", "components", "UiLawsCompliance.tsx"),
  join(
    "src",
    "features",
    "design-system",
    "components",
    "ComponentPreviewCard.tsx",
  ),
];

test("recently touched UI files keep portable ASCII separators", () => {
  const violations = [];

  for (const file of touchedUiFiles) {
    const source = readFileSync(file, "utf8");
    const match = source.match(/[^\x00-\x7F]/);
    if (match) {
      violations.push(`${file}: ${match[0]}`);
    }
  }

  assert.deepEqual(violations, []);
});
