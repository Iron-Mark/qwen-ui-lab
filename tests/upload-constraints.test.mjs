import test from "node:test";
import assert from "node:assert/strict";

import {
  formatUploadSize,
  isSupportedUploadImageType,
  MAX_UPLOAD_BYTES,
  UPLOAD_ACCEPT_ATTRIBUTE,
  validateUploadImageFile,
} from "../src/features/analysis/lib/upload-constraints.mjs";

test("UPLOAD_ACCEPT_ATTRIBUTE mirrors supported upload image types", () => {
  assert.equal(
    UPLOAD_ACCEPT_ATTRIBUTE,
    "image/png,image/jpeg,image/svg+xml,image/webp",
  );
});

test("isSupportedUploadImageType accepts only supported UI image formats", () => {
  assert.equal(isSupportedUploadImageType("image/png"), true);
  assert.equal(isSupportedUploadImageType("IMAGE/SVG+XML; charset=utf-8"), true);
  assert.equal(isSupportedUploadImageType("image/gif"), false);
  assert.equal(isSupportedUploadImageType(""), false);
});

test("validateUploadImageFile rejects missing, unsupported, and oversized files", () => {
  assert.deepEqual(validateUploadImageFile(null), { ok: false, reason: "missing" });
  assert.deepEqual(
    validateUploadImageFile({ type: "text/plain", size: 10 }),
    { ok: false, reason: "type" },
  );
  assert.deepEqual(
    validateUploadImageFile({ type: "image/png", size: 0 }),
    { ok: false, reason: "empty" },
  );
  assert.deepEqual(
    validateUploadImageFile({ type: "image/png", size: MAX_UPLOAD_BYTES + 1 }),
    { ok: false, reason: "size", maxBytes: MAX_UPLOAD_BYTES },
  );
  assert.deepEqual(
    validateUploadImageFile({ type: "image/webp", size: MAX_UPLOAD_BYTES }),
    { ok: true },
  );
});

test("formatUploadSize emits stable short labels", () => {
  assert.equal(formatUploadSize(512), "512 B");
  assert.equal(formatUploadSize(1536), "1.5 KB");
  assert.equal(formatUploadSize(MAX_UPLOAD_BYTES), "4 MB");
});
