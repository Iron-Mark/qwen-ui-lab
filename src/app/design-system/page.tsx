import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/layout/PageContainer";
import { DesignSystemLcpHeader } from "@/components/design-system/DesignSystemLcpHeader";
import { createRouteMetadata, createRouteStructuredData } from "@/lib/seo";
import { DesignSystemPreviewClient } from "./DesignSystemPreviewClient";

export const metadata: Metadata = createRouteMetadata({
  title: "Design System Playground",
  description:
    "Browse atomic UI snippets, UX-law patterns, and one-click exports—your polish lane after screenshot-to-scaffold generation.",
  path: "/design-system",
  keywords: [
    "Design system playground",
    "atomic design components",
    "UX law references",
    "copy and export snippets",
    "React UI patterns",
  ],
  ogImage: "/design-system/opengraph-image",
  ogImageAlt: "qwen-ui-lab design system component gallery",
  twitterImage: "/design-system/twitter-image",
  twitterImageAlt: "qwen-ui-lab design system growth snippets",
  shareSnippet:
    "Browse reusable UI patterns and export-ready snippets from the qwen-ui-lab design system.",
});

export default function DesignSystemPage() {
  const structuredData = createRouteStructuredData({
    title: "Design System Playground",
    description:
      "Explore an AI-ready component catalog with atomic patterns, UX-law references, and instant copy/export snippets for faster delivery.",
    path: "/design-system",
    breadcrumbLabel: "Design System",
    about: ["Atomic design", "UI pattern libraries", "UX laws"],
    callToAction: "Filter components by domain and export snippets in one click.",
    additionalGraph: [
      {
        "@type": "CollectionPage",
        name: "Design system component catalog",
        hasPart: [
          { "@type": "Thing", name: "Atoms" },
          { "@type": "Thing", name: "Molecules" },
          { "@type": "Thing", name: "Organisms" },
        ],
      },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={structuredData}
      />
      <PageContainer className="space-y-6 py-6">
        <Suspense
          fallback={<Skeleton className="h-28 w-full rounded-2xl" aria-hidden />}
        >
          <DesignSystemLcpHeader />
        </Suspense>
        <DesignSystemPreviewClient />
      </PageContainer>
    </>
  );
}
