"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Compass, Home, LayoutGrid } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { buttonVariants } from "@/components/ui/button";
import { localizedHref } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale.client";
import { cn } from "@/lib/utils";

export function NotFoundClient() {
  const { locale, dict } = useLocale();
  const t = dict.notFound;

  useEffect(() => {
    document.title = `${t.title} | qwen-ui-lab`;
  }, [t.title]);

  return (
    <PageContainer
      as="section"
      aria-labelledby="not-found-heading"
      className="py-12 sm:py-20"
    >
      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)] lg:items-center">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/45 px-3 py-1 text-sm font-semibold text-muted-foreground shadow-inner">
            <Compass className="size-4 text-primary" aria-hidden />
            <span aria-hidden="true">404</span>
          </div>

          <h1
            id="not-found-heading"
            className="mt-5 max-w-2xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            {t.title}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t.description}
          </p>

          <nav
            aria-label={t.navAria}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4"
          >
            <Link
              href={localizedHref("/", locale)}
              className={cn(buttonVariants({ size: "lg" }), "min-h-11 gap-2 px-5")}
            >
              <Home className="size-4" aria-hidden />
              {t.backToWorkflow}
            </Link>
            <Link
              href={localizedHref("/design-system", locale)}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-h-11 gap-2 px-5",
              )}
            >
              <LayoutGrid className="size-4" aria-hidden />
              {t.designSystem}
            </Link>
          </nav>
        </div>

        <div
          aria-hidden="true"
          className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" />
            {t.suggestedPages}
          </div>
          <div className="mt-4 grid gap-2">
            {[t.backToWorkflow, t.designSystem].map((label) => (
              <div
                key={label}
                className="flex min-h-11 items-center justify-between rounded-lg border border-border/70 bg-background/70 px-3 text-sm font-medium text-card-foreground"
              >
                <span className="truncate">{label}</span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
