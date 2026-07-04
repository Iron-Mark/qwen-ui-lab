import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_SCAFFOLD_EXPORT_CONTENT_BYTES,
  normalizeScaffoldExportRequestBody,
} from "../src/features/export/lib/scaffold-export-request.mjs";

test("normalizeScaffoldExportRequestBody sanitizes export metadata", () => {
  const result = normalizeScaffoldExportRequestBody({
    content: "export const StarterFixture = () => null;",
    filename: "../scratch/starter-fixture.tsx",
    description: ` ${"A".repeat(300)} `,
  });

  assert.deepEqual(result, {
    ok: true,
    content: "export const StarterFixture = () => null;",
    filename: "starter-fixture.tsx",
    description: "A".repeat(256),
    mode: "auto",
  });
});

test("normalizeScaffoldExportRequestBody redacts sensitive description metadata", () => {
  const result = normalizeScaffoldExportRequestBody({
    content: "export const StarterFixture = () => null;",
    description:
      "Exported from C:\\Users\\Mark\\shot.png with GITHUB_TOKEN=ghp_secret and #share=abcdef",
  });

  assert.equal(result.ok, true);
  assert.doesNotMatch(result.description, /C:\\Users|ghp_secret|#share=abcdef/);
  assert.match(result.description, /\[local path\]/);
  assert.match(result.description, /GITHUB_TOKEN=<redacted>/);
  assert.match(result.description, /#share=<redacted>/);
});

test("normalizeScaffoldExportRequestBody accepts forced zip mode", () => {
  const result = normalizeScaffoldExportRequestBody({
    content: "export const StarterFixture = () => null;",
    mode: "zip",
  });

  assert.equal(result.ok, true);
  assert.equal(result.filename, "starter-component.tsx");
  assert.equal(result.mode, "zip");
});

test("normalizeScaffoldExportRequestBody rejects invalid bodies and empty content", () => {
  assert.deepEqual(normalizeScaffoldExportRequestBody(null), {
    ok: false,
    code: "invalid_body",
    message: "Request body must be a JSON object.",
  });

  assert.deepEqual(normalizeScaffoldExportRequestBody({ content: "   " }), {
    ok: false,
    code: "missing_content",
    message: "Component content is required.",
  });
});

test("normalizeScaffoldExportRequestBody enforces content byte limit", () => {
  const result = normalizeScaffoldExportRequestBody({
    content: "x".repeat(MAX_SCAFFOLD_EXPORT_CONTENT_BYTES + 1),
  });

  assert.deepEqual(result, {
    ok: false,
    code: "content_too_large",
    message: `Component exceeds ${MAX_SCAFFOLD_EXPORT_CONTENT_BYTES} bytes.`,
  });
});
