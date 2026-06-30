import type { Metadata } from "next";
import { createRouteMetadata, createRouteStructuredData } from "@/lib/seo";

const homeRouteDescription =
  "Upload a UI screenshot, inspect detected structure, refine boxes, and export a React + Tailwind package.";

export const homeRouteSocialPreviewImageAlt =
  "qwen-ui-lab screenshot-to-React workflow";

export function createHomeRouteMetadata(): Metadata {
  return createRouteMetadata({
    title: "Screenshot to React Starter",
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
    ogImageAlt: "qwen-ui-lab screenshot to React starter workflow",
    twitterImage: "/twitter-image",
    twitterImageAlt: "qwen-ui-lab screenshot to React starter workflow",
    shareSnippet:
      "Upload a screenshot, review detected UI, and export a React/Tailwind starter.",
  });
}

export function getHomeRouteStructuredDataInput() {
  return {
    title: "Screenshot to React Starter",
    description: homeRouteDescription,
    path: "/",
    breadcrumbLabel: "Workflow",
    about: ["UI screenshot analysis", "React component starter", "Design system export"],
    callToAction:
      "Turn UI screenshots into reviewable React and Tailwind starter files.",
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
          "React + Tailwind starter export",
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
    title: "Screenshot to React starter",
    description: "Upload, inspect detected UI, refine boxes, and export starter files",
    workflow: "Upload → Detect → Refine → Export",
    background:
      "linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(37, 99, 235) 45%, rgb(16, 185, 129) 100%)",
  };
}
