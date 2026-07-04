import type { Metadata } from "next";
import { resolveLocale } from "@/lib/i18n";
import { createRouteMetadata, createRouteStructuredData } from "@/lib/seo";
import { buildDesignSystemDomainRedirect } from "./design-system-state.mjs";

export type DesignSystemDomain = "laws-of-ux" | "uilaws";
export type DesignSystemDomainSearchParams = Promise<{ lang?: string }>;

export const designSystemRouteSocialPreviewImageAlt =
  "qwen-ui-lab design system snippets and UX laws";

const designSystemDomainRouteSocialPreviewImageAlt: Record<DesignSystemDomain, string> = {
  "laws-of-ux": "qwen-ui-lab Laws of UX route preview",
  uilaws: "qwen-ui-lab UI Laws route preview",
};

export function createDesignSystemRouteMetadata(): Metadata {
  return createRouteMetadata({
    title: "Design System Catalog",
    description:
      "Browse reusable UI snippets, UX-law patterns, and component examples for screenshot-to-React work.",
    path: "/design-system",
    keywords: [
      "Design system catalog",
      "atomic design components",
      "UX law references",
      "copy and download snippets",
      "React UI patterns",
    ],
    ogImage:
      "/social/design-system-social-preview-1200x630.png",
    ogImageAlt: "qwen-ui-lab design system component gallery",
    twitterImage:
      "/social/design-system-social-preview-1200x630.png",
    twitterImageAlt: "qwen-ui-lab design system growth snippets",
    shareSnippet:
      "Browse reusable UI patterns and component snippets from the qwen-ui-lab design system.",
  });
}

export function getDesignSystemRouteStructuredDataInput() {
  return {
    title: "Design System Catalog",
    description:
      "Explore a workflow-ready component catalog with atomic patterns, UX-law references, and instant copy/download snippets for faster delivery.",
    path: "/design-system",
    breadcrumbLabel: "Design System",
    about: ["Atomic design", "UI pattern libraries", "UX laws"],
    callToAction: "Filter components by domain and download snippets in one click.",
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
  };
}

export function createDesignSystemRouteStructuredData() {
  return createRouteStructuredData(getDesignSystemRouteStructuredDataInput());
}

export function getDesignSystemRouteSocialPreviewImage() {
  return {
    eyebrow: "qwen-ui-lab / design system",
    badge: "Component catalog",
    title: "Reusable UI patterns for shipping",
    description: "Browse primitives, UX references, and component snippets in one workspace.",
    workflow: "Filter catalog -> Preview component -> Copy code",
    background:
      "linear-gradient(135deg, #08061f 0%, #24144f 48%, #0f172a 100%)",
    accent: "#7c3aed",
  };
}

export function createLawsOfUxRouteMetadata(): Metadata {
  return {
    ...createRouteMetadata({
      title: "Laws of UX Catalog",
      description:
        "Jump into the Laws of UX slice of the qwen-ui-lab design system and copy practical pattern snippets faster.",
      path: "/design-system/laws-of-ux",
      ogImage:
        "/social/laws-of-ux-social-preview-1200x630.png",
      ogImageAlt: "Laws of UX route preview in qwen-ui-lab",
      twitterImage:
        "/social/laws-of-ux-social-preview-1200x630.png",
      twitterImageAlt: "Laws of UX snippets in qwen-ui-lab",
      shareSnippet:
        "Open the Laws of UX collection and download implementation-ready snippets in seconds.",
    }),
    robots: {
      index: false,
      follow: true,
    },
  };
}

export function createUiLawsRouteMetadata(): Metadata {
  return {
    ...createRouteMetadata({
      title: "UI Laws Component Library",
      description:
        "Open the UI Laws collection in qwen-ui-lab to discover high-clarity interface patterns with copy-ready snippets.",
      path: "/design-system/uilaws",
      ogImage: "/social/uilaws-social-preview-1200x630.png",
      ogImageAlt: "UI Laws route preview in qwen-ui-lab",
      twitterImage: "/social/uilaws-social-preview-1200x630.png",
      twitterImageAlt: "UI Laws snippets in qwen-ui-lab",
      shareSnippet:
        "Browse UI Laws-inspired components and download snippets your team can adapt immediately.",
    }),
    robots: {
      index: false,
      follow: true,
    },
  };
}

export function getDesignSystemDomainRouteSocialPreviewImage(
  domain: DesignSystemDomain,
) {
  if (domain === "laws-of-ux") {
    return {
      routeLabel: "laws-of-ux",
      title: "Apply UX laws with clearer patterns",
      description: "Compare practical principles, inspect examples, and copy implementation snippets.",
      workflow: "Open collection -> Compare patterns -> Download code",
      background:
        "linear-gradient(135deg, #08061f 0%, #312e81 48%, #083344 100%)",
      accent: "#22d3ee",
    };
  }

  return {
    routeLabel: "uilaws",
    title: "Build clearer interfaces faster",
    description: "Explore component examples with stronger hierarchy, affordance, and snippet downloads.",
    workflow: "Filter UI laws -> Preview component -> Download snippet",
    background:
      "linear-gradient(135deg, #08061f 0%, #581c87 48%, #111827 100%)",
    accent: "#c4b5fd",
  };
}

export function resolveDesignSystemDomainRedirect(domain: DesignSystemDomain, lang?: string) {
  return buildDesignSystemDomainRedirect(domain, resolveLocale(lang));
}

export async function resolveDesignSystemDomainRedirectFromSearchParams(
  domain: DesignSystemDomain,
  searchParams: DesignSystemDomainSearchParams,
) {
  const { lang } = await searchParams;
  return resolveDesignSystemDomainRedirect(domain, lang);
}

export function getDesignSystemDomainRouteSocialPreviewImageAlt(
  domain: DesignSystemDomain,
) {
  return designSystemDomainRouteSocialPreviewImageAlt[domain];
}
