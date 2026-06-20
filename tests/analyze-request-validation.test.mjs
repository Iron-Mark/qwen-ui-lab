import test from "node:test";
import assert from "node:assert/strict";

import {
  estimateDataUrlBytes,
  MAX_ANALYZE_REQUEST_BYTES,
  normalizeAnalyzeRequestBody,
  validateAnalyzeContentLength,
} from "../src/features/analysis/lib/analyze-request-validation.mjs";
import { MAX_UPLOAD_BYTES } from "../src/features/analysis/lib/upload-constraints.mjs";

const validBody = {
  imageDataUrl: "data:image/png;base64,YWJj",
  fileName: "dashboard.png",
  fileType: "image/png",
  fileSize: 3,
};

test("validateAnalyzeContentLength rejects clearly oversized request bodies", () => {
  assert.deepEqual(validateAnalyzeContentLength(null), { ok: true });
  assert.deepEqual(validateAnalyzeContentLength(MAX_ANALYZE_REQUEST_BYTES), {
    ok: true,
  });

  const rejected = validateAnalyzeContentLength(MAX_ANALYZE_REQUEST_BYTES + 1);
  assert.equal(rejected.ok, false);
  assert.equal(rejected.status, 413);
  assert.equal(rejected.code, "request_too_large");
});

test("normalizeAnalyzeRequestBody accepts valid PNG/JPG/SVG/WebP payloads", () => {
  assert.deepEqual(normalizeAnalyzeRequestBody(validBody), {
    ok: true,
    data: validBody,
  });
  assert.equal(
    normalizeAnalyzeRequestBody({ ...validBody, fileType: "image/svg+xml" }).ok,
    true,
  );
  assert.equal(
    normalizeAnalyzeRequestBody({ ...validBody, fileType: "image/webp" }).ok,
    true,
  );
});

test("normalizeAnalyzeRequestBody rejects unsupported or inconsistent images", () => {
  assert.equal(normalizeAnalyzeRequestBody(null).code, "invalid_body");
  assert.equal(
    normalizeAnalyzeRequestBody({ ...validBody, imageDataUrl: "not-image" }).code,
    "invalid_image",
  );
  assert.equal(
    normalizeAnalyzeRequestBody({ ...validBody, fileName: "" }).code,
    "invalid_file_name",
  );
  assert.equal(
    normalizeAnalyzeRequestBody({ ...validBody, fileType: "image/gif" }).code,
    "invalid_file_type",
  );
  assert.equal(
    normalizeAnalyzeRequestBody({ ...validBody, fileSize: 0 }).code,
    "invalid_file_size",
  );
  assert.equal(
    normalizeAnalyzeRequestBody({
      ...validBody,
      fileSize: MAX_UPLOAD_BYTES + 1,
    }).code,
    "invalid_file_size",
  );
});

test("normalizeAnalyzeRequestBody rejects data URLs above the upload byte cap", () => {
  const oversized = normalizeAnalyzeRequestBody({
    ...validBody,
    fileSize: 1,
    imageDataUrl: `data:image/png;base64,${"a".repeat(
      Math.ceil(((MAX_UPLOAD_BYTES + 1) * 4) / 3),
    )}`,
  });

  assert.equal(oversized.ok, false);
  assert.equal(oversized.status, 413);
  assert.equal(oversized.code, "invalid_image_size");
});

test("estimateDataUrlBytes handles base64 and URI-encoded payloads", () => {
  assert.equal(estimateDataUrlBytes("data:image/png;base64,YWJj"), 3);
  assert.equal(estimateDataUrlBytes("data:image/svg+xml,%3Csvg%3E%3C%2Fsvg%3E"), 11);
  assert.equal(estimateDataUrlBytes("data:image/png;base64"), Number.POSITIVE_INFINITY);
});
