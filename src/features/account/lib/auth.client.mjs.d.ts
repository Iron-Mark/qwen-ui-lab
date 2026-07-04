export type { AuthMode, AuthState } from "./auth.mjs";

export {
  AUTH_SESSION_KEY,
  GUEST_LABEL,
  deriveDisplayNameFromEmail,
  isValidEmail,
  normalizeDisplayName,
} from "./auth.mjs";

import type { AuthState } from "./auth.mjs";

export function loadAuthState(): AuthState;

export function clearAuthState(): AuthState;

export function setDisplayName(name: string): AuthState;

export function requestContactLabel(
  email: string,
): { ok: true; state: AuthState } | { ok: false; error: string };

export function confirmContactLabel(): AuthState;

export function getSavedByLabel(state?: AuthState): string;

export function isSignedIn(state?: AuthState): boolean;
