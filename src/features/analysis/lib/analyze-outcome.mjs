import { buildUiFlowArtifact } from "./ui-flow.mjs";

export const FALLBACK_BANNER_MISSING =
  "Local analysis is ready. Provider settings are available in developer diagnostics.";

export const FALLBACK_BANNER_ERROR =
  "Local analysis is ready.";

const INSTANT_DEMO_CODES = new Set([
  "missing_qwen_api_key",
  "live_analysis_disabled",
]);

const FALLBACK_REASONS = {
  missing_qwen_api_key: "DASHSCOPE_API_KEY is not configured on the server.",
  live_analysis_disabled:
    "Live Qwen is disabled — set QWEN_LIVE_ANALYSIS=true to enable upstream vision calls.",
  qwen_request_failed: "Qwen request failed (check API key, QWEN_BASE_URL, or account access).",
  qwen_network_error: "Could not reach the Qwen API (network error or timeout).",
  invalid_qwen_json: "Qwen returned text that was not valid analysis JSON.",
  empty_qwen_response: "Qwen returned an empty analysis response.",
  invalid_response: "The analyze route returned a non-JSON response.",
};

const TRANSIENT_CODES = new Set([
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
  if (typeof payload?.message === "string" && payload.message.length > 0) {
    return payload.message;
  }
  return "Qwen analysis was unavailable.";
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
 *   instantDemo?: boolean;
 * }} input
 */
export function resolveAnalyzeOutcome({
  file,
  payload,
  responseOk,
  fetchError,
  instantDemo = false,
}) {
  if (fetchError) {
    return {
      providerState: "fallback",
      artifact: buildUiFlowArtifact(file),
      message: FALLBACK_BANNER_ERROR,
      detail: fetchError,
      instantDemo: false,
      code: "fetch_error",
    };
  }

  if (responseOk && payload?.ok && payload?.artifact) {
    if (payload.demo) {
      return {
        providerState: "fallback",
        artifact: payload.artifact,
        message: FALLBACK_BANNER_MISSING,
        detail: null,
        instantDemo: true,
        code: "live_analysis_disabled",
      };
    }

    return {
      providerState: "qwen",
      artifact: payload.artifact,
      message: `Qwen analysis complete with ${payload.provider?.model || "configured model"}.`,
      detail: null,
      instantDemo: false,
      code: null,
    };
  }

  const isMissing = INSTANT_DEMO_CODES.has(payload?.code);

  return {
    providerState: "fallback",
    artifact: buildUiFlowArtifact(file),
    message: isMissing ? FALLBACK_BANNER_MISSING : FALLBACK_BANNER_ERROR,
    detail: fallbackReasonFromPayload(payload),
    instantDemo: instantDemo || isMissing,
    code: payload?.code || null,
  };
}

const DEFAULT_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 800;

/**
 * Lightweight health check — skips /api/analyze-ui when live analysis is disabled.
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
  if (outcome.instantDemo) return false;
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
  onProgress?.("Checking provider…");

  if (!skipHealthCheck) {
    const health = await fetchAnalyzeHealth({ fetchFn, apiPath: healthPath });
    if (!health.liveAnalysisEnabled) {
      onProgress?.("Building local analysis…");
      return resolveAnalyzeOutcome({
        file,
        responseOk: false,
        payload: {
          ok: false,
          code: health.hasApiKey
            ? "live_analysis_disabled"
            : "missing_qwen_api_key",
        },
        instantDemo: true,
      });
    }
  }

  onProgress?.("Calling Qwen vision API…");

  let outcome = await postAnalyzeUiOnce(file, imageDataUrl, {
    fetchFn,
    timeoutMs,
    apiPath,
  });

  if (outcome.providerState === "fallback" && isTransientOutcome(outcome)) {
    onProgress?.("Retrying after transient error…");
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
          message: "Server response was not JSON.",
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
        ? "Request timed out after 30 seconds."
        : error?.message || "Request failed.";
    return resolveAnalyzeOutcome({ file, fetchError: detail });
  } finally {
    clearTimeout(timer);
  }
}
