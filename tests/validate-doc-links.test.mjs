import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { test } from "node:test";
import { validateDocLinks } from "../scripts/validate-doc-links.mjs";

function createFixture() {
  return mkdtempSync(join(tmpdir(), "qwen-doc-links-"));
}

test("validateDocLinks accepts local markdown links and title-decorated targets", () => {
  const root = createFixture();
  mkdirSync(join(root, "docs"));
  writeFileSync(join(root, "README.md"), "[Docs](./docs/guide.md)\n");
  writeFileSync(
    join(root, "docs", "guide.md"),
    '[Back](../README.md "Repository readme")\n[Self](#heading)\n[Web](https://example.com)\n',
  );

  const result = validateDocLinks({ repoRoot: root });

  assert.equal(result.checkedFileCount, 2);
  assert.deepEqual(result.issues, []);
});

test("validateDocLinks reports missing local markdown targets", () => {
  const root = createFixture();
  mkdirSync(join(root, "docs"));
  writeFileSync(join(root, "README.md"), "[Missing](./docs/missing.md)\n");

  const result = validateDocLinks({ repoRoot: root });

  assert.equal(result.checkedFileCount, 1);
  assert.equal(result.issues.length, 1);
  assert.match(result.issues[0], /missing link target/i);
});

test("validateDocLinks rejects sibling paths that only share a repo prefix", () => {
  const root = createFixture();
  const sibling = `${root}-sibling`;
  mkdirSync(join(root, "docs"));
  mkdirSync(sibling);
  writeFileSync(join(sibling, "outside.md"), "# Outside\n");
  const outsideTarget = relative(root, join(sibling, "outside.md")).replaceAll("\\", "/");
  writeFileSync(join(root, "README.md"), `[Outside](${outsideTarget})\n`);

  const result = validateDocLinks({ repoRoot: root });

  assert.equal(result.checkedFileCount, 1);
  assert.equal(result.issues.length, 1);
  assert.match(result.issues[0], /outside repo/i);
});
