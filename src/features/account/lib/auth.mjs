/**
 * Browser-local profile — guest mode by default, optional display name or
 * contact label stored in sessionStorage only.
 *
 * Real OAuth / email plan: docs/ops/OAUTH_ROADMAP.md
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
const GUEST_STATE = /** @type {AuthState} */ ({ mode: "guest" });

export function loadAuthState(storage = null) {
  if (!storage) return GUEST_STATE;
  try {
    const raw = storage.getItem(AUTH_SESSION_KEY);
    if (!raw) return GUEST_STATE;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return GUEST_STATE;
    const mode = parsed.mode;
    if (mode !== "guest" && mode !== "named" && mode !== "magic-link-pending") {
      return GUEST_STATE;
    }
    const displayName = normalizeDisplayName(parsed.displayName);
    const email =
      typeof parsed.email === "string" && isValidEmail(parsed.email)
        ? parsed.email.trim().toLowerCase()
        : undefined;
    if (mode === "named" && !displayName) return GUEST_STATE;
    if (mode === "magic-link-pending" && !email) return GUEST_STATE;
    return {
      mode,
      ...(displayName ? { displayName } : {}),
      ...(email ? { email } : {}),
    };
  } catch {
    return GUEST_STATE;
  }
}

/**
 * @param {AuthState} state
 * @param {Storage | null | undefined} [storage]
 */
export function saveAuthState(state, storage = null) {
  if (!storage) return state;
  try {
    if (state.mode === "guest") {
      storage.removeItem(AUTH_SESSION_KEY);
      return /** @type {AuthState} */ ({ mode: "guest" });
    }
    storage.setItem(AUTH_SESSION_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage may be unavailable
  }
  return state;
}

/** @param {Storage | null | undefined} [storage] */
export function clearAuthState(storage = null) {
  return saveAuthState({ mode: "guest" }, storage);
}

/**
 * @param {string} name
 * @param {Storage | null | undefined} [storage]
 * @returns {AuthState}
 */
export function setDisplayName(name, storage = null) {
  const displayName = normalizeDisplayName(name);
  if (!displayName) {
    return clearAuthState(storage);
  }
  return saveAuthState({ mode: "named", displayName }, storage);
}

/**
 * Records a pending contact label locally; no network or outbound mail.
 * @param {string} email
 * @param {Storage | null | undefined} [storage]
 * @returns {{ ok: true, state: AuthState } | { ok: false, error: string }}
 */
export function requestMagicLink(email, storage = null) {
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
 * Completes the local contact-label flow without verifying a token.
 * @param {Storage | null | undefined} [storage]
 * @returns {AuthState}
 */
export function confirmMagicLinkStub(storage = null) {
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
