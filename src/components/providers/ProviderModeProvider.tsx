"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { ProviderMode } from "@/lib/provider-mode";

interface ProviderModeContextValue {
  mode: ProviderMode;
  refresh: () => Promise<void>;
}

const ProviderModeContext = createContext<ProviderModeContextValue>({
  mode: "unknown",
  refresh: async () => {},
});

export function ProviderModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ProviderMode>("demo");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (!response.ok) {
        setMode("demo");
        return;
      }
      const payload = (await response.json()) as {
        liveAnalysisEnabled?: boolean;
      };
      setMode(payload.liveAnalysisEnabled === true ? "live" : "demo");
    } catch {
      setMode("demo");
    }
  }, []);

  return (
    <ProviderModeContext.Provider value={{ mode, refresh }}>
      {children}
    </ProviderModeContext.Provider>
  );
}

export function useProviderMode() {
  return useContext(ProviderModeContext);
}
