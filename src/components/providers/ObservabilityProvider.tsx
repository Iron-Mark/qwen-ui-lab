"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useProviderMode } from "@/lib/provider-mode";
import { createClientErrorDispatch } from "@/lib/error-reporting.client";
import { appendClientAnalyticsBuffer } from "@/features/analytics/lib/analytics-event-buffer";
import {
  createMonitoringHooks,
  createObservabilityConfig,
  type ObservabilityHooks,
} from "@/lib/observability";

const ObservabilityContext = createContext<ObservabilityHooks | null>(null);

function getClientObservabilityEnv() {
  return {
    NEXT_PUBLIC_OBSERVABILITY_ENABLED: process.env.NEXT_PUBLIC_OBSERVABILITY_ENABLED,
    NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
    NEXT_PUBLIC_ERROR_MONITORING_ENABLED:
      process.env.NEXT_PUBLIC_ERROR_MONITORING_ENABLED,
    NEXT_PUBLIC_OBSERVABILITY_ALLOW_DEMO_MODE:
      process.env.NEXT_PUBLIC_OBSERVABILITY_ALLOW_DEMO_MODE,
    NEXT_PUBLIC_OBSERVABILITY_DEBUG: process.env.NEXT_PUBLIC_OBSERVABILITY_DEBUG,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    NEXT_PUBLIC_ERROR_REPORTING_URL: process.env.NEXT_PUBLIC_ERROR_REPORTING_URL,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
  };
}

export function ObservabilityProvider({ children }: { children: ReactNode }) {
  const { mode } = useProviderMode();

  const hooks = useMemo(() => {
    const env = getClientObservabilityEnv();
    const config = createObservabilityConfig(env);
    const dispatchError = createClientErrorDispatch(config, env);
    return createMonitoringHooks({
      config,
      dispatchError: dispatchError as (payload: unknown) => void,
      dispatchEvent: (payload) => {
        const record = payload as { eventName: string; metadata: Record<string, unknown> };
        appendClientAnalyticsBuffer(record);
        if (config.debugLogging) {
          console.info("[observability:event]", record);
        }
      },
    });
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
