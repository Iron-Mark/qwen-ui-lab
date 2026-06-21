"use client";

import Link from "next/link";

import { PageContainer } from "@/components/layout/PageContainer";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { localizedHref } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale.client";
import { cn } from "@/lib/utils";

export function ShareNotFoundContent() {
  const { locale, dict } = useLocale();
  const t = dict.share;

  return (
    <PageContainer className="py-12">
      <Card className="mx-auto max-w-2xl border-border/80 bg-background shadow-sm">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase text-muted-foreground">
              {t.eyebrow}
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {t.notFoundTitle}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {t.notFoundDescription}
            </p>
          </div>
          <div
            className="rounded-md border border-border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground"
            data-testid="share-not-found-storage-hint"
          >
            {t.notFoundStorageHint}
          </div>
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
        </CardContent>
      </Card>
    </PageContainer>
  );
}
