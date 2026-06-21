/** @typedef {{ eventName: string; metadata: Record<string, unknown>; recordedAt?: string }} AnalyticsBufferRecord */

export const ANALYTICS_BUFFER_STORAGE_KEY = "qwen-ui-lab:analytics-events";
export const ANALYTICS_BUFFER_MAX_EVENTS = 200;

function nowIso() {
  try {
    return new Date().toISOString();
  } catch {
    return "unknown";
  }
}

/**
 * @param {Storage | null | undefined} storage
 * @returns {AnalyticsBufferRecord[]}
 */
export function readAnalyticsBuffer(storage) {
  if (!storage) return [];
  try {
    const raw = storage.getItem(ANALYTICS_BUFFER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.eventName === "string" &&
        item.metadata &&
        typeof item.metadata === "object",
    );
  } catch {
    return [];
  }
}

/**
 * @param {Storage | null | undefined} storage
 * @param {{ eventName: string; metadata: Record<string, unknown> }} payload
 */
export function appendAnalyticsBuffer(storage, payload) {
  if (!storage || !payload?.eventName) return;
  const entry = {
    eventName: String(payload.eventName).slice(0, 80),
    metadata: payload.metadata ?? {},
    recordedAt: nowIso(),
  };

  const existing = readAnalyticsBuffer(storage);
  const next = [...existing, entry].slice(-ANALYTICS_BUFFER_MAX_EVENTS);

  try {
    storage.setItem(ANALYTICS_BUFFER_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota or private mode: ignore silently.
  }
}

/**
 * @param {Storage | null | undefined} storage
 */
export function clearAnalyticsBuffer(storage) {
  if (!storage) return;
  try {
    storage.removeItem(ANALYTICS_BUFFER_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * @param {AnalyticsBufferRecord[]} events
 */
export function countEventsByName(events) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const event of events) {
    counts[event.eventName] = (counts[event.eventName] ?? 0) + 1;
  }
  return counts;
}
