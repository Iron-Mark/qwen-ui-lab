"use client";

import { useLocale } from "@/lib/i18n/use-locale.client";

export function DesignSystemLcpHeader() {
  const { locale, dict } = useLocale();
  const t = dict.designSystem;

  return (
    <header
      data-testid="design-system-title-block"
      data-shell-title-context
      data-shell-title={t.eyebrow}
      data-shell-subtitle={t.title}
      lang={locale}
      className="scroll-mt-20 px-1 py-2 sm:px-2 sm:py-3"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t.eyebrow}
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {t.title}
      </h1>
      <p className="growth-snippet mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
    </header>
  );
}
