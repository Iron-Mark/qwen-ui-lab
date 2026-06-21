"use client";

import type { ProviderMode } from "./provider-mode";
import type { ObservabilityHooks } from "./observability";

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
  HomeHeroViewed: "home.hero_viewed",
  HomeHeroCtaClicked: "home.hero_cta_clicked",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

type AnalyticsMetadataValue = string | number | boolean;

export interface AnalyticsMetadata {
  source?: AnalyticsMetadataValue;
  providerState?: AnalyticsMetadataValue;
  fileType?: AnalyticsMetadataValue;
  fileSize?: AnalyticsMetadataValue;
  route?: AnalyticsMetadataValue;
  status?: AnalyticsMetadataValue;
  durationMs?: AnalyticsMetadataValue;
  step?: AnalyticsMetadataValue;
  result?: AnalyticsMetadataValue;
  trigger?: AnalyticsMetadataValue;
  feature?: AnalyticsMetadataValue;
  domain?: AnalyticsMetadataValue;
  level?: AnalyticsMetadataValue;
  entryId?: AnalyticsMetadataValue;
  sampleId?: AnalyticsMetadataValue;
  queryLength?: AnalyticsMetadataValue;
  totalVisible?: AnalyticsMetadataValue;
}

export interface AnalyticsClient {
  track: (eventName: AnalyticsEventName, metadata?: AnalyticsMetadata) => void;
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
          ...metadata,
          route: routePath(route),
        },
        { providerMode },
      );
    },
  };
}
