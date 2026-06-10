/**
 * Pluggable fixed-window buckets for analyze-ui rate limiting.
 *
 * Default: in-memory Map (per serverless instance).
 * Optional: Vercel KV / Upstash Redis REST when KV_REST_API_* env vars are set.
 */

const KV_KEY_PREFIX = "analyze-ui-rl:";

/** @typedef {{ count: number; resetAt: number }} RateLimitBucket */

/**
 * @typedef {object} RateLimitCheckResult
 * @property {boolean} allowed
 * @property {number} limit
 * @property {number} windowMs
 * @property {number} [remaining]
 * @property {number} [resetAt]
 * @property {number} [retryAfterSec]
 */

/**
 * @typedef {object} RateLimitStore
 * @property {(args: {
 *   key: string;
 *   maxRequests: number;
 *   windowMs: number;
 *   now: number;
 * }) => Promise<RateLimitCheckResult>} consume
 * @property {() => void} [reset]
 */

/** @type {RateLimitStore | null} */
let defaultMemoryStore = null;

export function getRateLimitKvConfig(env = process.env) {
  return {
    kvRestUrl: env.KV_REST_API_URL?.replace(/\/$/, "") ?? null,
    kvRestToken: env.KV_REST_API_TOKEN ?? null,
  };
}

export function isRateLimitKvConfigured(env = process.env) {
  const { kvRestUrl, kvRestToken } = getRateLimitKvConfig(env);
  return Boolean(kvRestUrl && kvRestToken);
}

/**
 * @param {RateLimitBucket | null | undefined} existing
 * @param {{ maxRequests: number; windowMs: number; now: number }} options
 * @returns {RateLimitCheckResult & { entry: RateLimitBucket }}
 */
export function applyFixedWindowLimit(existing, { maxRequests, windowMs, now }) {
  let entry = existing;
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
  }

  entry = { ...entry, count: entry.count + 1 };

  if (entry.count > maxRequests) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      limit: maxRequests,
      windowMs,
      entry,
    };
  }

  return {
    allowed: true,
    limit: maxRequests,
    windowMs,
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: entry.resetAt,
    entry,
  };
}

/**
 * @param {string} raw
 * @returns {RateLimitBucket | null}
 */
function parseBucket(raw) {
  if (typeof raw !== "string" || raw.length === 0) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.count !== "number" ||
      typeof parsed.resetAt !== "number"
    ) {
      return null;
    }
    return { count: parsed.count, resetAt: parsed.resetAt };
  } catch {
    return null;
  }
}

/**
 * @param {RateLimitCheckResult & { entry: RateLimitBucket }} result
 * @returns {RateLimitCheckResult}
 */
function omitInternalEntry(result) {
  const check = { ...result };
  delete check.entry;
  return check;
}

/**
 * @returns {RateLimitStore}
 */
export function createMemoryRateLimitStore() {
  /** @type {Map<string, RateLimitBucket>} */
  const buckets = new Map();

  return {
    async consume({ key, maxRequests, windowMs, now }) {
      const result = applyFixedWindowLimit(buckets.get(key), {
        maxRequests,
        windowMs,
        now,
      });
      buckets.set(key, result.entry);
      return omitInternalEntry(result);
    },
    reset() {
      buckets.clear();
    },
  };
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @param {typeof fetch} [fetchFn]
 * @returns {RateLimitStore}
 */
export function createKvRateLimitStore(env = process.env, fetchFn = fetch) {
  const { kvRestUrl, kvRestToken } = getRateLimitKvConfig(env);

  if (!kvRestUrl || !kvRestToken) {
    throw new Error("KV REST env vars are required for createKvRateLimitStore");
  }

  /**
   * @param {string} storageKey
   * @param {"GET" | "POST"} method
   * @param {unknown} [body]
   */
  async function kvRequest(storageKey, method = "GET", body) {
    const url =
      method === "GET"
        ? `${kvRestUrl}/get/${encodeURIComponent(storageKey)}`
        : `${kvRestUrl}/set/${encodeURIComponent(storageKey)}`;

    const response = await fetchFn(url, {
      method,
      headers: {
        Authorization: `Bearer ${kvRestToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) return null;
    return response.json();
  }

  return {
    async consume({ key, maxRequests, windowMs, now }) {
      const storageKey = `${KV_KEY_PREFIX}${key}`;
      const existingResult = await kvRequest(storageKey, "GET");
      const existing = parseBucket(existingResult?.result);
      const result = applyFixedWindowLimit(existing, {
        maxRequests,
        windowMs,
        now,
      });

      const ttlSeconds = Math.max(
        1,
        Math.ceil((result.entry.resetAt - now) / 1000),
      );
      const saved = await kvRequest(storageKey, "POST", {
        value: JSON.stringify(result.entry),
        ex: ttlSeconds,
      });

      if (!saved || saved.result !== "OK") {
        return getDefaultMemoryStore().consume({
          key,
          maxRequests,
          windowMs,
          now,
        });
      }

      return omitInternalEntry(result);
    },
  };
}

function getDefaultMemoryStore() {
  if (!defaultMemoryStore) {
    defaultMemoryStore = createMemoryRateLimitStore();
  }
  return defaultMemoryStore;
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {RateLimitStore}
 */
export function resolveAnalyzeUiRateLimitStore(env = process.env) {
  if (isRateLimitKvConfigured(env)) {
    return createKvRateLimitStore(env);
  }
  return getDefaultMemoryStore();
}

/** @internal Test helper */
export function resetDefaultMemoryRateLimitStore() {
  if (defaultMemoryStore?.reset) {
    defaultMemoryStore.reset();
  }
}
