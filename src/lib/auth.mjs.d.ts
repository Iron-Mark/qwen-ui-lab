export type AuthMode = "guest" | "named" | "magic-link-pending";

export type AuthState = {
  mode: AuthMode;
  displayName?: string;
  email?: string;
};

export const AUTH_SESSION_KEY: string;
export const GUEST_LABEL: string;

export function normalizeDisplayName(
  value: string | null | undefined,
): string | null;

export function isValidEmail(value: string | null | undefined): boolean;

export function deriveDisplayNameFromEmail(email: string): string | null;

export function loadAuthState(storage?: Storage | null): AuthState;

export function saveAuthState(
  state: AuthState,
  storage?: Storage | null,
): AuthState;

export function clearAuthState(storage?: Storage | null): AuthState;

export function setDisplayName(
  name: string,
  storage?: Storage | null,
): AuthState;

export function requestMagicLink(
  email: string,
  storage?: Storage | null,
): { ok: true; state: AuthState } | { ok: false; error: string };

export function confirmMagicLinkStub(storage?: Storage | null): AuthState;

export function getSavedByLabel(state?: AuthState): string;

export function isSignedIn(state?: AuthState): boolean;
