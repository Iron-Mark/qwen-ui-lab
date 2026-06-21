"use client";

import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { buttonVariants } from "@/components/ui/button";
import { localizedHref } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale.client";
import { cn } from "@/lib/utils";

export function NotFoundClient() {
  const { locale, dict } = useLocale();
  const t = dict.notFound;

  return (
    <PageContainer
      as="section"
      aria-labelledby="not-found-heading"
      className="flex flex-col items-center py-16 text-center sm:py-24"
    >
      <p
        aria-hidden="true"
        className="text-7xl font-bold tracking-tight text-success sm:text-8xl"
      >
        404
      </p>

      <h1
        id="not-found-heading"
        className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
      >
        {t.title}
      </h1>

      <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">
        {t.description}
      </p>

      <nav
        aria-label={t.navAria}
        className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4"
      >
        <Link
          href={localizedHref("/", locale)}
          className={cn(buttonVariants(), "min-h-11 px-5")}
        >
          {t.backDashboard}
        </Link>
        <Link
          href={localizedHref("/design-system", locale)}
          className={cn(buttonVariants({ variant: "outline" }), "min-h-11 px-5")}
        >
          {t.designSystem}
        </Link>
      </nav>
    </PageContainer>
  );
}
