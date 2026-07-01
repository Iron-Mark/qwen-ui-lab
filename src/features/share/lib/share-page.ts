import { getDictionary, interpolate, resolveLocale } from "@/lib/i18n";
import { createRouteMetadata } from "@/lib/seo";
import { getShareRecord } from "./share-store.mjs";

export type ShareRouteParams = Promise<{ id: string }>;
export type ShareRouteSearchParams = Promise<{ lang?: string }>;

export type ShareRouteProps = {
  params: ShareRouteParams;
  searchParams: ShareRouteSearchParams;
};

export async function createShareRouteMetadata({
  id,
  lang,
}: {
  id: string;
  lang?: string;
}) {
  const locale = resolveLocale(lang);
  const t = getDictionary(locale).share;
  const summary = await getShareRecord(id);

  if (!summary) {
    return createRouteMetadata({
      title: t.metadataNotFoundTitle,
      description: t.metadataNotFoundDescription,
      path: `/share/${id}`,
    });
  }

  return createRouteMetadata({
    title: interpolate(t.metadataTitle, { file: summary.file }),
    description: summary.summary,
    path: `/share/${id}`,
  });
}

export async function createShareRouteMetadataFromParams({
  params,
  searchParams,
}: ShareRouteProps) {
  const { id } = await params;
  const { lang } = await searchParams;
  return createShareRouteMetadata({ id, lang });
}

export function resolveShareRouteSummary(id: string) {
  return getShareRecord(id);
}

export async function resolveSharePageModel({
  params,
}: Pick<ShareRouteProps, "params">) {
  const { id } = await params;

  if (id === "local") {
    return { id, summary: null, hashFallback: true };
  }

  const summary = await resolveShareRouteSummary(id);

  if (!summary) {
    return null;
  }

  return { id, summary, hashFallback: false };
}
