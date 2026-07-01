"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageContainer } from "@/components/layout/PageContainer";
import { buttonVariants } from "@/components/ui/button";
import { localizedHref } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale.client";
import { cn } from "@/lib/utils";
import { readShareFromLocation } from "../lib/share-result.client";
import type { buildShareableSummary } from "../lib/share-result.mjs";
import { SharedSummaryCard } from "./SharedSummaryCard";
import { ShareNotFoundContent } from "./ShareNotFoundContent";

type ShareableResultSummary = NonNullable<ReturnType<typeof buildShareableSummary>>;

export function ShareHashFallbackContent() {
  const { locale, dict } = useLocale();
  const t = dict.share;
  const [summary, setSummary] = useState<ShareableResultSummary | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    function updateFromHash() {
      setSummary(readShareFromLocation());
      setHydrated(true);
    }

    const timeout = window.setTimeout(updateFromHash, 0);
    window.addEventListener("hashchange", updateFromHash);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("hashchange", updateFromHash);
    };
  }, []);

  if (!hydrated) {
    return (
      <PageContainer className="py-8 sm:py-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-border/70 bg-muted/20 p-6">
          <div className="h-6 w-44 rounded bg-muted" />
          <div className="mt-4 h-48 rounded-lg bg-muted/70" />
        </div>
      </PageContainer>
    );
  }

  if (!summary) {
    return <ShareNotFoundContent />;
  }

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
            {t.descriptionLead} {t.descriptionTrail}
          </p>
        </div>

        <SharedSummaryCard summary={summary} />

        <div className="flex flex-wrap gap-3">
          <Link
            href={localizedHref("/", locale)}
            className={cn(buttonVariants({ variant: "outline" }), "min-h-11 px-4")}
          >
            {t.backToWorkflow}
          </Link>
          <Link
            href={localizedHref("/demo", locale)}
            className={cn(buttonVariants({ variant: "ghost" }), "min-h-11 px-4")}
          >
            {t.sampleReference}
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
