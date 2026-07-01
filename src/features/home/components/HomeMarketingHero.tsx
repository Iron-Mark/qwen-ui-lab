"use client";

import Link from "next/link";
import Image from "next/image";
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
import { buttonVariants } from "@/components/ui/button";
import { AnalyticsEvent, createAnalyticsClient } from "@/lib/analytics.client";
import { localizedHref } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale.client";
import { useProviderMode } from "@/components/providers/ProviderModeProvider";
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
      label: copy.benefitUploadLabel,
      title: copy.benefitUploadTitle,
      body: copy.benefitUploadBody,
    },
    {
      icon: Sparkles,
      label: copy.benefitAnalyzeLabel,
      title: copy.benefitAnalyzeTitle,
      body: copy.benefitAnalyzeBody,
    },
    {
      icon: Layers,
      label: copy.benefitDesignLabel,
      title: copy.benefitDesignTitle,
      body: copy.benefitDesignBody,
    },
  ] as const;

  const trustSignals = [
    { icon: ShieldCheck, label: copy.trustBrowserSafe },
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
      className="relative isolate overflow-hidden border-b border-border/60 bg-background"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image
          data-testid="home-hero-visual"
          src="/references/dashboard-reference.webp"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover object-[72%_20%] opacity-35 contrast-[1.03] saturate-[0.96] blur-[0.2px] sm:object-[68%_28%] sm:opacity-90 sm:blur-0 lg:opacity-100 dark:opacity-20 sm:dark:opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background from-[0%] via-background/95 via-[58%] to-background/70 sm:via-background/90 sm:via-[44%] sm:to-background/5 dark:via-background/95 dark:to-background/80 sm:dark:to-background/65" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/85 to-transparent" />
      </div>

      <PageContainer className="flex min-h-[29rem] flex-col justify-center py-9 sm:min-h-[32rem] sm:py-11 lg:min-h-[34rem]">
        <div className="max-w-[42rem] space-y-5">
          <div className="space-y-5">
            <div
              className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-2xl border border-border/70 bg-background/80 p-1 text-xs shadow-sm backdrop-blur-md"
              aria-label="Workflow status"
            >
              <span className="inline-flex min-h-7 items-center gap-1.5 rounded-xl bg-primary px-2.5 py-1 font-semibold text-primary-foreground shadow-sm">
                <Sparkles className="size-3.5" aria-hidden />
                {copy.badgeProduct}
              </span>
              <span className="inline-flex min-h-7 items-center gap-1.5 rounded-xl px-2.5 py-1 font-medium text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" aria-hidden />
                {copy.badgeOffline}
              </span>
            </div>
            <h1
              id="home-hero-heading"
              className="max-w-xl text-4xl font-bold leading-[1.03] text-foreground sm:text-5xl md:text-6xl"
            >
              {copy.title}
            </h1>
            <p className="growth-snippet max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              {copy.subtitle}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href={uploadFlowHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "min-h-11 gap-2 px-5 py-2.5 shadow-sm",
                )}
                onClick={() => trackCta("try_live_flow")}
              >
                {copy.ctaPrimary}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href={localizedHref("/demo", locale)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "min-h-11 gap-2 px-5 py-2.5",
                )}
              >
                {copy.sampleReference}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href={localizedHref("/design-system", locale)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "min-h-11 gap-2 px-5 py-2.5",
                )}
                onClick={() => trackCta("explore_design_system")}
              >
                {copy.ctaSecondary}
              </Link>
            </div>
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

        <ol
          data-testid="hero-benefit-rail"
          className="mt-7 grid max-w-3xl grid-cols-3 overflow-hidden rounded-xl border border-border/70 bg-card/75 shadow-sm backdrop-blur-md sm:mt-8"
          aria-label={copy.keyBenefitsAria}
        >
          {valueProps.map(({ icon: Icon, label, title, body }, index) => (
            <li
              key={title}
              aria-label={`${label}: ${title}. ${body}`}
              className="relative flex min-h-16 items-center justify-center gap-2 border-l border-border/70 px-2.5 py-2.5 text-center first:border-l-0 sm:min-h-[4.75rem] sm:justify-start sm:gap-3 sm:px-4 sm:py-3 sm:text-left"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-10">
                <Icon className="size-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold leading-3 text-muted-foreground sm:text-xs sm:leading-4">
                  0{index + 1}
                </p>
                <p className="truncate text-xs font-semibold leading-4 text-foreground sm:text-sm sm:leading-5">
                  {label}
                </p>
                <span className="sr-only">
                  {title}. {body}
                </span>
              </div>
              {index < valueProps.length - 1 ? (
                <ArrowRight
                  className="absolute right-3 hidden size-4 text-muted-foreground/60 lg:block"
                  aria-hidden
                />
              ) : null}
            </li>
          ))}
        </ol>
      </PageContainer>
    </section>
  );
}
