import assert from "node:assert/strict";
import test from "node:test";
import { createStoredZip } from "../src/lib/scaffold-zip.mjs";

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
