import test from "node:test";
import assert from "node:assert/strict";

import {
  AUTH_SESSION_KEY,
  GUEST_LABEL,
  clearAuthState,
  confirmContactLabel,
  deriveDisplayNameFromEmail,
  getSavedByLabel,
  isSignedIn,
  isValidEmail,
  loadAuthState,
  normalizeDisplayName,
  requestContactLabel,
  setDisplayName,
} from "../src/features/account/lib/auth.mjs";

function createMemoryStorage() {
  /** @type {Map<string, string>} */
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

test("loadAuthState defaults to guest when storage is empty", () => {
  const storage = createMemoryStorage();
  assert.deepEqual(loadAuthState(storage), { mode: "guest" });
});

test("setDisplayName persists named session in storage", () => {
  const storage = createMemoryStorage();
  const state = setDisplayName("Alex", storage);

  assert.equal(state.mode, "named");
  assert.equal(state.displayName, "Alex");
  assert.equal(isSignedIn(state), true);
  assert.equal(getSavedByLabel(state), "Alex");
  assert.match(storage.getItem(AUTH_SESSION_KEY), /Alex/);
});

test("empty display name clears auth back to guest", () => {
  const storage = createMemoryStorage();
  setDisplayName("Alex", storage);
  const cleared = setDisplayName("   ", storage);

  assert.deepEqual(cleared, { mode: "guest" });
  assert.equal(storage.getItem(AUTH_SESSION_KEY), null);
});

test("requestContactLabel stores a pending contact label without signing in", () => {
  const storage = createMemoryStorage();
  const result = requestContactLabel("reviewer@example.com", storage);

  assert.equal(result.ok, true);
  assert.equal(result.state.mode, "contact-label-pending");
  assert.equal(result.state.email, "reviewer@example.com");
  assert.equal(isSignedIn(result.state), false);
});

test("requestContactLabel rejects invalid email", () => {
  const storage = createMemoryStorage();
  const result = requestContactLabel("not-an-email", storage);

  assert.equal(result.ok, false);
  assert.equal(result.error, "invalid_email");
  assert.deepEqual(loadAuthState(storage), { mode: "guest" });
});

test("confirmContactLabel completes contact-label sign-in locally", () => {
  const storage = createMemoryStorage();
  requestContactLabel("reviewer@example.com", storage);
  const signedIn = confirmContactLabel(storage);

  assert.equal(signedIn.mode, "named");
  assert.equal(signedIn.displayName, "reviewer");
  assert.equal(signedIn.email, "reviewer@example.com");
  assert.equal(getSavedByLabel(signedIn), "reviewer");
});

test("loadAuthState accepts legacy pending contact-label sessions", () => {
  const storage = createMemoryStorage();
  storage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({ mode: "magic-link-pending", email: "legacy.label@example.com" }),
  );

  const pending = loadAuthState(storage);
  assert.equal(pending.mode, "contact-label-pending");
  assert.equal(pending.email, "legacy.label@example.com");

  const signedIn = confirmContactLabel(storage);

  assert.equal(signedIn.mode, "named");
  assert.equal(signedIn.displayName, "legacy.label");
  assert.equal(signedIn.email, "legacy.label@example.com");
});

test("clearAuthState removes persisted auth", () => {
  const storage = createMemoryStorage();
  setDisplayName("Alex", storage);
  clearAuthState(storage);

  assert.deepEqual(loadAuthState(storage), { mode: "guest" });
  assert.equal(getSavedByLabel(), GUEST_LABEL);
});

test("normalizeDisplayName trims and caps length", () => {
  assert.equal(normalizeDisplayName("  Alex  "), "Alex");
  assert.equal(normalizeDisplayName("a".repeat(80))?.length, 64);
  assert.equal(normalizeDisplayName(""), null);
});

test("isValidEmail accepts common contact-label addresses", () => {
  assert.equal(isValidEmail("you@example.com"), true);
  assert.equal(isValidEmail("bad@"), false);
});

test("deriveDisplayNameFromEmail uses local part", () => {
  assert.equal(deriveDisplayNameFromEmail("reviewer.user@example.com"), "reviewer.user");
});

test("saveAuthState ignores malformed stored payloads", () => {
  const storage = createMemoryStorage();
  storage.setItem(AUTH_SESSION_KEY, '{"mode":"named"}');
  assert.deepEqual(loadAuthState(storage), { mode: "guest" });
});
