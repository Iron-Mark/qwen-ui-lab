import type { Metadata } from "next";
import {
  sampleReferenceLabel,
  resolveSampleReferenceId,
} from "./demo-archetypes.mjs";
import { createRouteMetadata, createRouteStructuredData } from "@/lib/seo";

export type DemoRouteSearchParams = Promise<{ archetype?: string }>;

export type DemoRoutePageProps = {
  searchParams: DemoRouteSearchParams;
};

export function createDemoRouteMetadata(): Metadata {
  return createRouteMetadata({
    title: "Sample screenshot",
    description:
      "Sample screenshots for dashboard, auth, mobile, landing, settings, and shop layouts. Inspect detections and export a React package.",
    path: "/demo",
    keywords: [
      "Qwen UI sample",
      "sample screenshot",
      "UI archetype export",
      "React package export",
    ],
    ogImage: "/opengraph-image",
    ogImageAlt: "qwen-ui-lab sample screenshot workflow",
    twitterImage: "/twitter-image",
    twitterImageAlt: "Screenshot-to-React sample screenshot",
    shareSnippet:
      "Open a sample screenshot, inspect the detected UI, and review the export package.",
  });
}

export function resolveSampleReferenceRouteId(value: string | null | undefined) {
  return resolveSampleReferenceId(value);
}

export async function resolveDemoPageModel({ searchParams }: DemoRoutePageProps) {
  const params = await searchParams;

  return {
    sampleReferenceId: resolveSampleReferenceRouteId(params.archetype),
  };
}

export function getSampleReferenceRouteLabel(value: string) {
  return sampleReferenceLabel(value);
}

export function getDemoRouteStructuredDataInput() {
  return {
    title: "Sample screenshot",
    description:
      "Sample screenshots with generated output for common UI archetypes.",
    path: "/demo",
    breadcrumbLabel: "Sample screenshot",
    about: ["Screenshot sample", "UI archetype analysis", "React export"],
    callToAction:
      "Run a sample layout and review the export package.",
  };
}

export function createDemoRouteStructuredData() {
  return createRouteStructuredData(getDemoRouteStructuredDataInput());
}
