import test from "node:test";
import assert from "node:assert/strict";

import {
  ANALYTICS_BUFFER_MAX_EVENTS,
  appendAnalyticsBuffer,
  clearAnalyticsBuffer,
  countEventsByName,
  readAnalyticsBuffer,
} from "../src/features/analytics/lib/analytics-event-buffer.mjs";

function createMemoryStorage() {
  /** @type {Map<string, string>} */
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, value);
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

test("analytics buffer appends and trims to max events", () => {
  const storage = createMemoryStorage();

  for (let i = 0; i < ANALYTICS_BUFFER_MAX_EVENTS + 5; i += 1) {
    appendAnalyticsBuffer(storage, {
      eventName: "upload.selected",
      metadata: { source: `event-${i}` },
    });
  }

  const events = readAnalyticsBuffer(storage);
  assert.equal(events.length, ANALYTICS_BUFFER_MAX_EVENTS);
  assert.equal(events[0]?.metadata?.source, "event-5");
  assert.equal(events.at(-1)?.metadata?.source, `event-${ANALYTICS_BUFFER_MAX_EVENTS + 4}`);
});

test("analytics buffer counts events by name", () => {
  const storage = createMemoryStorage();
  appendAnalyticsBuffer(storage, { eventName: "analysis.started", metadata: {} });
  appendAnalyticsBuffer(storage, { eventName: "analysis.completed", metadata: {} });
  appendAnalyticsBuffer(storage, { eventName: "analysis.completed", metadata: {} });

  const counts = countEventsByName(readAnalyticsBuffer(storage));
  assert.deepEqual(counts, {
    "analysis.started": 1,
    "analysis.completed": 2,
  });
});

test("clearAnalyticsBuffer removes stored events", () => {
  const storage = createMemoryStorage();
  appendAnalyticsBuffer(storage, { eventName: "export.triggered", metadata: { trigger: "copy" } });
  clearAnalyticsBuffer(storage);
  assert.deepEqual(readAnalyticsBuffer(storage), []);
});
