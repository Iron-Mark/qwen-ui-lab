import * as runtime from "./analytics-event-buffer.mjs";

type BufferRecord = {
  eventName: string;
  metadata: Record<string, unknown>;
  recordedAt?: string;
};

const runtimeModule = runtime as {
  ANALYTICS_BUFFER_STORAGE_KEY: string;
  ANALYTICS_BUFFER_MAX_EVENTS: number;
  readAnalyticsBuffer: (storage: Storage | null | undefined) => BufferRecord[];
  appendAnalyticsBuffer: (
    storage: Storage | null | undefined,
    payload: { eventName: string; metadata: Record<string, unknown> },
  ) => void;
  clearAnalyticsBuffer: (storage: Storage | null | undefined) => void;
  countEventsByName: (events: BufferRecord[]) => Record<string, number>;
};

export const ANALYTICS_BUFFER_STORAGE_KEY = runtimeModule.ANALYTICS_BUFFER_STORAGE_KEY;
export const ANALYTICS_BUFFER_MAX_EVENTS = runtimeModule.ANALYTICS_BUFFER_MAX_EVENTS;

export type AnalyticsBufferRecord = BufferRecord;

export function readClientAnalyticsBuffer(): AnalyticsBufferRecord[] {
  if (typeof window === "undefined") return [];
  return runtimeModule.readAnalyticsBuffer(window.localStorage);
}

const ANALYTICS_BUFFER_CHANGED_EVENT = "qwen-ui-lab:analytics-buffer-changed";

export function appendClientAnalyticsBuffer(payload: {
  eventName: string;
  metadata: Record<string, unknown>;
}): void {
  if (typeof window === "undefined") return;
  runtimeModule.appendAnalyticsBuffer(window.localStorage, payload);
  window.dispatchEvent(new Event(ANALYTICS_BUFFER_CHANGED_EVENT));
}

export function subscribeClientAnalyticsBuffer(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onChanged = () => onStoreChange();
  const onStorage = (event: StorageEvent) => {
    if (event.key === ANALYTICS_BUFFER_STORAGE_KEY) onStoreChange();
  };

  window.addEventListener(ANALYTICS_BUFFER_CHANGED_EVENT, onChanged);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(ANALYTICS_BUFFER_CHANGED_EVENT, onChanged);
    window.removeEventListener("storage", onStorage);
  };
}

export function clearClientAnalyticsBuffer(): void {
  if (typeof window === "undefined") return;
  runtimeModule.clearAnalyticsBuffer(window.localStorage);
  window.dispatchEvent(new Event(ANALYTICS_BUFFER_CHANGED_EVENT));
}

export function countClientEventsByName(events: AnalyticsBufferRecord[]): Record<string, number> {
  return runtimeModule.countEventsByName(events);
}
