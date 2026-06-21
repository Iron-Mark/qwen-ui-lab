"use client";

import { useAuth } from "./AuthProvider";

export function useAccountIdentity() {
  const { savedByLabel, signedIn } = useAuth();

  return { savedByLabel, signedIn };
}
