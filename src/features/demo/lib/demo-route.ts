import type { Metadata } from "next";
import {
  demoArchetypeLabel,
  resolveDemoArchetype,
} from "./demo-archetypes.mjs";
import { createRouteMetadata, createRouteStructuredData } from "@/lib/seo";

export type DemoRouteSearchParams = Promise<{ archetype?: string }>;

export type DemoRoutePageProps = {
  searchParams: DemoRouteSearchParams;
};

export function createDemoRouteMetadata(): Metadata {
  return createRouteMetadata({
    title: "Sample reference",
    description:
      "Preloaded screenshot references for dashboard, auth, mobile, landing, settings, and shop layouts. Inspect detections and export a React starter.",
    path: "/demo",
    keywords: [
      "Qwen UI sample",
      "sample reference",
      "UI archetype starter",
      "React starter export",
    ],
    ogImage: "/opengraph-image",
    ogImageAlt: "qwen-ui-lab sample reference workflow",
    twitterImage: "/twitter-image",
    twitterImageAlt: "Preloaded screenshot-to-React sample",
    shareSnippet:
      "Open /demo for a sample reference and swap layouts with ?archetype=auth|mobile|landing|settings|shop.",
  });
}

export function resolveDemoRouteArchetype(value: string | null | undefined) {
  return resolveDemoArchetype(value);
}

export async function resolveDemoPageModel({ searchParams }: DemoRoutePageProps) {
  const params = await searchParams;

  return {
    demoArchetype: resolveDemoRouteArchetype(params.archetype),
  };
}

export function getDemoRouteArchetypeLabel(value: string) {
  return demoArchetypeLabel(value);
}

export function getDemoRouteStructuredDataInput() {
  return {
    title: "Sample reference",
    description:
      "Preloaded screenshot sample references with starter output for common UI archetypes.",
    path: "/demo",
    breadcrumbLabel: "Sample reference",
    about: ["Screenshot sample", "UI archetype analysis", "React export"],
    callToAction:
      "Open /demo to run a sample layout and review the exported starter.",
  };
}

export function createDemoRouteStructuredData() {
  return createRouteStructuredData(getDemoRouteStructuredDataInput());
}
