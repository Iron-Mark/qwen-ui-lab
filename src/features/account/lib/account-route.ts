import { resolveLocale } from "@/lib/i18n";

export type AccountRouteSearchParams = Promise<{ lang?: string }>;

export type AccountRoutePageProps = {
  searchParams: AccountRouteSearchParams;
};

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
