/** @typedef {{ x: number; y: number; width: number; height: number }} ShareDetectionBox */
/** @typedef {{ id: string; kind: string; primitive: string; confidence: number; included: boolean; userEdited: boolean; box: ShareDetectionBox }} ShareDetectionElement */
/** @typedef {{ source: { width: number; height: number }; designTokens: Record<string, string>; quality: { confidence: number | null; ambiguity: string; strategy: string; elementCount: number }; elements: ShareDetectionElement[] }} ShareDetectionPayload */
/** @typedef {{ v: 1; summary: string; stats: Array<{ l: string; v: string }>; mode: string; file: string; detections?: ShareDetectionPayload }} ShareableResultSummary */

import { normalizeReviewStatusLabel } from "../../../lib/product-labels.mjs";
import { redactSensitiveText } from "../../../lib/privacy-redaction.mjs";

export const SHARE_HASH_PREFIX = "share=";
export const SHARE_SESSION_KEY = "qwen-ui-lab:last-share";
const MAX_SUMMARY_CHARS = 480;
const MAX_STATS = 6;
const MAX_DETECTION_ELEMENTS = 24;

function truncate(input, max) {
  if (typeof input !== "string") return "";
  const trimmed = redactSensitiveText(input).trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3)}...`;
}

/**
 * Build a read-only, secret-free payload from an analyze artifact.
 * @param {{ summary?: string; previewStats?: Array<{ label: string; value: string }>; modeLabel?: string; file?: { name?: string } | string; detections?: unknown }} artifact
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

  const detectionSummary = sanitizeShareDetections(artifact.detections);

  return {
    v: 1,
    summary,
    stats,
    mode: normalizeShareModeLabel(artifact.modeLabel),
    file: truncate(fileName, 80),
    ...(detectionSummary ? { detections: detectionSummary } : {}),
  };
}

function sanitizeShareDetections(detections) {
  if (!detections || typeof detections !== "object" || !Array.isArray(detections.elements)) {
    return null;
  }

  const source = {
    width: clampShareNumber(detections.source?.width, 1, 10000, 1440),
    height: clampShareNumber(detections.source?.height, 1, 10000, 900),
  };
  const elements = detections.elements
    .slice(0, MAX_DETECTION_ELEMENTS)
    .map((element, index) => sanitizeShareDetectionElement(element, index, source))
    .filter(Boolean);
  if (!elements.length) return null;

  return {
    source,
    designTokens: sanitizeShareDesignTokens(detections.designTokens),
    quality: {
      confidence:
        typeof detections.quality?.confidence === "number"
          ? clampShareNumber(detections.quality.confidence, 0, 1, 0)
          : null,
      ambiguity: truncate(String(detections.quality?.ambiguity ?? "unknown"), 24),
      strategy: truncate(String(detections.quality?.strategy ?? "local"), 48),
      elementCount: clampShareNumber(
        detections.quality?.elementCount ?? elements.length,
        0,
        MAX_DETECTION_ELEMENTS,
        elements.length,
      ),
    },
    elements,
  };
}

function sanitizeShareDetectionElement(element, index, source) {
  if (!element || typeof element !== "object") return null;
  const box = sanitizeShareBox(element.box, source);
  if (!box) return null;

  return {
    id: truncate(String(element.id ?? `element-${index + 1}`), 40),
    kind: truncate(String(element.kind ?? "content-block"), 40),
    primitive: truncate(String(element.primitive ?? element.kind ?? "section"), 40),
    confidence: clampShareNumber(element.confidence, 0, 1, 0.5),
    included: element.included !== false,
    userEdited: Boolean(element.userEdited),
    box,
  };
}

function sanitizeShareBox(box, source) {
  if (!box || typeof box !== "object") return null;
  const width = clampShareNumber(box.width, 1, source.width, 1);
  const height = clampShareNumber(box.height, 1, source.height, 1);
  return {
    x: clampShareNumber(box.x, 0, source.width - width, 0),
    y: clampShareNumber(box.y, 0, source.height - height, 0),
    width,
    height,
  };
}

function sanitizeShareDesignTokens(tokens) {
  const safeTokens = {};
  for (const key of ["surface", "foreground", "accent", "accentForeground", "muted", "border"]) {
    const value = typeof tokens?.[key] === "string" ? tokens[key] : "";
    if (/^#[0-9a-f]{6}$/i.test(value)) {
      safeTokens[key] = value;
    }
  }
  return safeTokens;
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
      mode: normalizeShareModeLabel(parsed.mode),
      file: truncate(String(parsed.file ?? "screenshot"), 80),
      ...(sanitizeShareDetections(parsed.detections)
        ? { detections: sanitizeShareDetections(parsed.detections) }
        : {}),
    };
  } catch {
    return null;
  }
}

export function normalizeShareModeLabel(value) {
  return normalizeReviewStatusLabel(value);
}

function clampShareNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return Math.max(min, Math.min(max, fallback));
  }
  return Math.max(min, Math.min(max, parsed || fallback));
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
 * @param {string} origin
 * @param {string} id
 */
export function buildShortShareUrl(origin, id) {
  const base = origin.replace(/\/$/, "");
  const safeId = encodeURIComponent(id);
  return `${base}/share/${safeId}`;
}

/**
 * @param {string} id
 */
export function buildShortSharePath(id) {
  return `/share/${encodeURIComponent(id)}`;
}

/**
 * @param {string} origin
 * @param {ShareableResultSummary} payload
 */
export async function createShortShareLink(origin, payload) {
  const response = await fetch(`${origin.replace(/\/$/, "")}/api/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (!data?.ok || typeof data.id !== "string") return null;

  return {
    id: data.id,
    url: typeof data.url === "string" ? data.url : buildShortShareUrl(origin, data.id),
    storage: data.storage === "kv" ? "kv" : "memory",
    durable: data.durable === true,
    warning: typeof data.warning === "string" ? data.warning : null,
  };
}
