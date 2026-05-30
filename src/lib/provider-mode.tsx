"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ProviderMode = "unknown" | "live" | "demo";

interface ProviderModeContextValue {
  mode: ProviderMode;
  refresh: () => Promise<void>;
}

const ProviderModeContext = createContext<ProviderModeContextValue>({
  mode: "unknown",
  refresh: async () => {},
});

export function ProviderModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ProviderMode>("unknown");

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

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <ProviderModeContext.Provider value={{ mode, refresh }}>
      {children}
    </ProviderModeContext.Provider>
  );
}

export function useProviderMode() {
  return useContext(ProviderModeContext);
}
