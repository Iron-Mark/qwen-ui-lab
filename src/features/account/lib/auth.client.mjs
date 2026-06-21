import {
  clearAuthState as clearAuthStateWithStorage,
  confirmMagicLinkStub as confirmMagicLinkStubWithStorage,
  getSavedByLabel as getSavedByLabelFromState,
  isSignedIn as isSignedInState,
  loadAuthState as loadAuthStateFromStorage,
  requestMagicLink as requestMagicLinkWithStorage,
  setDisplayName as setDisplayNameWithStorage,
} from "./auth.mjs";

export {
  AUTH_SESSION_KEY,
  GUEST_LABEL,
  deriveDisplayNameFromEmail,
  isValidEmail,
  normalizeDisplayName,
} from "./auth.mjs";

export function loadAuthState() {
  return loadAuthStateFromStorage(getSessionStorage());
}

export function clearAuthState() {
  return clearAuthStateWithStorage(getSessionStorage());
}

export function setDisplayName(name) {
  return setDisplayNameWithStorage(name, getSessionStorage());
}

export function requestMagicLink(email) {
  return requestMagicLinkWithStorage(email, getSessionStorage());
}

export function confirmMagicLinkStub() {
  return confirmMagicLinkStubWithStorage(getSessionStorage());
}

export function getSavedByLabel(state = loadAuthState()) {
  return getSavedByLabelFromState(state);
}

export function isSignedIn(state = loadAuthState()) {
  return isSignedInState(state);
}

function getSessionStorage() {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage;
}
