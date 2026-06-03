import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { DashboardShell } from "@/components/organisms/DashboardShell";
import { UploadFlow } from "@/components/organisms/UploadFlow";
import type { Metadata } from "next";
import {
  stats,
  revenueData,
  performanceData,
  channelMixData,
  recentActivity,
  quickActions,
} from "@/data/dashboard-data";
import { createRouteMetadata, createRouteStructuredData } from "@/lib/seo";

export const metadata: Metadata = createRouteMetadata({
  title: "Dashboard Demo",
  description:
    "Upload a UI screenshot, get AI-structured analysis, and generate React + Tailwind scaffolds you can refine in minutes.",
  path: "/",
  keywords: [
    "AI UI workflow",
    "UI screenshot to code",
    "Qwen3-VL component generation",
    "React Tailwind scaffolding",
    "developer productivity",
  ],
  ogImage: "/opengraph-image",
  ogImageAlt: "qwen-ui-lab dashboard screenshot-to-component workflow",
  twitterImage: "/twitter-image",
  twitterImageAlt: "qwen-ui-lab screenshot-to-code growth demo",
  shareSnippet:
    "Turn screenshots into production-ready React/Tailwind starting points with qwen-ui-lab.",
});

export default function Home() {
  const structuredData = createRouteStructuredData({
    title: "Dashboard Demo",
    description:
      "Upload a UI screenshot, get AI-structured analysis, and generate React + Tailwind scaffolds you can refine in minutes.",
    path: "/",
    breadcrumbLabel: "Dashboard Demo",
    about: ["UI screenshot analysis", "React scaffolding", "Tailwind starter generation"],
    callToAction: "Upload a screenshot and generate a scaffold in minutes.",
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
        <h1 className="sr-only">
          qwen-ui-lab dashboard and AI screenshot-to-component demo
        </h1>
        <PageContainer as="p" className="growth-snippet pt-8 text-sm text-muted-foreground">
          Launch faster with a screenshot-to-scaffold loop.
          {" "}
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/design-system">
            Explore reusable snippets
          </Link>
          {" "}to reduce polish time after generation.
        </PageContainer>
        <UploadFlow />
        <DashboardShell
          stats={stats}
          revenueData={revenueData}
          performanceData={performanceData}
          channelMixData={channelMixData}
          activities={recentActivity}
          quickActions={quickActions}
        />
      </div>
    </main>
  );
}
