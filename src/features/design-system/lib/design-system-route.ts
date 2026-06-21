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
  uilaws: "qwen-ui-lab UILaws route preview",
};

export function createDesignSystemRouteMetadata(): Metadata {
  return createRouteMetadata({
    title: "Design System Playground",
    description:
      "Browse atomic UI snippets, UX-law patterns, and one-click exports - your polish lane after screenshot-to-scaffold generation.",
    path: "/design-system",
    keywords: [
      "Design system playground",
      "atomic design components",
      "UX law references",
      "copy and export snippets",
      "React UI patterns",
    ],
    ogImage: "/design-system/opengraph-image",
    ogImageAlt: "qwen-ui-lab design system component gallery",
    twitterImage: "/design-system/twitter-image",
    twitterImageAlt: "qwen-ui-lab design system growth snippets",
    shareSnippet:
      "Browse reusable UI patterns and export-ready snippets from the qwen-ui-lab design system.",
  });
}

export function getDesignSystemRouteStructuredDataInput() {
  return {
    title: "Design System Playground",
    description:
      "Explore an AI-ready component catalog with atomic patterns, UX-law references, and instant copy/export snippets for faster delivery.",
    path: "/design-system",
    breadcrumbLabel: "Design System",
    about: ["Atomic design", "UI pattern libraries", "UX laws"],
    callToAction: "Filter components by domain and export snippets in one click.",
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
    eyebrow: "qwen-ui-lab / design-system",
    badge: "Reusable snippets",
    title: "Design faster with proven patterns",
    description: "Atomic catalog + UX references + export-ready code",
    workflow: "Filter -> Preview -> Copy -> Ship consistent UI",
    background:
      "linear-gradient(135deg, rgb(24, 24, 27) 0%, rgb(76, 29, 149) 50%, rgb(14, 165, 233) 100%)",
  };
}

export function createLawsOfUxRouteMetadata(): Metadata {
  return {
    ...createRouteMetadata({
      title: "Laws of UX Catalog",
      description:
        "Jump into the Laws of UX slice of the qwen-ui-lab design system and copy practical pattern snippets faster.",
      path: "/design-system/laws-of-ux",
      ogImage: "/design-system/laws-of-ux/opengraph-image",
      ogImageAlt: "Laws of UX route preview in qwen-ui-lab",
      twitterImage: "/design-system/laws-of-ux/twitter-image",
      twitterImageAlt: "Laws of UX snippets in qwen-ui-lab",
      shareSnippet:
        "Open the Laws of UX collection and export implementation-ready snippets in seconds.",
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
      title: "UILaws Component Library",
      description:
        "Open the UILaws domain view in qwen-ui-lab to discover high-clarity UI patterns with copy-ready snippets.",
      path: "/design-system/uilaws",
      ogImage: "/design-system/uilaws/opengraph-image",
      ogImageAlt: "UILaws route preview in qwen-ui-lab",
      twitterImage: "/design-system/uilaws/twitter-image",
      twitterImageAlt: "UILaws snippets in qwen-ui-lab",
      shareSnippet:
        "Browse UILaws-inspired components and export snippets your team can ship immediately.",
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
      title: "Apply UX laws with less guesswork",
      description: "Browse principles, inspect patterns, copy implementation snippets",
      workflow: "Open collection -> Compare patterns -> Export code",
      background:
        "linear-gradient(135deg, rgb(17, 24, 39) 0%, rgb(67, 56, 202) 45%, rgb(6, 182, 212) 100%)",
    };
  }

  return {
    routeLabel: "uilaws",
    title: "Build clearer interfaces faster",
    description: "Explore UILaws-driven components with copy and export in one flow",
    workflow: "Filter UILaws -> Preview UI -> Ship ready snippets",
    background:
      "linear-gradient(135deg, rgb(24, 24, 27) 0%, rgb(190, 24, 93) 45%, rgb(249, 115, 22) 100%)",
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
