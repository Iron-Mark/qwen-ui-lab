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
    keywords: ["profile", "display name", "saved analyses", "screenshot workflow"],
  });
}

export async function createAccountRouteMetadataFromParams({
  searchParams,
}: AccountRoutePageProps): Promise<Metadata> {
  const { lang } = await searchParams;
  return createAccountRouteMetadata(lang);
}

export function createAccountModalRedirectHref(lang?: string): string {
  const locale = resolveLocale(lang);
  const params = new URLSearchParams({ account: "1" });

  if (locale === "zh") {
    params.set("lang", locale);
  }

  return `/?${params.toString()}`;
}

export async function createAccountModalRedirectHrefFromParams({
  searchParams,
}: AccountRoutePageProps): Promise<string> {
  const { lang } = await searchParams;
  return createAccountModalRedirectHref(lang);
}
