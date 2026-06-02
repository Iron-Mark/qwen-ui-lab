"use client";

import type { ProviderMode } from "@/lib/provider-mode";
import type { ObservabilityHooks } from "@/lib/observability";

export const AnalyticsEvent = {
  UploadSelected: "upload.selected",
  UploadRejected: "upload.rejected",
  UploadSampleLoaded: "upload.sample_loaded",
  AnalyzeStarted: "analysis.started",
  AnalyzeCompleted: "analysis.completed",
  AnalyzeFailed: "analysis.failed",
  GenerateStarted: "generate.started",
  GenerateCompleted: "generate.completed",
  ExportTriggered: "export.triggered",
  DesignSystemViewed: "design_system.viewed",
  DesignSystemDomainChanged: "design_system.domain_changed",
  DesignSystemLevelChanged: "design_system.level_changed",
  DesignSystemSearchUpdated: "design_system.search_updated",
  DesignSystemVariantChanged: "design_system.variant_changed",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

export interface AnalyticsClient {
  track: (eventName: AnalyticsEventName, metadata?: Record<string, unknown>) => void;
}

interface CreateAnalyticsClientArgs {
  hooks: ObservabilityHooks | null;
  providerMode: ProviderMode;
  route: string;
}

function routePath(input: string) {
  const [path] = input.split("?");
  return path || "/";
}

export function createAnalyticsClient({
  hooks,
  providerMode,
  route,
}: CreateAnalyticsClientArgs): AnalyticsClient {
  return {
    track(eventName, metadata = {}) {
      if (!hooks) return;
      hooks.trackEvent(
        eventName,
        {
          route: routePath(route),
          ...metadata,
        },
        { providerMode },
      );
    },
  };
}
