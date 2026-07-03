"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearAuthState,
  confirmContactLabel as confirmContactLabelClient,
  GUEST_LABEL,
  getSavedByLabel,
  isSignedIn,
  loadAuthState,
  requestContactLabel,
  setDisplayName as persistDisplayName,
} from "../lib/auth.client.mjs";

export type { AuthMode, AuthState } from "../lib/auth.mjs";
import type { AuthState } from "../lib/auth.mjs";

interface AuthContextValue {
  auth: AuthState;
  guestLabel: string;
  savedByLabel: string;
  signedIn: boolean;
  setDisplayName: (name: string) => AuthState;
  saveContactLabel: (email: string) => { ok: true } | { ok: false; error: string };
  confirmContactLabel: () => AuthState;
  signOut: () => AuthState;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => loadAuthState());

  const setDisplayName = useCallback((name: string) => {
    const next = persistDisplayName(name);
    setAuth(next);
    return next;
  }, []);

  const saveContactLabel = useCallback((email: string) => {
    const result = requestContactLabel(email);
    if (result.ok) {
      setAuth(result.state);
      return { ok: true as const };
    }
    return { ok: false as const, error: result.error };
  }, []);

  const confirmContactLabel = useCallback(() => {
    const next = confirmContactLabelClient();
    setAuth(next);
    return next;
  }, []);

  const signOut = useCallback(() => {
    const next = clearAuthState();
    setAuth(next);
    return next;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      guestLabel: GUEST_LABEL,
      savedByLabel: getSavedByLabel(auth),
      signedIn: isSignedIn(auth),
      setDisplayName,
      saveContactLabel,
      confirmContactLabel,
      signOut,
    }),
    [auth, confirmContactLabel, saveContactLabel, setDisplayName, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
