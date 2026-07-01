import type { Metadata } from "next";
import { createRouteMetadata, createRouteStructuredData } from "@/lib/seo";

const homeRouteDescription =
  "Upload a UI screenshot, inspect detected structure, refine boxes, and export a React + Tailwind package.";

export const homeRouteSocialPreviewImageAlt =
  "qwen-ui-lab screenshot-to-React workflow";

export function createHomeRouteMetadata(): Metadata {
  return createRouteMetadata({
    title: "Screenshot to React Workflow",
    description: homeRouteDescription,
    path: "/",
    keywords: [
      "screenshot to React",
      "UI screenshot to React",
      "Qwen3-VL UI analysis",
      "Tailwind component generator",
      "UI detection workflow",
    ],
    ogImage: "/opengraph-image",
    ogImageAlt: "qwen-ui-lab screenshot to React workflow",
    twitterImage: "/twitter-image",
    twitterImageAlt: "qwen-ui-lab screenshot to React workflow",
    shareSnippet:
      "Upload a screenshot, review detected UI, and export a React/Tailwind package.",
  });
}

export function getHomeRouteStructuredDataInput() {
  return {
    title: "Screenshot to React Workflow",
    description: homeRouteDescription,
    path: "/",
    breadcrumbLabel: "Workflow",
    about: ["UI screenshot analysis", "React component generation", "Design system export"],
    callToAction:
      "Turn UI screenshots into reviewable React and Tailwind project files.",
    additionalGraph: [
      {
        "@type": "SoftwareApplication",
        name: "qwen-ui-lab dashboard",
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
          "React + Tailwind package export",
        ],
      },
    ],
  };
}

export function createHomeRouteStructuredData() {
  return createRouteStructuredData(getHomeRouteStructuredDataInput());
}

export function getHomeRouteSocialPreviewImage() {
  return {
    eyebrow: "qwen-ui-lab",
    badge: "Screenshot to React",
    title: "Turn screenshots into starter UI",
    description:
      "Upload a reference, inspect detected regions, refine boxes, and export React + Tailwind files.",
    workflow: "Upload -> Detect -> Refine -> Export package",
    background:
      "linear-gradient(135deg, #08061f 0%, #111827 46%, #312e81 100%)",
    accent: "#8b5cf6",
  };
}
