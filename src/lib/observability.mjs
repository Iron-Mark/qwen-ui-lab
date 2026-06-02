const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

const ALLOWLISTED_ANALYTICS_KEYS = new Set([
  "source",
  "providerState",
  "fileType",
  "fileSize",
  "route",
  "status",
  "durationMs",
  "step",
  "result",
  "trigger",
  "feature",
  "domain",
  "level",
  "entryId",
  "queryLength",
  "totalVisible",
]);

function envFlag(value, defaultValue = false) {
  if (typeof value !== "string") return defaultValue;
  return TRUE_VALUES.has(value.trim().toLowerCase());
}

export function createObservabilityConfig(env = {}) {
  const enabled = envFlag(env.NEXT_PUBLIC_OBSERVABILITY_ENABLED, false);
  const analyticsEnabled = enabled && envFlag(env.NEXT_PUBLIC_ANALYTICS_ENABLED, false);
  const errorMonitoringEnabled =
    enabled && envFlag(env.NEXT_PUBLIC_ERROR_MONITORING_ENABLED, false);
  const allowInDemoMode = envFlag(env.NEXT_PUBLIC_OBSERVABILITY_ALLOW_DEMO_MODE, false);
  const debugLogging = envFlag(env.NEXT_PUBLIC_OBSERVABILITY_DEBUG, false);

  return {
    enabled,
    analyticsEnabled,
    errorMonitoringEnabled,
    allowInDemoMode,
    debugLogging,
  };
}

export function shouldTrackInCurrentMode(providerMode, config) {
  if (!config?.enabled) return false;
  if (providerMode === "demo" && !config.allowInDemoMode) return false;
  return true;
}

function nowIso() {
  try {
    return new Date().toISOString();
  } catch {
    return "unknown";
  }
}

function safeRoutePath(inputRoute) {
  if (typeof inputRoute === "string" && inputRoute) {
    return inputRoute.split("?")[0] ?? "/";
  }

  if (typeof window !== "undefined" && window.location?.pathname) {
    return window.location.pathname;
  }

  return "/";
}

function sanitizeError(error, context = {}) {
  const fallbackMessage = "Unhandled application error";
  const name = typeof error?.name === "string" ? error.name.slice(0, 80) : "Error";
  const message =
    typeof error?.message === "string" && error.message.trim()
      ? error.message.slice(0, 300)
      : fallbackMessage;

  let stack = null;
  if (typeof error?.stack === "string") {
    stack = error.stack.split("\n").slice(0, 8).join("\n");
  }

  return {
    name,
    message,
    stack,
    route: safeRoutePath(context.route),
    source: typeof context.source === "string" ? context.source : "unknown",
    timestamp: nowIso(),
  };
}

export function sanitizeAnalyticsEvent(eventName, metadata = {}) {
  const safeMetadata = {};
  for (const [key, value] of Object.entries(metadata ?? {})) {
    if (!ALLOWLISTED_ANALYTICS_KEYS.has(key)) continue;
    if (typeof value === "string") {
      safeMetadata[key] = value.slice(0, 120);
      continue;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      safeMetadata[key] = value;
    }
  }

  return {
    eventName: String(eventName ?? "unknown_event").slice(0, 80),
    metadata: safeMetadata,
  };
}

export function createMonitoringHooks({
  config,
  dispatchError = (payload) => console.error("[observability:error]", payload),
  dispatchEvent = (payload) => console.info("[observability:event]", payload),
} = {}) {
  const safeConfig = config ?? createObservabilityConfig({});

  const logDebug = (message, payload) => {
    if (!safeConfig.debugLogging) return;
    console.info(`[observability:debug] ${message}`, payload ?? "");
  };

  return {
    captureError(error, context = {}) {
      if (!safeConfig.errorMonitoringEnabled) return;
      if (!shouldTrackInCurrentMode(context.providerMode, safeConfig)) return;
      const payload = sanitizeError(error, context);
      logDebug("dispatching error", payload);
      dispatchError(payload);
    },
    trackEvent(eventName, metadata = {}, context = {}) {
      if (!safeConfig.analyticsEnabled) return;
      if (!shouldTrackInCurrentMode(context.providerMode, safeConfig)) return;
      const payload = sanitizeAnalyticsEvent(eventName, metadata);
      logDebug("dispatching event", payload);
      dispatchEvent(payload);
    },
  };
}
