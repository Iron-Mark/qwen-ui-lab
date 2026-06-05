/**
 * Demo-safe local auth — guest mode by default, optional display name or
 * magic-link stub stored in sessionStorage only (no OAuth, no real email).
 */

export const AUTH_SESSION_KEY = "qwen-ui-lab:auth";
export const GUEST_LABEL = "Guest";

/** @typedef {"guest" | "named" | "magic-link-pending"} AuthMode */

/**
 * @typedef {object} AuthState
 * @property {AuthMode} mode
 * @property {string} [displayName]
 * @property {string} [email]
 */

/** @param {string | null | undefined} value */
export function normalizeDisplayName(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 64);
}

/** @param {string | null | undefined} value */
export function isValidEmail(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/** @param {string} email */
export function deriveDisplayNameFromEmail(email) {
  const localPart = email.split("@")[0]?.trim();
  return normalizeDisplayName(localPart) ?? GUEST_LABEL;
}

/**
 * @param {Storage | null | undefined} [storage]
 * @returns {AuthState}
 */
export function loadAuthState(storage = getSessionStorage()) {
  if (!storage) return { mode: "guest" };
  try {
    const raw = storage.getItem(AUTH_SESSION_KEY);
    if (!raw) return { mode: "guest" };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { mode: "guest" };
    const mode = parsed.mode;
    if (mode !== "guest" && mode !== "named" && mode !== "magic-link-pending") {
      return { mode: "guest" };
    }
    const displayName = normalizeDisplayName(parsed.displayName);
    const email =
      typeof parsed.email === "string" && isValidEmail(parsed.email)
        ? parsed.email.trim().toLowerCase()
        : undefined;
    if (mode === "named" && !displayName) return { mode: "guest" };
    if (mode === "magic-link-pending" && !email) return { mode: "guest" };
    return {
      mode,
      ...(displayName ? { displayName } : {}),
      ...(email ? { email } : {}),
    };
  } catch {
    return { mode: "guest" };
  }
}

/**
 * @param {AuthState} state
 * @param {Storage | null | undefined} [storage]
 */
export function saveAuthState(state, storage = getSessionStorage()) {
  if (!storage) return state;
  try {
    if (state.mode === "guest") {
      storage.removeItem(AUTH_SESSION_KEY);
      return { mode: "guest" };
    }
    storage.setItem(AUTH_SESSION_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage may be unavailable
  }
  return state;
}

/** @param {Storage | null | undefined} [storage] */
export function clearAuthState(storage = getSessionStorage()) {
  return saveAuthState({ mode: "guest" }, storage);
}

/**
 * @param {string} name
 * @param {Storage | null | undefined} [storage]
 * @returns {AuthState}
 */
export function setDisplayName(name, storage = getSessionStorage()) {
  const displayName = normalizeDisplayName(name);
  if (!displayName) {
    return clearAuthState(storage);
  }
  return saveAuthState({ mode: "named", displayName }, storage);
}

/**
 * Demo stub — records pending email locally; no network or outbound mail.
 * @param {string} email
 * @param {Storage | null | undefined} [storage]
 * @returns {{ ok: true, state: AuthState } | { ok: false, error: string }}
 */
export function requestMagicLink(email, storage = getSessionStorage()) {
  const normalized = String(email ?? "").trim().toLowerCase();
  if (!isValidEmail(normalized)) {
    return { ok: false, error: "invalid_email" };
  }
  const state = saveAuthState(
    { mode: "magic-link-pending", email: normalized },
    storage,
  );
  return { ok: true, state };
}

/**
 * Completes the demo magic-link flow without verifying a token.
 * @param {Storage | null | undefined} [storage]
 * @returns {AuthState}
 */
export function confirmMagicLinkStub(storage = getSessionStorage()) {
  const current = loadAuthState(storage);
  if (current.mode !== "magic-link-pending" || !current.email) {
    return current;
  }
  const displayName = deriveDisplayNameFromEmail(current.email);
  return saveAuthState(
    { mode: "named", displayName, email: current.email },
    storage,
  );
}

/** @param {AuthState} [state] */
export function getSavedByLabel(state = loadAuthState()) {
  if (state.mode === "guest") return GUEST_LABEL;
  return state.displayName ?? GUEST_LABEL;
}

/** @param {AuthState} [state] */
export function isSignedIn(state = loadAuthState()) {
  return state.mode === "named";
}

function getSessionStorage() {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage;
}
