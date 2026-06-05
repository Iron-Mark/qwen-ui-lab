/** Expected demo/offline paths — not reliability incidents. */
const NON_REPORTABLE_CODES = new Set([
  "missing_qwen_api_key",
  "live_analysis_disabled",
]);

/**
 * Whether an analyze outcome should be reported as an error (live/staging only).
 * @param {{ providerState?: string; instantDemo?: boolean; code?: string | null }} outcome
 */
export function isReportableAnalyzeFailure(outcome) {
  if (!outcome) return false;
  if (outcome.instantDemo) return false;
  if (outcome.providerState === "qwen") return false;
  if (outcome.code && NON_REPORTABLE_CODES.has(outcome.code)) return false;
  return outcome.providerState === "fallback" || outcome.code === "fetch_error";
}

/**
 * Build a privacy-safe Error for observability hooks.
 * @param {{ code?: string | null; detail?: string | null }} outcome
 */
export function buildAnalyzeFailureError(outcome) {
  const code = outcome?.code || "analyze_fallback";
  const error = new Error(`Analyze route failure (${code})`);
  error.name = "AnalyzeRouteError";
  return error;
}
