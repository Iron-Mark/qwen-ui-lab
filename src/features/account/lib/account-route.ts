import type { Metadata } from "next";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { createRouteMetadata } from "@/lib/seo";

export type AccountRouteSearchParams = Promise<{ lang?: string }>;

export type AccountRoutePageProps = {
  searchParams: AccountRouteSearchParams;
};

export function createAccountRouteMetadata(lang?: string): Metadata {
  const t = getDictionary(resolveLocale(lang)).account;

  return createRouteMetadata({
    title: t.eyebrow,
    description: t.subtitle,
    path: "/account",
    keywords: ["account", "guest mode", "demo auth", "local session"],
  });
}

export async function createAccountRouteMetadataFromParams({
  searchParams,
}: AccountRoutePageProps): Promise<Metadata> {
  const { lang } = await searchParams;
  return createAccountRouteMetadata(lang);
}
