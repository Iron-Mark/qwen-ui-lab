/**
 * In-memory fixed-window rate limit for POST /api/analyze-ui (live mode only).
 *
 * Serverless note: each warm instance keeps its own bucket map. Limits are
 * best-effort per instance, not a global cluster cap. Tune via env vars.
 */

const DEFAULT_MAX_REQUESTS = 12;
const DEFAULT_WINDOW_MS = 60_000;

/** @type {Map<string, { count: number; resetAt: number }>} */
const buckets = new Map();

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
 * @param {{ clientKey: string; now?: number; env?: NodeJS.ProcessEnv }} options
 */
export function checkAnalyzeUiRateLimit({
  clientKey,
  now = Date.now(),
  env = process.env,
}) {
  const { maxRequests, windowMs } = getAnalyzeUiRateLimitConfig(env);
  const key = clientKey || "unknown";

  let entry = buckets.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    buckets.set(key, entry);
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return {
      allowed: false,
      retryAfterSec,
      limit: maxRequests,
      windowMs,
    };
  }

  return {
    allowed: true,
    limit: maxRequests,
    windowMs,
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}

/** @internal Test helper */
export function resetAnalyzeUiRateLimitStore() {
  buckets.clear();
}
