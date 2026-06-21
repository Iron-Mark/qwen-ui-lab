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
    title: "One-Click Demo",
    description:
      "Preloaded meetup demo: instant offline analyze with dashboard, auth, mobile, landing, settings, or shop archetypes - export React scaffolds in one visit.",
    path: "/demo",
    keywords: [
      "Qwen UI demo",
      "offline analyze demo",
      "UI archetype scaffold",
      "meetup presentation",
    ],
    ogImage: "/opengraph-image",
    ogImageAlt: "qwen-ui-lab one-click offline demo",
    twitterImage: "/twitter-image",
    twitterImageAlt: "Preloaded screenshot-to-scaffold demo",
    shareSnippet:
      "Open /demo for an instant offline analyze flow - swap archetypes with ?archetype=auth|mobile|landing|settings|shop.",
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
    title: "One-Click Demo",
    description:
      "Preloaded meetup demo with bundled references and instant offline analyze for common UI archetypes.",
    path: "/demo",
    breadcrumbLabel: "Demo",
    about: ["Offline demo mode", "UI archetype analysis", "Scaffold export"],
    callToAction: "Visit /demo for a one-click preloaded analyze and export flow.",
  };
}

export function createDemoRouteStructuredData() {
  return createRouteStructuredData(getDemoRouteStructuredDataInput());
}
