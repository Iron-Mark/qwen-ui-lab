"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Layers,
  ShieldCheck,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useObservability } from "@/components/providers/ObservabilityProvider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { AnalyticsEvent, createAnalyticsClient } from "@/lib/analytics";
import { localizedHref, useLocale } from "@/lib/i18n";
import { useProviderMode } from "@/lib/provider-mode";
import { cn } from "@/lib/utils";

export function HomeMarketingHero() {
  const pathname = usePathname();
  const { locale, dict } = useLocale();
  const copy = dict.hero;
  const observability = useObservability();
  const { mode } = useProviderMode();

  const analytics = useMemo(
    () =>
      createAnalyticsClient({
        hooks: observability,
        providerMode: mode,
        route: pathname ?? "/",
      }),
    [mode, observability, pathname],
  );

  useEffect(() => {
    analytics.track(AnalyticsEvent.HomeHeroViewed, {
      source: "home_hero",
      feature: "marketing_hero",
      route: "/",
    });
  }, [analytics]);

  const valueProps = [
    {
      icon: Upload,
      title: copy.benefitUploadTitle,
      body: copy.benefitUploadBody,
    },
    {
      icon: Sparkles,
      title: copy.benefitAnalyzeTitle,
      body: copy.benefitAnalyzeBody,
    },
    {
      icon: Layers,
      title: copy.benefitDesignTitle,
      body: copy.benefitDesignBody,
    },
  ] as const;

  const trustSignals = [
    { icon: ShieldCheck, label: copy.trustDemo },
    { icon: Zap, label: copy.trustOffline },
  ] as const;

  function trackCta(feature: string) {
    analytics.track(AnalyticsEvent.HomeHeroCtaClicked, {
      source: "home_hero",
      feature,
      trigger: "link",
    });
  }

  const uploadFlowHref = `${localizedHref("/", locale)}#upload-flow`;

  return (
    <section
      data-testid="home-marketing-hero"
      lang={locale}
      aria-labelledby="home-hero-heading"
      className="border-b border-border/60 bg-card/30"
    >
      <PageContainer className="py-8 sm:py-10 md:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">
                {copy.badgeDemo}
              </Badge>
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-100"
              >
                {copy.badgeOffline}
              </Badge>
            </div>
            <h1
              id="home-hero-heading"
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl md:leading-[1.1]"
            >
              {copy.title}
            </h1>
            <p className="growth-snippet max-w-2xl text-base text-muted-foreground sm:text-lg">
              {copy.subtitle}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href={localizedHref("/demo", locale)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 gap-2 px-5",
                )}
              >
                {copy.oneClickDemo}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href={uploadFlowHref}
                className={cn(buttonVariants({ size: "lg" }), "h-11 gap-2 px-5")}
                onClick={() => trackCta("try_live_flow")}
              >
                {copy.ctaPrimary}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href={localizedHref("/design-system", locale)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 gap-2 px-5",
                )}
                onClick={() => trackCta("explore_design_system")}
              >
                {copy.ctaSecondary}
              </Link>
            </div>
            <ul
              className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
              aria-label={copy.trustSignalsAria}
            >
              {trustSignals.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ul
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [content-visibility:auto] [contain-intrinsic-size:auto_280px]"
          aria-label={copy.keyBenefitsAria}
        >
          {valueProps.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </PageContainer>
    </section>
  );
}
