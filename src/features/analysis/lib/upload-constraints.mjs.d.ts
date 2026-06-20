export const MAX_UPLOAD_BYTES: number;
export const SUPPORTED_UPLOAD_IMAGE_TYPES: readonly string[];
export const UPLOAD_ACCEPT_ATTRIBUTE: string;

export type UploadValidationResult =
  | { ok: true }
  | {
      ok: false;
      reason: "missing" | "type" | "empty" | "size";
      maxBytes?: number;
    };

export function isSupportedUploadImageType(
  type: string | null | undefined,
): boolean;

export function validateUploadImageFile(
  file: { type?: string; size?: number } | null | undefined,
  options?: { maxBytes?: number },
): UploadValidationResult;

export function formatUploadSize(bytes: number): string;
