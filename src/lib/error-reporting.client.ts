"use client";

import type { ObservabilityConfig } from "@/lib/observability";
import {
  createGenericErrorDispatch,
  resolveErrorReportingTargets,
} from "@/lib/error-reporting.mjs";

type SanitizedErrorPayload = {
  name: string;
  message: string;
  stack: string | null;
  route: string;
  source: string;
  timestamp: string;
};

let sentryInitPromise: Promise<void> | null = null;

async function ensureSentry(dsn: string, environment: string) {
  if (sentryInitPromise) return sentryInitPromise;

  sentryInitPromise = (async () => {
    const Sentry = await import("@sentry/browser");
    Sentry.init({
      dsn,
      environment,
      enabled: true,
      sendDefaultPii: false,
      beforeSend(event) {
        if (event.request?.url) {
          try {
            const parsed = new URL(event.request.url);
            parsed.search = "";
            event.request.url = parsed.toString();
          } catch {
            delete event.request.url;
          }
        }
        return event;
      },
    });
  })();

  return sentryInitPromise;
}

function reportToSentry(
  targets: ReturnType<typeof resolveErrorReportingTargets>,
  payload: SanitizedErrorPayload,
) {
  if (!targets.sentryDsn) return;

  void ensureSentry(targets.sentryDsn, targets.sentryEnvironment).then(() => {
    void import("@sentry/browser").then((Sentry) => {
      Sentry.captureException(new Error(payload.message), {
        tags: {
          source: payload.source,
          error_name: payload.name,
        },
        extra: {
          route: payload.route,
          timestamp: payload.timestamp,
        },
      });
    });
  });
}

export function createClientErrorDispatch(
  config: ObservabilityConfig,
  env: Record<string, string | undefined> = {},
) {
  const targets = resolveErrorReportingTargets(env);
  const generic = createGenericErrorDispatch({
    reportingUrl: targets.reportingUrl,
    logToConsole: config.debugLogging || !targets.sentryDsn,
  });

  if (!config.errorMonitoringEnabled) {
    return generic;
  }

  return (payload: SanitizedErrorPayload) => {
    generic(payload);
    reportToSentry(targets, payload);
  };
}
