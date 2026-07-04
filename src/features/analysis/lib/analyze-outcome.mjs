import { buildUiFlowArtifact } from "./ui-flow.mjs";
import { REMOTE_ANALYSIS_COPY } from "./analysis-copy.mjs";

export const FALLBACK_BANNER_MISSING =
  "Analysis is ready.";

export const FALLBACK_BANNER_ERROR =
  "Analysis is ready.";

const SAMPLE_RUN_CODES = new Set([
  "missing_qwen_api_key",
  "live_analysis_disabled",
]);

const FALLBACK_REASONS = {
  missing_qwen_api_key: "Local analysis prepared the preview.",
  live_analysis_disabled:
    "Local analysis prepared the preview.",
  qwen_request_failed:
    "Local analysis prepared the preview while the remote vision service was not reachable.",
  qwen_network_error:
    "Local analysis prepared the preview after the remote vision service could not be reached.",
  invalid_qwen_json:
    "Local analysis prepared the preview after the remote vision service returned an unreadable response.",
  empty_qwen_response:
    "Local analysis prepared the preview after the remote vision service returned no content.",
  invalid_response:
    "Local analysis prepared the preview after the analysis response was unreadable.",
};

const TRANSIENT_CODES = new Set([
  "fetch_error",
  "qwen_network_error",
  "qwen_request_failed",
  "invalid_response",
  "empty_qwen_response",
  "invalid_qwen_json",
]);

/**
 * Map API error payloads to a short detail string for the fallback banner.
 * @param {unknown} payload
 * @returns {string}
 */
export function fallbackReasonFromPayload(payload) {
  if (payload?.code && FALLBACK_REASONS[payload.code]) {
    return FALLBACK_REASONS[payload.code];
  }
  return "Local analysis prepared the preview.";
}

function fallbackReasonFromFetchError(reason) {
  if (/read the uploaded image/i.test(String(reason))) {
    return "Local analysis prepared a preview after the uploaded image could not be read.";
  }
  return "Local analysis prepared the preview after the analysis request could not finish.";
}

/**
 * Resolve a /api/analyze-ui response (or fetch failure) into artifact + provider state.
 * @param {{
 *   file: {
 *     name: string;
 *     type: string;
 *     size: number;
 *     width?: number | null;
 *     height?: number | null;
 *     offlineInspection?: unknown;
 *     svgInspection?: unknown;
 *   };
 *   payload?: unknown;
 *   responseOk?: boolean;
 *   fetchError?: string;
 *   sampleRun?: boolean;
 * }} input
 */
export function resolveAnalyzeOutcome({
  file,
  payload,
  responseOk,
  fetchError,
  sampleRun = false,
}) {
  if (fetchError) {
    return {
      providerState: "fallback",
      artifact: buildUiFlowArtifact(file),
      message: FALLBACK_BANNER_ERROR,
      detail: fallbackReasonFromFetchError(fetchError),
      sampleRun: false,
      code: "fetch_error",
    };
  }

  if (responseOk && payload?.ok && payload?.artifact) {
    if (payload.sampleRun || payload.demo) {
      return {
        providerState: "fallback",
        artifact: payload.artifact,
        message: FALLBACK_BANNER_MISSING,
        detail: null,
        sampleRun: true,
        code: "live_analysis_disabled",
      };
    }

    return {
      providerState: "qwen",
      artifact: payload.artifact,
      message: REMOTE_ANALYSIS_COPY.complete,
      detail: null,
      sampleRun: false,
      code: null,
    };
  }

  const isMissing = SAMPLE_RUN_CODES.has(payload?.code);

  return {
    providerState: "fallback",
    artifact: buildUiFlowArtifact(file),
    message: isMissing ? FALLBACK_BANNER_MISSING : FALLBACK_BANNER_ERROR,
    detail: fallbackReasonFromPayload(payload),
    sampleRun: sampleRun || isMissing,
    code: payload?.code || null,
  };
}

const DEFAULT_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 800;

/**
 * Lightweight health check : skips /api/analyze-ui when live analysis is disabled.
 * @param {{ fetchFn?: typeof fetch; apiPath?: string }} [options]
 * @returns {Promise<{ hasApiKey: boolean; liveAnalysisEnabled: boolean; provider: string }>}
 */
