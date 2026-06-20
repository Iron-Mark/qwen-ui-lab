export const MAX_ANALYZE_REQUEST_BYTES: number;

export type AnalyzeRequestValidationError = {
  ok: false;
  status: number;
  code: string;
  message: string;
};

export type AnalyzeRequestData = {
  imageDataUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
};

export function validateAnalyzeContentLength(
  value: string | number | null | undefined,
): { ok: true } | AnalyzeRequestValidationError;

export function normalizeAnalyzeRequestBody(
  body: unknown,
): { ok: true; data: AnalyzeRequestData } | AnalyzeRequestValidationError;

export function estimateDataUrlBytes(dataUrl: string): number;
