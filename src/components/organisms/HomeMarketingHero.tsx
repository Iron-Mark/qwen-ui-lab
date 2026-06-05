import Link from "next/link";
import {
  ArrowRight,
  Layers,
  ShieldCheck,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE_PITCH } from "@/lib/seo";

const VALUE_PROPS = [
  {
    icon: Upload,
    title: "Start from any screenshot",
    body: "Drop PNG, JPG, SVG, or WebP—or load the built-in sample in one click.",
  },
  {
    icon: Sparkles,
    title: "See structure before you code",
    body: "Get layout analysis, plan cards, and a React + Tailwind scaffold you can refine.",
  },
  {
    icon: Layers,
    title: "Polish with the design system",
    body: "Browse atomic snippets and UX-law patterns to speed up the last mile.",
  },
] as const;

const TRUST_SIGNALS = [
  { icon: ShieldCheck, label: "Demo mode — no API key" },
  { icon: Zap, label: "Runs offline for meetups" },
] as const;

export function HomeMarketingHero() {
  return (
    <section
      data-testid="home-marketing-hero"
      aria-labelledby="home-hero-heading"
      className="border-b border-border/60 bg-card/30"
    >
      <PageContainer className="py-8 sm:py-10 md:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">
                Qwen meetup demo
              </Badge>
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-100"
              >
                Offline-safe · instant preview
              </Badge>
            </div>
            <h1
              id="home-hero-heading"
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl md:leading-[1.1]"
            >
              Turn UI screenshots into scaffold-ready React
            </h1>
            <p className="growth-snippet max-w-2xl text-base text-muted-foreground sm:text-lg">
              {SITE_PITCH} Upload, analyze, and export in minutes—built for live
              presentations without touching production APIs.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="#upload-flow"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 gap-2 px-5",
                )}
              >
                Try the live flow
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/design-system"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 gap-2 px-5",
                )}
              >
                Explore design system
              </Link>
            </div>
            <ul
              className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
              aria-label="Trust signals"
            >
              {TRUST_SIGNALS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon
                    className="size-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ul
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [content-visibility:auto] [contain-intrinsic-size:auto_280px]"
          aria-label="Key benefits"
        >
          {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </PageContainer>
    </section>
  );
}
