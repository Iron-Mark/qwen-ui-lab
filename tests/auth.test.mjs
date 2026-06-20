import test from "node:test";
import assert from "node:assert/strict";

import {
  AUTH_SESSION_KEY,
  GUEST_LABEL,
  clearAuthState,
  confirmMagicLinkStub,
  deriveDisplayNameFromEmail,
  getSavedByLabel,
  isSignedIn,
  isValidEmail,
  loadAuthState,
  normalizeDisplayName,
  requestMagicLink,
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

test("requestMagicLink stub stores pending email without signing in", () => {
  const storage = createMemoryStorage();
  const result = requestMagicLink("demo@example.com", storage);

  assert.equal(result.ok, true);
  assert.equal(result.state.mode, "magic-link-pending");
  assert.equal(result.state.email, "demo@example.com");
  assert.equal(isSignedIn(result.state), false);
});

test("requestMagicLink rejects invalid email", () => {
  const storage = createMemoryStorage();
  const result = requestMagicLink("not-an-email", storage);

  assert.equal(result.ok, false);
  assert.equal(result.error, "invalid_email");
  assert.deepEqual(loadAuthState(storage), { mode: "guest" });
});

test("confirmMagicLinkStub completes demo sign-in locally", () => {
  const storage = createMemoryStorage();
  requestMagicLink("meetup.user@example.com", storage);
  const signedIn = confirmMagicLinkStub(storage);

  assert.equal(signedIn.mode, "named");
  assert.equal(signedIn.displayName, "meetup.user");
  assert.equal(signedIn.email, "meetup.user@example.com");
  assert.equal(getSavedByLabel(signedIn), "meetup.user");
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

test("isValidEmail accepts common demo addresses", () => {
  assert.equal(isValidEmail("you@example.com"), true);
  assert.equal(isValidEmail("bad@"), false);
});

test("deriveDisplayNameFromEmail uses local part", () => {
  assert.equal(deriveDisplayNameFromEmail("demo.user@example.com"), "demo.user");
});

test("saveAuthState ignores malformed stored payloads", () => {
  const storage = createMemoryStorage();
  storage.setItem(AUTH_SESSION_KEY, '{"mode":"named"}');
  assert.deepEqual(loadAuthState(storage), { mode: "guest" });
});
