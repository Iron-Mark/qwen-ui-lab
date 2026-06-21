"use client";

import Link from "next/link";

import { PageContainer } from "@/components/layout/PageContainer";
import { SharedSummaryCard } from "./SharedSummaryCard";
import { buttonVariants } from "@/components/ui/button";
import { localizedHref } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale.client";
import type { buildShareableSummary } from "../lib/share-result.mjs";
import { cn } from "@/lib/utils";

type SharePageClientProps = {
  id: string;
  summary: NonNullable<ReturnType<typeof buildShareableSummary>>;
};

export function SharePageClient({ id, summary }: SharePageClientProps) {
  const { locale, dict } = useLocale();
  const t = dict.share;
  const sharePath = `/share/${id}`;

  return (
    <PageContainer className="py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            {t.eyebrow}
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {t.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.descriptionLead}{" "}
            <span className="font-mono text-foreground">{sharePath}</span>{" "}
            {t.descriptionTrail}
          </p>
        </div>

        <SharedSummaryCard summary={summary} />

        <div className="flex flex-wrap gap-3">
          <Link
            href={localizedHref("/", locale)}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {t.tryLiveDemo}
          </Link>
          <Link
            href={localizedHref("/demo", locale)}
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            {t.oneClickDemo}
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
