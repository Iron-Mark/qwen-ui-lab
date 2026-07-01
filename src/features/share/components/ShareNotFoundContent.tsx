"use client";

import Link from "next/link";
import { AlertCircle, FileSearch, Home, ImageIcon } from "lucide-react";

import { PageContainer } from "@/components/layout/PageContainer";
import { buttonVariants } from "@/components/ui/button";
import { localizedHref } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale.client";
import { cn } from "@/lib/utils";

export function ShareNotFoundContent() {
  const { locale, dict } = useLocale();
  const t = dict.share;

  return (
    <PageContainer className="py-12 sm:py-16">
      <section
        aria-labelledby="share-not-found-heading"
        className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)] lg:items-start"
      >
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/45 px-3 py-1 text-sm font-semibold text-muted-foreground shadow-inner">
            <AlertCircle className="size-4 text-primary" aria-hidden />
            <span>{t.eyebrow}</span>
          </div>

          <div className="mt-5 space-y-3">
            <h1
              id="share-not-found-heading"
              className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            >
              {t.notFoundTitle}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              {t.notFoundDescription}
            </p>
          </div>

          <div
            className="mt-6 rounded-xl border border-border/70 bg-muted/35 p-4 text-sm leading-6 text-muted-foreground shadow-inner"
            data-testid="share-not-found-storage-hint"
          >
            <div className="flex gap-3">
              <FileSearch className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <p>{t.notFoundStorageHint}</p>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={localizedHref("/", locale)}
              className={cn(buttonVariants({ size: "lg" }), "min-h-11 gap-2 px-5")}
            >
              <Home className="size-4" aria-hidden />
              {t.backToWorkflow}
            </Link>
            <Link
              href={localizedHref("/demo", locale)}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-h-11 gap-2 px-5",
              )}
            >
              <ImageIcon className="size-4" aria-hidden />
              {t.sampleReference}
            </Link>
          </div>
        </div>

        <aside className="border-t border-border/70 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.notFoundRecoveryTitle}
          </p>
          <div className="mt-4 divide-y divide-border/70">
            <div className="pb-4">
              <div className="flex gap-3">
                <Home className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-card-foreground">
                    {t.backToWorkflow}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {t.notFoundRecoveryWorkflow}
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-4">
              <div className="flex gap-3">
                <ImageIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-card-foreground">
                    {t.sampleReference}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {t.notFoundRecoverySample}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </PageContainer>
  );
}
