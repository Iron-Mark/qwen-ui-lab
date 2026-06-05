import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { buildDesignSystemDomainRedirect } from "@/lib/design-system-state.mjs";
import { resolveLocale } from "@/lib/i18n";
import { createRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = {
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

type UILawsRedirectPageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function UILawsRedirectPage({
  searchParams,
}: UILawsRedirectPageProps) {
  const { lang } = await searchParams;
  const locale = resolveLocale(lang);
  redirect(buildDesignSystemDomainRedirect("uilaws", locale));
}
