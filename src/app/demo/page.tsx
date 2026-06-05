import type { Metadata } from "next";
import { DemoPageClient } from "@/app/demo/DemoPageClient";
import { resolveDemoArchetype } from "@/lib/demo-archetypes.mjs";
import { createRouteMetadata, createRouteStructuredData } from "@/lib/seo";

export const metadata: Metadata = createRouteMetadata({
  title: "One-Click Demo",
  description:
    "Preloaded meetup demo: instant offline analyze with dashboard, auth, mobile, landing, settings, or shop archetypes—export React scaffolds in one visit.",
  path: "/demo",
  keywords: [
    "Qwen UI demo",
    "offline analyze demo",
    "UI archetype scaffold",
    "meetup presentation",
  ],
  ogImage: "/opengraph-image",
  ogImageAlt: "qwen-ui-lab one-click offline demo",
  twitterImage: "/twitter-image",
  twitterImageAlt: "Preloaded screenshot-to-scaffold demo",
  shareSnippet:
    "Open /demo for an instant offline analyze flow—swap archetypes with ?archetype=auth|mobile|landing|settings|shop.",
});

interface DemoPageProps {
  searchParams: Promise<{ archetype?: string }>;
}

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const params = await searchParams;
  const demoArchetype = resolveDemoArchetype(params.archetype);

  const structuredData = createRouteStructuredData({
    title: "One-Click Demo",
    description:
      "Preloaded meetup demo with bundled references and instant offline analyze for common UI archetypes.",
    path: "/demo",
    breadcrumbLabel: "Demo",
    about: ["Offline demo mode", "UI archetype analysis", "Scaffold export"],
    callToAction: "Visit /demo for a one-click preloaded analyze and export flow.",
  });

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={structuredData}
      />
      <DemoPageClient demoArchetype={demoArchetype} />
    </>
  );
}
