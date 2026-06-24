"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LayoutDashboard, PanelsTopLeft, UserRound } from "lucide-react";
import { AppearanceMenu } from "./AppearanceMenu";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createExperimentConfig, resolveExperimentVariant } from "@/lib/experiments";
import { localizedHref } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale.client";
import { buildAccountModalHref } from "@/features/account/components/AccountModal";
import { AccountNavLabel } from "@/features/account/components/AccountNavLabel";
import { PageContainer } from "@/components/layout/PageContainer";
import { cn } from "@/lib/utils";

const DemoModeSnackbar = dynamic(
  () =>
    import("./DemoModeSnackbar").then((mod) => mod.DemoModeSnackbar),
  { ssr: false },
);

type ShellTitleContext = {
  title: string;
  subtitle?: string;
};

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale, dict } = useLocale();
  const t = dict.header;
  const [shellTitleContext, setShellTitleContext] =
    useState<ShellTitleContext | null>(null);
  const isDesignSystemPath = pathname?.startsWith("/design-system") ?? false;
  const accountOpen = searchParams.get("account") === "1";
  const accountHref = useMemo(
    () =>
      buildAccountModalHref(
        pathname,
        new URLSearchParams(searchParams.toString()),
        true,
      ),
    [pathname, searchParams],
  );
  const designSystemVariant = useMemo(() => {
    const config = createExperimentConfig(process.env);
    return resolveExperimentVariant("headerDesignSystemCta", "anonymous", config);
  }, []);
  const activeShellTitleContext = isDesignSystemPath ? shellTitleContext : null;
  const brandTitle = activeShellTitleContext?.title ?? t.siteTitle;
  const brandSubtitle = activeShellTitleContext?.subtitle ?? t.siteTagline;

  useEffect(() => {
    if (!isDesignSystemPath) return;

    let animationFrame = 0;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const updateTitleContext = () => {
      const marker = document.querySelector<HTMLElement>(
        "[data-shell-title-context]",
      );
      const shellHeader =
        document.querySelector<HTMLElement>("[data-shell-header]");

      if (!marker) {
        setShellTitleContext(null);
        return;
      }

      const headerHeight = shellHeader?.offsetHeight ?? 64;
      const markerBottom = marker.getBoundingClientRect().bottom;
      const isPastIntro = markerBottom <= headerHeight + 4;

      if (!isPastIntro) {
        setShellTitleContext(null);
        return;
      }

      const nextTitle = marker.dataset.shellTitle?.trim();
      if (!nextTitle) {
        setShellTitleContext(null);
        return;
      }

      const nextSubtitle = marker.dataset.shellSubtitle?.trim() || undefined;
      setShellTitleContext((current) => {
        if (current?.title === nextTitle && current.subtitle === nextSubtitle) {
          return current;
        }
        return { title: nextTitle, subtitle: nextSubtitle };
      });
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updateTitleContext);
    };

    scheduleUpdate();
    fallbackTimer = setTimeout(scheduleUpdate, 250);

    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      cancelAnimationFrame(animationFrame);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [isDesignSystemPath]);

  return (
    <header
      lang={locale}
      data-shell-header
      className="sticky top-0 z-40 border-b border-border/80 bg-card/85 backdrop-blur-md"
    >
      <DemoModeSnackbar />
      <PageContainer className="flex h-16 min-w-0 items-center gap-2 px-2 sm:gap-3 sm:px-6 lg:gap-4 lg:px-8">
        <Link
          href={localizedHref("/", locale)}
          aria-label={t.siteTitle}
          className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-3 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:min-w-0 md:justify-start"
        >
          <Image
            src="/icons/icon.svg"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-xl shadow-[0_6px_18px_color-mix(in_oklch,var(--primary)_35%,transparent)]"
            fetchPriority="low"
          />
          <div className="hidden min-w-0 md:block">
            <p
              data-testid="header-brand-title"
              className="truncate text-lg font-bold text-card-foreground transition-colors"
            >
              {brandTitle}
            </p>
            <p
              data-testid="header-brand-subtitle"
              className="truncate text-xs text-muted-foreground transition-colors"
            >
              {brandSubtitle}
            </p>
          </div>
        </Link>
        <nav
          className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden md:gap-2"
          aria-label={t.navMainAria}
        >
          <Link
            href={localizedHref("/", locale)}
            aria-label={t.navDashboardAria}
            className={cn(
              buttonVariants({
                variant: pathname === "/" ? "secondary" : "ghost",
                size: "lg",
              }),
              "size-11 min-h-11 shrink-0 gap-0 px-0 md:w-auto md:gap-2 md:px-3",
            )}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            <LayoutDashboard className="size-4 shrink-0" aria-hidden />
            <span className="hidden md:inline">{t.navDashboard}</span>
          </Link>
          <Link
            href={localizedHref("/design-system", locale)}
            aria-label={t.navDesignSystemAria}
            className={cn(
              buttonVariants({
                variant: pathname.startsWith("/design-system") ? "secondary" : "ghost",
                size: "lg",
              }),
              "size-11 min-h-11 shrink-0 gap-0 px-0 md:w-auto md:gap-2 md:px-3",
            )}
            aria-current={pathname.startsWith("/design-system") ? "page" : undefined}
          >
            <PanelsTopLeft className="size-4 shrink-0" aria-hidden />
            <span className="hidden md:inline">{t.navDesignSystem}</span>
            {designSystemVariant === "with-labs-badge" ? (
              <Badge variant="secondary" className="hidden h-5 px-1.5 text-[10px] uppercase lg:inline-flex">
                {t.labsBadge}
              </Badge>
            ) : null}
          </Link>
        </nav>
        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
          <Link
            href={accountHref}
            aria-label={t.navAccountAria}
            aria-haspopup="dialog"
            aria-expanded={accountOpen}
            data-testid="header-account-link"
            className={cn(
              buttonVariants({
                variant: accountOpen ? "secondary" : "ghost",
                size: "lg",
              }),
              "size-11 min-h-11 shrink-0 gap-0 px-0 md:w-auto md:gap-2 md:px-3",
            )}
          >
            <UserRound className="size-4 shrink-0" aria-hidden />
            <AccountNavLabel
              guestLabel={t.navAccountGuest}
              className="hidden max-w-[8rem] truncate md:inline"
            />
          </Link>
          <AppearanceMenu />
        </div>
      </PageContainer>
    </header>
  );
}
