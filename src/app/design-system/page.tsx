import { Suspense } from "react";
import type { Metadata } from "next";
import { DesignSystemPreview } from "@/components/design-system/DesignSystemPreview";
import { createRouteMetadata, createRouteStructuredData } from "@/lib/seo";

export const metadata: Metadata = createRouteMetadata({
  title: "Design System Playground",
  description:
    "Explore an AI-ready component catalog with atomic patterns, UX-law references, and instant copy/export snippets for faster delivery.",
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

function DesignSystemFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">
      Loading design system…
    </div>
  );
}

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
      <Suspense fallback={<DesignSystemFallback />}>
        <DesignSystemPreview />
      </Suspense>
    </>
  );
}
