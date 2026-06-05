/**
 * Fixed-window rate limit for POST /api/analyze-ui (live mode only).
 *
 * Store: in-memory by default; optional Vercel KV / Upstash when KV_REST_API_* is set.
 * See docs/LIVE_QWEN_ROLLOUT.md.
 */

import {
  resolveAnalyzeUiRateLimitStore,
  resetDefaultMemoryRateLimitStore,
} from "./analyze-ui-rate-limit-store.mjs";

const DEFAULT_MAX_REQUESTS = 12;
const DEFAULT_WINDOW_MS = 60_000;

/**
 * @typedef {object} RateLimitCheckResult
 * @property {boolean} allowed
 * @property {number} limit
 * @property {number} windowMs
 * @property {number} [remaining]
 * @property {number} [resetAt]
 * @property {number} [retryAfterSec]
 */

function parsePositiveInt(raw, fallback) {
  if (raw === undefined || raw === "") return fallback;
  const value = Number.parseInt(String(raw), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getAnalyzeUiRateLimitConfig(env = process.env) {
  return {
    maxRequests: parsePositiveInt(
      env.ANALYZE_UI_RATE_LIMIT_MAX,
      DEFAULT_MAX_REQUESTS,
    ),
    windowMs: parsePositiveInt(
      env.ANALYZE_UI_RATE_LIMIT_WINDOW_MS,
      DEFAULT_WINDOW_MS,
    ),
  };
}

/**
 * @param {Request} request
 */
export function getRequestClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

/**
 * @param {{
 *   clientKey: string;
 *   now?: number;
 *   env?: NodeJS.ProcessEnv;
 *   store?: import("./analyze-ui-rate-limit-store.mjs").RateLimitStore;
 * }} options
 * @returns {Promise<RateLimitCheckResult>}
 */
export async function checkAnalyzeUiRateLimit({
  clientKey,
  now = Date.now(),
  env = process.env,
  store,
}) {
  const { maxRequests, windowMs } = getAnalyzeUiRateLimitConfig(env);
  const key = clientKey || "unknown";
  const activeStore = store ?? resolveAnalyzeUiRateLimitStore(env);

  return activeStore.consume({ key, maxRequests, windowMs, now });
}

/** @internal Test helper */
export function resetAnalyzeUiRateLimitStore() {
  resetDefaultMemoryRateLimitStore();
}
