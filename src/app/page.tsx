import { HomeMarketingHero } from "@/components/organisms/HomeMarketingHero";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import {
  stats,
  revenueData,
  performanceData,
  channelMixData,
  recentActivity,
  quickActions,
} from "@/data/dashboard-data";
import { createRouteMetadata, createRouteStructuredData } from "@/lib/seo";

const UploadFlow = dynamic(
  () => import("@/components/organisms/UploadFlow").then((mod) => mod.UploadFlow),
  { ssr: true },
);

const DashboardShell = dynamic(
  () =>
    import("@/components/organisms/DashboardShell").then((mod) => mod.DashboardShell),
  { ssr: true },
);

export const metadata: Metadata = createRouteMetadata({
  title: "Live Meetup Demo",
  description:
    "Demo-safe workflow: upload a UI screenshot, analyze layout with Qwen3-VL, and export React + Tailwind scaffolds—no API key required on stage.",
  path: "/",
  keywords: [
    "Qwen meetup demo",
    "UI screenshot to React",
    "Qwen3-VL scaffolding",
    "Tailwind component generator",
    "offline demo mode",
  ],
  ogImage: "/opengraph-image",
  ogImageAlt: "qwen-ui-lab — screenshot to React scaffold meetup demo",
  twitterImage: "/twitter-image",
  twitterImageAlt: "qwen-ui-lab live demo for mass presentation",
  shareSnippet:
    "Meetup-ready demo: screenshot → analyze → React/Tailwind scaffold in minutes, offline-safe.",
});

export default function Home() {
  const structuredData = createRouteStructuredData({
    title: "Live Meetup Demo",
    description:
      "Demo-safe workflow: upload a UI screenshot, analyze layout with Qwen3-VL, and export React + Tailwind scaffolds—no API key required on stage.",
    path: "/",
    breadcrumbLabel: "Live demo",
    about: ["UI screenshot analysis", "React scaffolding", "Meetup presentation"],
    callToAction:
      "Turn UI screenshots into scaffold-ready React with an offline-safe meetup demo.",
    additionalGraph: [
      {
        "@type": "SoftwareApplication",
        name: "qwen-ui-lab dashboard workflow",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: [
          "Screenshot upload flow",
          "AI analysis summary",
          "React + Tailwind scaffold export",
        ],
      },
    ],
  });

  return (
    <main className="relative">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={structuredData}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(circle_at_top,oklch(0.97_0_0),transparent_65%)] dark:bg-[radial-gradient(circle_at_top,oklch(0.26_0_0),transparent_65%)]" />
      <div className="relative">
        <HomeMarketingHero />
        <UploadFlow />
        <div className="[content-visibility:auto] [contain-intrinsic-size:auto_1200px]">
          <DashboardShell
            stats={stats}
            revenueData={revenueData}
            performanceData={performanceData}
            channelMixData={channelMixData}
            activities={recentActivity}
            quickActions={quickActions}
          />
        </div>
      </div>
    </main>
  );
}
