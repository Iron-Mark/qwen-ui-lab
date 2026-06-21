import type { Metadata } from "next";
import { createRouteMetadata, createRouteStructuredData } from "@/lib/seo";

const homeRouteDescription =
  "Demo-safe workflow: upload a UI screenshot, analyze layout with Qwen3-VL, and export React + Tailwind scaffolds - no API key required on stage.";

export const homeRouteSocialPreviewImageAlt =
  "qwen-ui-lab — meetup screenshot-to-scaffold demo";

export function createHomeRouteMetadata(): Metadata {
  return createRouteMetadata({
    title: "Live Meetup Demo",
    description: homeRouteDescription,
    path: "/",
    keywords: [
      "Qwen meetup demo",
      "UI screenshot to React",
      "Qwen3-VL scaffolding",
      "Tailwind component generator",
      "offline demo mode",
    ],
    ogImage: "/opengraph-image",
    ogImageAlt: "qwen-ui-lab - screenshot to React scaffold meetup demo",
    twitterImage: "/twitter-image",
    twitterImageAlt: "qwen-ui-lab live demo for mass presentation",
    shareSnippet:
      "Meetup-ready demo: screenshot -> analyze -> React/Tailwind scaffold in minutes, offline-safe.",
  });
}

export function getHomeRouteStructuredDataInput() {
  return {
    title: "Live Meetup Demo",
    description: homeRouteDescription,
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
  };
}

export function createHomeRouteStructuredData() {
  return createRouteStructuredData(getHomeRouteStructuredDataInput());
}

export function getHomeRouteSocialPreviewImage() {
  return {
    eyebrow: "qwen-ui-lab",
    badge: "Meetup demo",
    title: "Screenshot to scaffold in minutes",
    description: "Live demo with Qwen3-VL + Qwen Code — offline-safe on stage",
    workflow: "Upload → Analyze → Preview → Export",
    background:
      "linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(37, 99, 235) 45%, rgb(16, 185, 129) 100%)",
  };
}
