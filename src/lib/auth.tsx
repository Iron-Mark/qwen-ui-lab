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
  confirmMagicLinkStub,
  GUEST_LABEL,
  getSavedByLabel,
  isSignedIn,
  loadAuthState,
  requestMagicLink,
  setDisplayName as persistDisplayName,
} from "@/lib/auth.mjs";

export type AuthMode = "guest" | "named" | "magic-link-pending";

export type AuthState = {
  mode: AuthMode;
  displayName?: string;
  email?: string;
};

interface AuthContextValue {
  auth: AuthState;
  guestLabel: string;
  savedByLabel: string;
  signedIn: boolean;
  setDisplayName: (name: string) => AuthState;
  sendMagicLinkStub: (email: string) => { ok: true } | { ok: false; error: string };
  confirmMagicLink: () => AuthState;
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

  const sendMagicLinkStub = useCallback((email: string) => {
    const result = requestMagicLink(email);
    if (result.ok) {
      setAuth(result.state);
      return { ok: true as const };
    }
    return { ok: false as const, error: result.error };
  }, []);

  const confirmMagicLink = useCallback(() => {
    const next = confirmMagicLinkStub();
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
      sendMagicLinkStub,
      confirmMagicLink,
      signOut,
    }),
    [auth, confirmMagicLink, sendMagicLinkStub, setDisplayName, signOut],
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
