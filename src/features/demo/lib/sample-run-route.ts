import type { Metadata } from "next";
import {
  sampleRunLabel,
  resolveSampleRunId,
} from "./sample-run-archetypes.mjs";
import { createRouteMetadata, createRouteStructuredData } from "@/lib/seo";

export type SampleRunRouteSearchParams = Promise<{ archetype?: string }>;

export type SampleRunRoutePageProps = {
  searchParams: SampleRunRouteSearchParams;
};

export function createSampleRunRouteMetadata(): Metadata {
  return createRouteMetadata({
    title: "Sample run",
    description:
      "Run dashboard, sign-in, mobile, landing, settings, and shop sample layouts. Inspect detections and export a React package.",
    path: "/demo",
    keywords: [
      "screenshot-to-React sample run",
      "sample layout",
      "UI archetype export",
      "React package export",
    ],
    ogImage: "/social/home-social-preview-1200x630.png",
    ogImageAlt: "qwen-ui-lab sample run workflow",
    twitterImage: "/social/home-social-preview-1200x630.png",
    twitterImageAlt: "Screenshot-to-React sample run",
    shareSnippet:
      "Open a sample layout, inspect the detected UI, and review the export package.",
  });
}

export function resolveSampleRunRouteId(value: string | null | undefined) {
  return resolveSampleRunId(value);
}

export async function resolveSampleRunPageModel({ searchParams }: SampleRunRoutePageProps) {
  const params = await searchParams;

  return {
    sampleRunId: resolveSampleRunRouteId(params.archetype),
  };
}

export function getSampleRunRouteLabel(value: string) {
  return sampleRunLabel(value);
}

export function getSampleRunRouteStructuredDataInput() {
  return {
    title: "Sample run",
    description:
      "Sample layouts with starter output for common UI archetypes.",
    path: "/demo",
    breadcrumbLabel: "Sample run",
    about: ["Sample layout", "UI archetype analysis", "React export"],
    callToAction:
      "Run a sample layout and review the export package.",
  };
}

export function createSampleRunRouteStructuredData() {
  return createRouteStructuredData(getSampleRunRouteStructuredDataInput());
}
