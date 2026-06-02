"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useProviderMode } from "@/lib/provider-mode";
import {
  createMonitoringHooks,
  createObservabilityConfig,
  type ObservabilityHooks,
} from "@/lib/observability";

const ObservabilityContext = createContext<ObservabilityHooks | null>(null);

function getGlobalEnv() {
  if (typeof window === "undefined") return {};
  return window;
}

export function ObservabilityProvider({ children }: { children: ReactNode }) {
  const { mode } = useProviderMode();

  const hooks = useMemo(() => {
    const config = createObservabilityConfig(getGlobalEnv());
    return createMonitoringHooks({ config });
  }, []);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      hooks.captureError(event.error ?? new Error(event.message), {
        source: "window.error",
        providerMode: mode,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason : new Error("Unhandled promise rejection");
      hooks.captureError(reason, {
        source: "window.unhandledrejection",
        providerMode: mode,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [hooks, mode]);

  return <ObservabilityContext.Provider value={hooks}>{children}</ObservabilityContext.Provider>;
}

export function useObservability() {
  return useContext(ObservabilityContext);
}
