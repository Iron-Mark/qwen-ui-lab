import type { Metadata } from "next";
import { AnalyticsDashboardClient } from "@/features/analytics/components/AnalyticsDashboardClient";
import {
  createAnalyticsRouteMetadata,
  resolveLiveAnalyticsDashboardEnabled,
} from "@/features/analytics/lib/analytics-route";

export const metadata: Metadata = createAnalyticsRouteMetadata();

export default function AdminAnalyticsPage() {
  return (
    <AnalyticsDashboardClient
      liveDashboardEnabled={resolveLiveAnalyticsDashboardEnabled()}
    />
  );
}
