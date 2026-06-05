import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SharePageClient } from "@/app/share/[id]/SharePageClient";
import { Skeleton } from "@/components/ui/skeleton";
import { getDictionary, interpolate, resolveLocale } from "@/lib/i18n";
import { createRouteMetadata } from "@/lib/seo";
import { getShareRecord } from "@/lib/share-store.mjs";

export const runtime = "nodejs";

type SharePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export async function generateMetadata({ params, searchParams }: SharePageProps) {
  const { id } = await params;
  const { lang } = await searchParams;
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

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  const summary = await getShareRecord(id);

  if (!summary) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="py-10">
          <Skeleton className="mx-auto h-64 max-w-2xl rounded-2xl" aria-hidden />
        </div>
      }
    >
      <SharePageClient id={id} summary={summary} />
    </Suspense>
  );
}
