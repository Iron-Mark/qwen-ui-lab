import {
  formatUploadSize,
  MAX_UPLOAD_BYTES,
  validateUploadImageFile,
} from "./upload-constraints.mjs";

/**
 * @typedef {{
 *   imageDataUrl: string;
 *   fileName: string;
 *   fileType: string;
 *   fileSize: number;
 * }} AnalyzeRequestData
 *
 * @typedef {{
 *   ok: false;
 *   status: number;
 *   code: string;
 *   message: string;
 * }} AnalyzeRequestValidationError
 */

export const MAX_ANALYZE_REQUEST_BYTES = MAX_UPLOAD_BYTES * 2;

/**
 * @param {string | number | null | undefined} value
 * @returns {{ ok: true } | AnalyzeRequestValidationError}
 */
export function validateAnalyzeContentLength(value) {
  if (value === null || value === undefined || value === "") return { ok: true };

  const contentLength = Number(value);
  if (!Number.isFinite(contentLength) || contentLength < 0) return { ok: true };

  if (contentLength > MAX_ANALYZE_REQUEST_BYTES) {
    return {
      ok: false,
      status: 413,
      code: "request_too_large",
      message: `Request body must be ${formatUploadSize(
        MAX_ANALYZE_REQUEST_BYTES,
      )} or smaller.`,
    };
  }

  return { ok: true };
}

/**
 * @param {unknown} body
 * @returns {{ ok: true; data: AnalyzeRequestData } | AnalyzeRequestValidationError}
 */
export function normalizeAnalyzeRequestBody(body) {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      status: 400,
      code: "invalid_body",
      message: "Request body must be an object.",
    };
  }

  const record = /** @type {Record<string, unknown>} */ (body);
  const imageDataUrl = record.imageDataUrl;
  const fileName = record.fileName;
  const fileType = record.fileType;
  const fileSize = record.fileSize;

  if (
    typeof imageDataUrl !== "string" ||
    !imageDataUrl.startsWith("data:image/")
  ) {
    return {
      ok: false,
      status: 400,
      code: "invalid_image",
      message: "imageDataUrl must be an image data URL.",
    };
  }

  if (estimateDataUrlBytes(imageDataUrl) > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      status: 413,
      code: "invalid_image_size",
      message: `imageDataUrl must encode an image up to ${formatUploadSize(
        MAX_UPLOAD_BYTES,
      )}.`,
    };
  }

  if (typeof fileName !== "string" || fileName.length === 0) {
    return {
      ok: false,
      status: 400,
      code: "invalid_file_name",
      message: "fileName is required.",
    };
  }

  const fileValidation = validateUploadImageFile({
    type: typeof fileType === "string" ? fileType : "",
    size: typeof fileSize === "number" ? fileSize : Number.NaN,
  });

  if (!fileValidation.ok && fileValidation.reason === "type") {
    return {
      ok: false,
      status: 400,
      code: "invalid_file_type",
      message: "fileType must be PNG, JPG, SVG, or WebP.",
    };
  }

  if (!fileValidation.ok) {
    return {
      ok: false,
      status: 400,
      code: "invalid_file_size",
      message: `fileSize must be between 1 byte and ${formatUploadSize(
        MAX_UPLOAD_BYTES,
      )}.`,
    };
  }

  return {
    ok: true,
    data: {
      imageDataUrl,
      fileName,
      fileType: String(fileType),
      fileSize: Number(fileSize),
    },
  };
}

/**
 * @param {string} dataUrl
 */
export function estimateDataUrlBytes(dataUrl) {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex < 0) return Number.POSITIVE_INFINITY;

  const header = dataUrl.slice(0, commaIndex);
  const payload = dataUrl.slice(commaIndex + 1);

  if (/;base64/i.test(header)) {
    const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
    return Math.max(0, Math.ceil((payload.length * 3) / 4) - padding);
  }

  try {
    return new TextEncoder().encode(decodeURIComponent(payload)).length;
  } catch {
    return payload.length;
  }
}
