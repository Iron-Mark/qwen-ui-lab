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
    title: "Sample Run",
    description:
      "Preloaded screenshot sample with dashboard, auth, mobile, landing, settings, or shop layouts - inspect detection and export React starter files.",
    path: "/demo",
    keywords: [
      "Qwen UI sample",
      "screenshot sample run",
      "UI archetype starter",
      "React starter export",
    ],
    ogImage: "/opengraph-image",
    ogImageAlt: "qwen-ui-lab sample screenshot workflow",
    twitterImage: "/twitter-image",
    twitterImageAlt: "Preloaded screenshot-to-React sample run",
    shareSnippet:
      "Open /demo for a preloaded sample run - swap layouts with ?archetype=auth|mobile|landing|settings|shop.",
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
    title: "Sample Run",
    description:
      "Preloaded screenshot sample with generated starter output for common UI archetypes.",
    path: "/demo",
    breadcrumbLabel: "Sample run",
    about: ["Screenshot sample", "UI archetype analysis", "React export"],
    callToAction: "Visit /demo for a preloaded analyze and export flow.",
  };
}

export function createDemoRouteStructuredData() {
  return createRouteStructuredData(getDemoRouteStructuredDataInput());
}
