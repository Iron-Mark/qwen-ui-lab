export type AnalyzeProviderState = "fallback" | "qwen";

export interface AnalyzeOutcome {
  providerState: AnalyzeProviderState;
  artifact: unknown;
  message: string;
  detail: string | null;
}

export function fallbackReasonFromPayload(
  payload: { code?: string; message?: string } | null | undefined,
): string;

export function resolveAnalyzeOutcome(args: {
  file: File;
  payload?: { ok?: boolean; artifact?: unknown; provider?: { model?: string }; code?: string; message?: string };
  responseOk?: boolean;
  fetchError?: string;
}): AnalyzeOutcome;

export function postAnalyzeUi(
  file: File,
  imageDataUrl: string,
  options?: {
    fetchFn?: typeof fetch;
    timeoutMs?: number;
    apiPath?: string;
  },
): Promise<AnalyzeOutcome>;
