/** @typedef {{ v: 1; summary: string; stats: Array<{ l: string; v: string }>; mode: string; file: string }} ShareableResultSummary */

export const SHARE_HASH_PREFIX = "share=";
export const SHARE_SESSION_KEY = "qwen-ui-lab:last-share";
const MAX_SUMMARY_CHARS = 480;
const MAX_STATS = 6;

function truncate(input, max) {
  if (typeof input !== "string") return "";
  const trimmed = input.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/**
 * Build a read-only, secret-free payload from an analyze artifact.
 * @param {{ summary?: string; previewStats?: Array<{ label: string; value: string }>; modeLabel?: string; file?: { name?: string } | string }} artifact
 * @returns {ShareableResultSummary | null}
 */
export function buildShareableSummary(artifact) {
  if (!artifact || typeof artifact !== "object") return null;

  const summary = truncate(artifact.summary ?? "", MAX_SUMMARY_CHARS);
  if (!summary) return null;

  const fileName =
    typeof artifact.file === "string"
      ? artifact.file
      : typeof artifact.file?.name === "string"
        ? artifact.file.name
        : "screenshot";

  const stats = Array.isArray(artifact.previewStats)
    ? artifact.previewStats
        .slice(0, MAX_STATS)
        .map((stat) => ({
          l: truncate(String(stat?.label ?? ""), 40),
          v: truncate(String(stat?.value ?? ""), 24),
        }))
        .filter((stat) => stat.l && stat.v)
    : [];

  return {
    v: 1,
    summary,
    stats,
    mode: truncate(String(artifact.modeLabel ?? "Local demo mode"), 60),
    file: truncate(fileName, 80),
  };
}

function toBase64Url(value) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(encoded) {
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  if (typeof Buffer !== "undefined") {
    return Buffer.from(normalized + padding, "base64").toString("utf8");
  }

  const binary = atob(normalized + padding);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * @param {ShareableResultSummary} payload
 */
export function encodeShareHash(payload) {
  return `${SHARE_HASH_PREFIX}${toBase64Url(JSON.stringify(payload))}`;
}

/**
 * @param {string} hash
 * @returns {ShareableResultSummary | null}
 */
export function decodeShareHash(hash) {
  if (typeof hash !== "string" || !hash) return null;
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw.startsWith(SHARE_HASH_PREFIX)) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(raw.slice(SHARE_HASH_PREFIX.length)));
    if (parsed?.v !== 1 || typeof parsed.summary !== "string") return null;
    if (!Array.isArray(parsed.stats)) return null;
    return {
      v: 1,
      summary: truncate(parsed.summary, MAX_SUMMARY_CHARS),
      stats: parsed.stats
        .slice(0, MAX_STATS)
        .map((stat) => ({
          l: truncate(String(stat?.l ?? ""), 40),
          v: truncate(String(stat?.v ?? ""), 24),
        }))
        .filter((stat) => stat.l && stat.v),
      mode: truncate(String(parsed.mode ?? "Local demo mode"), 60),
      file: truncate(String(parsed.file ?? "screenshot"), 80),
    };
  } catch {
    return null;
  }
}

/**
 * @param {string} origin
 * @param {string} pathname
 * @param {ShareableResultSummary} payload
 */
export function buildShareUrl(origin, pathname, payload) {
  const base = `${origin.replace(/\/$/, "")}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  return `${base}#${encodeShareHash(payload)}`;
}

/**
 * @param {ShareableResultSummary} payload
 */
export function persistShareSummary(payload) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SHARE_SESSION_KEY, JSON.stringify(payload));
  } catch {
    // quota / private mode
  }
}

/**
 * @returns {ShareableResultSummary | null}
 */
export function readShareFromSession() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SHARE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return buildShareableSummary({
      summary: parsed?.summary,
      previewStats: Array.isArray(parsed?.stats)
        ? parsed.stats.map((stat) => ({ label: stat.l, value: stat.v }))
        : [],
      modeLabel: parsed?.mode,
      file: parsed?.file,
    });
  } catch {
    return null;
  }
}

/**
 * @param {string} [hash]
 */
export function readShareFromLocation(hash) {
  if (typeof hash === "string") {
    return decodeShareHash(hash);
  }
  if (typeof window === "undefined") return null;
  return decodeShareHash(window.location.hash);
}
