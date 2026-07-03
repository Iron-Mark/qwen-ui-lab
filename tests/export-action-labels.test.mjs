import assert from "node:assert/strict";
import test from "node:test";

import { createExportActionAriaLabel } from "../src/features/export/lib/export-action-labels.mjs";

test("createExportActionAriaLabel adds context only to generic code actions", () => {
  assert.equal(createExportActionAriaLabel("Copy"), "Copy code");
  assert.equal(createExportActionAriaLabel("Copy all"), "Copy all code");
  assert.equal(createExportActionAriaLabel("  Export  ", "package"), "Export package");
  assert.equal(createExportActionAriaLabel("Failed"), "Failed");
  assert.equal(createExportActionAriaLabel("Download component"), "Download component");
  assert.equal(createExportActionAriaLabel("Download package"), "Download package");
  assert.equal(createExportActionAriaLabel("Open PR instructions"), "Open PR instructions");
  assert.equal(createExportActionAriaLabel("Create GitHub Gist"), "Create GitHub Gist");
});

test("createExportActionAriaLabel falls back to a useful subject", () => {
  assert.equal(createExportActionAriaLabel(""), "code");
  assert.equal(createExportActionAriaLabel(null, "package"), "package");
  assert.equal(createExportActionAriaLabel(undefined, ""), "code");
});
