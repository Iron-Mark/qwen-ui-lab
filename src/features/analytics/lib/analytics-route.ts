import type { Metadata } from "next";
import { createObservabilityConfig } from "@/lib/observability";
import { createRouteMetadata } from "@/lib/seo";

function getServerObservabilityEnv() {
  return {
    NEXT_PUBLIC_OBSERVABILITY_ENABLED: process.env.NEXT_PUBLIC_OBSERVABILITY_ENABLED,
    NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
  };
}

export function createAnalyticsRouteMetadata(): Metadata {
  return {
    ...createRouteMetadata({
      title: "Analytics diagnostics",
      description:
        "Private funnel metrics reference and optional local event buffer when observability is enabled.",
      path: "/admin/analytics",
      keywords: ["analytics", "funnel metrics", "observability"],
    }),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export function resolveLiveAnalyticsDashboardEnabled() {
  const config = createObservabilityConfig(getServerObservabilityEnv());
  return config.enabled && config.analyticsEnabled;
}
