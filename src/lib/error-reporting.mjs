/**
 * Generic client error dispatch (no vendor SDK). Used by observability and node tests.
 */

function trimUrl(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveErrorReportingTargets(env = {}) {
  return {
    sentryDsn: trimUrl(env.NEXT_PUBLIC_SENTRY_DSN),
    reportingUrl: trimUrl(env.NEXT_PUBLIC_ERROR_REPORTING_URL),
    sentryEnvironment:
      trimUrl(env.NEXT_PUBLIC_SENTRY_ENVIRONMENT) ??
      trimUrl(env.NEXT_PUBLIC_VERCEL_ENV) ??
      "development",
  };
}

/**
 * @param {{ reportingUrl?: string | null; logToConsole?: boolean }} options
 */
export function createGenericErrorDispatch({
  reportingUrl = null,
  logToConsole = true,
} = {}) {
  return function dispatchGenericError(payload) {
    if (logToConsole) {
      console.error("[observability:error]", payload);
    }

    const url = trimUrl(reportingUrl);
    if (!url || typeof fetch !== "function") return;

    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "client_error",
        ...payload,
      }),
      keepalive: true,
    }).catch(() => {
      // Telemetry must never break UX.
    });
  };
}
