import type { Metadata } from "next";
import { createRouteMetadata, createRouteStructuredData } from "@/lib/seo";

const homeRouteDescription =
  "Upload a UI screenshot, inspect detected structure, refine boxes, and download a React + Tailwind starter package.";

export const homeRouteSocialPreviewImageAlt =
  "qwen-ui-lab screenshot-to-React workflow";

export function createHomeRouteMetadata(): Metadata {
  return createRouteMetadata({
    title: "Screenshot to React Workspace",
    description: homeRouteDescription,
    path: "/",
    keywords: [
      "screenshot to React",
      "UI screenshot to React",
      "UI layout detection",
      "Tailwind starter package builder",
      "UI detection workflow",
    ],
    ogImage: "/social/home-social-preview-1200x630.png",
    ogImageAlt: "qwen-ui-lab screenshot to React workflow",
    twitterImage: "/social/home-social-preview-1200x630.png",
    twitterImageAlt: "qwen-ui-lab screenshot to React workflow",
    shareSnippet:
      "Upload a screenshot, review detected UI, and download a React/Tailwind starter package.",
  });
}

export function getHomeRouteStructuredDataInput() {
  return {
    title: "Screenshot to React Workspace",
    description: homeRouteDescription,
    path: "/",
    breadcrumbLabel: "Workflow",
    about: ["UI screenshot analysis", "React starter review", "Design system download"],
    callToAction:
      "Turn UI screenshots into inspectable React and Tailwind project files.",
    additionalGraph: [
      {
        "@type": "SoftwareApplication",
        name: "qwen-ui-lab workspace",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: [
          "Screenshot upload flow",
          "Detection summary",
          "React + Tailwind starter package download",
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
      "Upload a screenshot, inspect detected regions, refine boxes, and download React + Tailwind files.",
    workflow: "Upload -> Detect -> Refine -> Download package",
    background:
      "linear-gradient(135deg, #08061f 0%, #111827 46%, #312e81 100%)",
    accent: "#8b5cf6",
  };
}
