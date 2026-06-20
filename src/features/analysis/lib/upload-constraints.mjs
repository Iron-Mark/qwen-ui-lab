export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const SUPPORTED_UPLOAD_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
];

export const UPLOAD_ACCEPT_ATTRIBUTE = SUPPORTED_UPLOAD_IMAGE_TYPES.join(",");

/**
 * @param {string | null | undefined} type
 */
export function isSupportedUploadImageType(type) {
  const normalized = String(type || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  return SUPPORTED_UPLOAD_IMAGE_TYPES.includes(normalized);
}

/**
 * @param {{ type?: string; size?: number } | null | undefined} file
 * @param {{ maxBytes?: number }} [options]
 */
export function validateUploadImageFile(
  file,
  { maxBytes = MAX_UPLOAD_BYTES } = {},
) {
  if (!file) return { ok: false, reason: "missing" };
  if (!isSupportedUploadImageType(file.type)) {
    return { ok: false, reason: "type" };
  }

  const size = Number(file.size);
  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, reason: "empty" };
  }
  if (Number.isFinite(size) && size > maxBytes) {
    return { ok: false, reason: "size", maxBytes };
  }

  return { ok: true };
}

/**
 * @param {number} bytes
 */
export function formatUploadSize(bytes) {
  const safeBytes = Math.max(0, Number(bytes) || 0);
  if (safeBytes < 1024) return `${safeBytes} B`;
  if (safeBytes < 1024 * 1024) {
    return `${roundToSingleDecimal(safeBytes / 1024)} KB`;
  }
  return `${roundToSingleDecimal(safeBytes / (1024 * 1024))} MB`;
}

function roundToSingleDecimal(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
