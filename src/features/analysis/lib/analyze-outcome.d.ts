export type AnalyzeProviderState = "fallback" | "qwen";

export interface AnalyzeOutcome {
  providerState: AnalyzeProviderState;
  artifact: unknown;
  message: string;
  detail: string | null;
  sampleRun?: boolean;
  code?: string | null;
}

export function fallbackReasonFromPayload(
  payload: { code?: string; message?: string } | null | undefined,
): string;

export function resolveAnalyzeOutcome(args: {
  file: {
    name: string;
    type: string;
    size: number;
    width?: number | null;
    height?: number | null;
  };
  payload?: {
    ok?: boolean;
    sampleRun?: boolean;
    demo?: boolean;
    artifact?: unknown;
    provider?: { model?: string };
    code?: string;
    message?: string;
  };
  responseOk?: boolean;
  fetchError?: string;
  sampleRun?: boolean;
}): AnalyzeOutcome;

export function fetchAnalyzeHealth(options?: {
  fetchFn?: typeof fetch;
  apiPath?: string;
}): Promise<{
  hasApiKey: boolean;
  liveAnalysisEnabled: boolean;
  provider: string;
}>;

export function postAnalyzeUi(
  file: {
    name: string;
    type: string;
    size: number;
    width?: number | null;
    height?: number | null;
  },
  imageDataUrl: string,
  options?: {
    fetchFn?: typeof fetch;
    timeoutMs?: number;
    apiPath?: string;
    healthPath?: string;
    onProgress?: (step: string) => void;
    skipHealthCheck?: boolean;
  },
): Promise<AnalyzeOutcome>;