export async function fetchAnalyzeHealth(
  { fetchFn = fetch, apiPath = "/api/health" } = {},
) {
  try {
    const response = await fetchFn(apiPath, { cache: "no-store" });
    if (!response.ok) {
      return { hasApiKey: false, liveAnalysisEnabled: false, provider: "demo" };
    }
    const payload = await response.json();
    const liveAnalysisEnabled = payload?.liveAnalysisEnabled === true;
    return {
      hasApiKey: Boolean(payload?.hasApiKey),
      liveAnalysisEnabled,
      provider: payload?.provider || "demo",
    };
  } catch {
    return { hasApiKey: false, liveAnalysisEnabled: false, provider: "demo" };
  }
}

function isTransientOutcome(outcome) {
  if (outcome.providerState === "qwen") return false;
  if (outcome.sampleRun) return false;
  const detail = outcome.detail || "";
  if (/timed out|Could not reach|network|non-JSON|gateway/i.test(detail)) {
    return true;
  }
  return TRANSIENT_CODES.has(outcome.code);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST uploaded image metadata to /api/analyze-ui with timeout, health skip, and one retry.
 * @param {{
 *   name: string;
 *   type: string;
 *   size: number;
 *   width?: number | null;
 *   height?: number | null;
 *   offlineInspection?: unknown;
 *   svgInspection?: unknown;
 * }} file
 * @param {string} imageDataUrl
 * @param {{
 *   fetchFn?: typeof fetch;
 *   timeoutMs?: number;
 *   apiPath?: string;
 *   healthPath?: string;
 *   onProgress?: (step: string) => void;
 *   skipHealthCheck?: boolean;
 * }} [options]
 */
export async function postAnalyzeUi(
  file,
  imageDataUrl,
  {
    fetchFn = fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    apiPath = "/api/analyze-ui",
    healthPath = "/api/health",
    onProgress,
    skipHealthCheck = false,
  } = {},
) {
  onProgress?.("Preparing analysis...");

  if (!skipHealthCheck) {
    const health = await fetchAnalyzeHealth({ fetchFn, apiPath: healthPath });
    if (!health.liveAnalysisEnabled) {
      onProgress?.("Preparing preview...");
      return resolveAnalyzeOutcome({
        file,
        responseOk: false,
        payload: {
          ok: false,
          code: health.hasApiKey
            ? "live_analysis_disabled"
            : "missing_qwen_api_key",
        },
        sampleRun: true,
      });
    }
  }

  onProgress?.("Analyzing screenshot...");

  let outcome = await postAnalyzeUiOnce(file, imageDataUrl, {
    fetchFn,
    timeoutMs,
    apiPath,
  });

  if (outcome.providerState === "fallback" && isTransientOutcome(outcome)) {
    onProgress?.("Retrying analysis...");
    await sleep(RETRY_DELAY_MS);
    outcome = await postAnalyzeUiOnce(file, imageDataUrl, {
      fetchFn,
      timeoutMs,
      apiPath,
    });
  }

  onProgress?.("Analysis complete");
  return outcome;
}

/**
 * @param {{
 *   name: string;
 *   type: string;
 *   size: number;
 *   width?: number | null;
 *   height?: number | null;
 *   offlineInspection?: unknown;
 *   svgInspection?: unknown;
 * }} file
 * @param {string} imageDataUrl
 * @param {{ fetchFn?: typeof fetch; timeoutMs?: number; apiPath?: string }} options
 */
async function postAnalyzeUiOnce(
  file,
  imageDataUrl,
  { fetchFn = fetch, timeoutMs = DEFAULT_TIMEOUT_MS, apiPath = "/api/analyze-ui" },
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(apiPath, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageDataUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        width: file.width,
        height: file.height,
      }),
      signal: controller.signal,
    });

    let payload;
    try {
      payload = await response.json();
    } catch {
      return resolveAnalyzeOutcome({
        file,
        responseOk: false,
        payload: {
          code: "invalid_response",
        },
      });
    }

    return resolveAnalyzeOutcome({
      file,
      responseOk: response.ok,
      payload,
    });
  } catch (error) {
    const detail =
      error?.name === "AbortError"
        ? "request_timeout"
        : "request_failed";
    return resolveAnalyzeOutcome({ file, fetchError: detail });
  } finally {
    clearTimeout(timer);
  }
}
