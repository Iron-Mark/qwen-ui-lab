import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { buildDesignSystemDomainRedirect } from "@/features/design-system/lib/design-system-state.mjs";
import { resolveLocale } from "@/lib/i18n";
import { createRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = {
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

type LawsOfUxRedirectPageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function LawsOfUxRedirectPage({
  searchParams,
}: LawsOfUxRedirectPageProps) {
  const { lang } = await searchParams;
  const locale = resolveLocale(lang);
  redirect(buildDesignSystemDomainRedirect("laws-of-ux", locale));
}
