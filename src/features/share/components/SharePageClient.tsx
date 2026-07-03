"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { SharedSummaryCard } from "./SharedSummaryCard";
import { useLocale } from "@/lib/i18n/use-locale.client";
import type { buildShareableSummary } from "../lib/share-result.mjs";
import { ShareSummaryActions } from "./ShareSummaryActions";

type SharePageClientProps = {
  id: string;
  summary: NonNullable<ReturnType<typeof buildShareableSummary>>;
};

export function SharePageClient({ id, summary }: SharePageClientProps) {
  const { dict } = useLocale();
  const t = dict.share;
  const sharePath = `/share/${id}`;

  return (
    <PageContainer className="py-8 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="max-w-2xl space-y-2">
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            {t.eyebrow}
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {t.title}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {t.descriptionLead}{" "}
            <span className="break-all font-mono text-foreground">{sharePath}</span>{" "}
            {t.descriptionTrail}
          </p>
        </div>

        <SharedSummaryCard summary={summary} />

        <ShareSummaryActions />
      </div>
    </PageContainer>
  );
}
