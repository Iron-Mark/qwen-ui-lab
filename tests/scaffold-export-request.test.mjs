import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_SCAFFOLD_EXPORT_CONTENT_BYTES,
  normalizeScaffoldExportRequestBody,
} from "../src/features/export/lib/scaffold-export-request.mjs";

test("normalizeScaffoldExportRequestBody sanitizes export metadata", () => {
  const result = normalizeScaffoldExportRequestBody({
    content: "export const Demo = () => null;",
    filename: "../demo/component.tsx",
    description: ` ${"A".repeat(300)} `,
  });

  assert.deepEqual(result, {
    ok: true,
    content: "export const Demo = () => null;",
    filename: "component.tsx",
    description: "A".repeat(256),
  });
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
    message: "Scaffold content is required.",
  });
});

test("normalizeScaffoldExportRequestBody enforces content byte limit", () => {
  const result = normalizeScaffoldExportRequestBody({
    content: "x".repeat(MAX_SCAFFOLD_EXPORT_CONTENT_BYTES + 1),
  });

  assert.deepEqual(result, {
    ok: false,
    code: "content_too_large",
    message: `Scaffold exceeds ${MAX_SCAFFOLD_EXPORT_CONTENT_BYTES} bytes.`,
  });
});
