import type { ProviderMode } from "./provider-mode";

export type { ProviderMode } from "./provider-mode";

export interface ObservabilityConfig {
  enabled: boolean;
  analyticsEnabled: boolean;
  errorMonitoringEnabled: boolean;
  allowInLocalAnalysisMode: boolean;
  /** @deprecated Use allowInLocalAnalysisMode. Kept for old config consumers. */
  allowInDemoMode: boolean;
  debugLogging: boolean;
}

export interface ErrorContext {
  source?: string;
  route?: string;
  providerMode?: ProviderMode;
}

export interface EventContext {
  providerMode?: ProviderMode;
}

export interface ObservabilityHooks {
  captureError: (error: unknown, context?: ErrorContext) => void;
  trackEvent: (
    eventName: string,
    metadata?: Record<string, unknown>,
    context?: EventContext,
  ) => void;
}

type EnvInput = Record<string, string | undefined>;

// Reuse runtime implementation shared with node tests.
import * as runtime from "./observability.mjs";

const runtimeModule = runtime as unknown as {
  createObservabilityConfig: (env?: EnvInput) => ObservabilityConfig;
  shouldTrackInCurrentMode: (providerMode: ProviderMode, config: ObservabilityConfig) => boolean;
  sanitizeAnalyticsEvent: (
    eventName: string,
    metadata?: Record<string, unknown>,
  ) => { eventName: string; metadata: Record<string, unknown> };
  createMonitoringHooks: (args?: {
    config?: ObservabilityConfig;
    dispatchError?: (payload: unknown) => void;
    dispatchEvent?: (payload: unknown) => void;
  }) => ObservabilityHooks;
};

export const createObservabilityConfig = runtimeModule.createObservabilityConfig;
export const shouldTrackInCurrentMode = runtimeModule.shouldTrackInCurrentMode;
export const sanitizeAnalyticsEvent = runtimeModule.sanitizeAnalyticsEvent;
export const createMonitoringHooks = runtimeModule.createMonitoringHooks;
