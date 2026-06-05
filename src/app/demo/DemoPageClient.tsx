"use client";

import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { demoArchetypeLabel } from "@/lib/demo-archetypes.mjs";

const UploadFlow = dynamic(
  () => import("@/components/organisms/UploadFlow").then((mod) => mod.UploadFlow),
  {
    ssr: false,
    loading: () => (
      <PageContainer as="section" id="upload-flow" className="scroll-mt-20 py-8">
        <div className="min-h-[28rem] animate-pulse rounded-xl border border-border/60 bg-muted/25" />
      </PageContainer>
    ),
  },
);

export interface DemoPageClientProps {
  demoArchetype: string;
}

export function DemoPageClient({ demoArchetype }: DemoPageClientProps) {
  const label = demoArchetypeLabel(demoArchetype);

  return (
    <main className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top,oklch(0.97_0_0),transparent_65%)] dark:bg-[radial-gradient(circle_at_top,oklch(0.26_0_0),transparent_65%)]" />
      <div className="relative border-b border-border/60 bg-card/30">
        <PageContainer className="py-8 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1.5 text-xs font-medium">
                  <Sparkles className="size-3.5" aria-hidden />
                  One-click demo
                </Badge>
                <Badge
                  variant="outline"
                  className="border-amber-500/40 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-100"
                >
                  Offline-safe · no upload required
                </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Preloaded {label} analysis
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                This route loads a bundled reference, runs analyze, and opens the
                scaffold export panel—ideal for stage demos. Try{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  ?archetype=auth|mobile|landing|settings|shop
                </code>{" "}
                for other layouts.
              </p>
            </div>
          </div>
        </PageContainer>
      </div>
      <UploadFlow
        key={demoArchetype}
        demoArchetype={demoArchetype}
        autoRunDemo
      />
    </main>
  );
}
