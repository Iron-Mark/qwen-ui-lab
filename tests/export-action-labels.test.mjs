import assert from "node:assert/strict";
import test from "node:test";

import { createExportActionAriaLabel } from "../src/features/export/lib/export-action-labels.mjs";
import {
  EXPORT_ACTION_BUTTON_BASE_CLASS,
  EXPORT_ACTION_BUTTON_ERROR_CLASS,
  EXPORT_ACTION_BUTTON_SUCCESS_CLASS,
} from "../src/features/export/lib/export-action-button-styles.ts";

test("createExportActionAriaLabel adds context only to generic code actions", () => {
  assert.equal(createExportActionAriaLabel("Copy"), "Copy code");
  assert.equal(createExportActionAriaLabel("Copy all"), "Copy all code");
  assert.equal(createExportActionAriaLabel("  Export  ", "package"), "Download package");
  assert.equal(
    createExportActionAriaLabel("Exporting...", "package"),
    "Downloading package...",
  );
  assert.equal(createExportActionAriaLabel("Exported", "package"), "Downloaded package");
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

test("export action button styles preserve shared interaction states", () => {
  assert.match(EXPORT_ACTION_BUTTON_BASE_CLASS, /\bmin-h-11\b/);
  assert.match(EXPORT_ACTION_BUTTON_BASE_CLASS, /\bmin-w-11\b/);
  assert.match(EXPORT_ACTION_BUTTON_BASE_CLASS, /\btouch-manipulation\b/);
  assert.ok(
    EXPORT_ACTION_BUTTON_BASE_CLASS.includes(
      "transition-[transform,background-color,border-color,color,box-shadow]",
    ),
  );
  assert.match(EXPORT_ACTION_BUTTON_BASE_CLASS, /\bmotion-reduce:transition-none\b/);
  assert.match(EXPORT_ACTION_BUTTON_BASE_CLASS, /\bmotion-reduce:hover:translate-y-0\b/);
  assert.match(EXPORT_ACTION_BUTTON_SUCCESS_CLASS, /\bborder-success\/40\b/);
  assert.match(EXPORT_ACTION_BUTTON_ERROR_CLASS, /\bborder-destructive\/40\b/);
});
