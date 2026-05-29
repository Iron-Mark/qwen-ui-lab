import { buildUiFlowArtifact } from "./ui-flow.mjs";

export const FALLBACK_BANNER =
  "No API key detected — running offline demo analysis. Add DASHSCOPE_API_KEY to .env.local for live Qwen vision.";

const FALLBACK_REASONS = {
  missing_qwen_api_key: "DASHSCOPE_API_KEY is not configured on the server.",
  qwen_request_failed: "Qwen request failed (check API key, QWEN_BASE_URL, or account access).",
  qwen_network_error: "Could not reach the Qwen API (network error or timeout).",
  invalid_qwen_json: "Qwen returned text that was not valid analysis JSON.",
  empty_qwen_response: "Qwen returned an empty analysis response.",
  invalid_response: "The analyze route returned a non-JSON response.",
};

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
 *   file: { name: string; type: string; size: number };
 *   payload?: unknown;
 *   responseOk?: boolean;
 *   fetchError?: string;
 * }} input
 * @returns {{
 *   providerState: "qwen" | "fallback";
 *   artifact: ReturnType<typeof buildUiFlowArtifact>;
 *   message: string;
 *   detail: string | null;
 * }}
 */
export function resolveAnalyzeOutcome({ file, payload, responseOk, fetchError }) {
  if (fetchError) {
    return {
      providerState: "fallback",
      artifact: buildUiFlowArtifact(file),
      message: FALLBACK_BANNER,
      detail: fetchError,
    };
  }

  if (responseOk && payload?.ok && payload?.artifact) {
    return {
      providerState: "qwen",
      artifact: payload.artifact,
      message: `Qwen analysis complete with ${payload.provider?.model || "configured model"}.`,
      detail: null,
    };
  }

  return {
    providerState: "fallback",
    artifact: buildUiFlowArtifact(file),
    message: FALLBACK_BANNER,
    detail: fallbackReasonFromPayload(payload),
  };
}

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * POST uploaded image metadata to /api/analyze-ui with timeout and JSON safety.
 * @param {{ name: string; type: string; size: number }} file
 * @param {string} imageDataUrl
 * @param {{
 *   fetchFn?: typeof fetch;
 *   timeoutMs?: number;
 *   apiPath?: string;
 * }} [options]
 */
export async function postAnalyzeUi(
  file,
  imageDataUrl,
  { fetchFn = fetch, timeoutMs = DEFAULT_TIMEOUT_MS, apiPath = "/api/analyze-ui" } = {},
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
