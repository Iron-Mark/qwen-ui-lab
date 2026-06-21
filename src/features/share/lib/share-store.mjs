/**
 * Short-ID share storage for read-only analysis summaries.
 *
 * Default: in-memory Map (per serverless instance, best-effort).
 * Production: wire Upstash/Vercel KV via REST env vars — see docs/ops/SHARE_LINKS.md.
 */

import { randomBytes } from "node:crypto";

import { buildShareableSummary } from "./share-result.mjs";

/** @typedef {import("./share-result.mjs").ShareableResultSummary} ShareableResultSummary */

const SHARE_ID_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const DEFAULT_SHARE_ID_LENGTH = 8;
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const KV_KEY_PREFIX = "share:";

const SHARE_STORE_KEY = Symbol.for("qwen-ui-lab.share-store");

/** @returns {Map<string, { payload: ShareableResultSummary; expiresAt: number }>} */
function getMemoryStore() {
  const globalStore = /** @type {typeof globalThis & Record<symbol, Map<string, unknown>>} */ (
    globalThis
  );
  if (!globalStore[SHARE_STORE_KEY]) {
    globalStore[SHARE_STORE_KEY] = new Map();
  }
  return /** @type {Map<string, { payload: ShareableResultSummary; expiresAt: number }>} */ (
    globalStore[SHARE_STORE_KEY]
  );
}

function parsePositiveInt(raw, fallback) {
  if (raw === undefined || raw === "") return fallback;
  const value = Number.parseInt(String(raw), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getShareStoreConfig(env = process.env) {
  return {
    idLength: parsePositiveInt(env.SHARE_ID_LENGTH, DEFAULT_SHARE_ID_LENGTH),
    ttlMs: parsePositiveInt(env.SHARE_TTL_MS, DEFAULT_TTL_MS),
    kvRestUrl: env.KV_REST_API_URL?.replace(/\/$/, "") ?? null,
    kvRestToken: env.KV_REST_API_TOKEN ?? null,
  };
}

export function isShareKvConfigured(env = process.env) {
  const { kvRestUrl, kvRestToken } = getShareStoreConfig(env);
  return Boolean(kvRestUrl && kvRestToken);
}

export function getShareStorageMode(env = process.env) {
  return isShareKvConfigured(env) ? "kv" : "memory";
}

/**
 * @param {number} length
 */
export function generateShareId(length = DEFAULT_SHARE_ID_LENGTH) {
  const bytes = randomBytes(length);
  let id = "";
  for (let index = 0; index < length; index += 1) {
    id += SHARE_ID_ALPHABET[bytes[index] % SHARE_ID_ALPHABET.length];
  }
  return id;
}

/**
 * @param {unknown} input
 * @returns {ShareableResultSummary | null}
 */
export function sanitizeSharePayload(input) {
  if (!input || typeof input !== "object") return null;
  const record = /** @type {Record<string, unknown>} */ (input);

  if (record.v === 1 && typeof record.summary === "string") {
    return buildShareableSummary({
      summary: record.summary,
      previewStats: Array.isArray(record.stats)
        ? record.stats.map((stat) => ({
            label: String(/** @type {{ l?: string }} */ (stat)?.l ?? ""),
            value: String(/** @type {{ v?: string }} */ (stat)?.v ?? ""),
          }))
        : [],
      modeLabel: String(record.mode ?? "Local demo mode"),
      file: String(record.file ?? "screenshot"),
      detections: record.detections,
    });
  }

  return buildShareableSummary(
    /** @type {Parameters<typeof buildShareableSummary>[0]} */ (input),
  );
}

function memoryGet(id) {
  const memoryStore = getMemoryStore();
  const entry = memoryStore.get(id);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    memoryStore.delete(id);
    return null;
  }
  return entry.payload;
}

function memorySet(id, payload, ttlMs) {
  getMemoryStore().set(id, {
    payload,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * @param {string} key
 * @param {NodeJS.ProcessEnv} env
 */
async function kvRequest(key, env, method = "GET", body) {
  const { kvRestUrl, kvRestToken } = getShareStoreConfig(env);
  if (!kvRestUrl || !kvRestToken) return null;

  const url =
    method === "GET"
      ? `${kvRestUrl}/get/${encodeURIComponent(key)}`
      : `${kvRestUrl}/set/${encodeURIComponent(key)}`;

  const response = await fetch(url, {
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

/**
 * @param {string} id
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {Promise<ShareableResultSummary | null>}
 */
export async function getShareRecord(id, env = process.env) {
  if (typeof id !== "string" || !/^[A-Za-z0-9]{6,16}$/.test(id)) {
    return null;
  }

  if (isShareKvConfigured(env)) {
    const result = await kvRequest(`${KV_KEY_PREFIX}${id}`, env, "GET");
    const raw = result?.result;
    if (typeof raw !== "string") return null;
    try {
      return sanitizeSharePayload(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  return memoryGet(id);
}

/**
 * @param {ShareableResultSummary} payload
 * @param {{ env?: NodeJS.ProcessEnv; now?: number }} [options]
 * @returns {Promise<{ id: string; storage: "kv" | "memory" } | null>}
 */
export async function createShareRecord(payload, options = {}) {
  const env = options.env ?? process.env;
  const { idLength, ttlMs } = getShareStoreConfig(env);
  const sanitized = sanitizeSharePayload(payload);
  if (!sanitized) return null;

  let id = generateShareId(idLength);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await getShareRecord(id, env);
    if (!existing) break;
    id = generateShareId(idLength);
  }

  if (isShareKvConfigured(env)) {
    const ttlSeconds = Math.max(60, Math.ceil(ttlMs / 1000));
    try {
      const saved = await kvRequest(`${KV_KEY_PREFIX}${id}`, env, "POST", {
        value: JSON.stringify(sanitized),
        ex: ttlSeconds,
      });
      if (saved?.result === "OK") {
        return { id, storage: "kv" };
      }
    } catch {
      // fall through to in-memory stub
    }
  }

  memorySet(id, sanitized, ttlMs);
  return { id, storage: "memory" };
}

export function resetShareStore() {
  getMemoryStore().clear();
}
