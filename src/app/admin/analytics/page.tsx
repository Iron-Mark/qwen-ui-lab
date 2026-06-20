import type { Metadata } from "next";
import { createObservabilityConfig } from "@/lib/observability";
import { createRouteMetadata } from "@/lib/seo";
import { AnalyticsDashboardClient } from "@/features/analytics/components/AnalyticsDashboardClient";

function getServerObservabilityEnv() {
  return {
    NEXT_PUBLIC_OBSERVABILITY_ENABLED: process.env.NEXT_PUBLIC_OBSERVABILITY_ENABLED,
    NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
  };
}

export const metadata: Metadata = {
  ...createRouteMetadata({
    title: "Analytics (internal)",
    description:
      "Staging-only funnel metrics reference and optional local event buffer when observability is enabled.",
    path: "/admin/analytics",
    keywords: ["analytics", "funnel metrics", "observability"],
  }),
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminAnalyticsPage() {
  const config = createObservabilityConfig(getServerObservabilityEnv());
  const liveDashboardEnabled = config.enabled && config.analyticsEnabled;

  return <AnalyticsDashboardClient liveDashboardEnabled={liveDashboardEnabled} />;
}
