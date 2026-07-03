"use client";

import dynamic from "next/dynamic";
import { PlayCircle } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { sampleRunLabel } from "../lib/sample-run-archetypes.mjs";

const UploadFlow = dynamic(
  () => import("@/features/analysis/components/UploadFlow").then((mod) => mod.UploadFlow),
  {
    ssr: false,
    loading: () => (
      <PageContainer as="section" id="upload-flow" className="scroll-mt-20 py-8">
        <div className="min-h-[28rem] animate-pulse rounded-xl border border-border/60 bg-muted/25" />
      </PageContainer>
    ),
  },
);

export interface SampleRunPageClientProps {
  sampleRunId: string;
}

export function SampleRunPageClient({
  sampleRunId,
}: SampleRunPageClientProps) {
  const label = sampleRunLabel(sampleRunId);

  return (
    <main className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top,oklch(0.97_0_0),transparent_65%)] dark:bg-[radial-gradient(circle_at_top,oklch(0.26_0_0),transparent_65%)]" />
      <div className="relative border-b border-border/60 bg-card/30">
        <PageContainer className="py-8 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-3">
              <Badge variant="secondary" className="w-fit gap-1.5 text-xs font-medium">
                <PlayCircle className="size-3.5" aria-hidden />
                Sample run
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {label} layout
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Review detected structure, starter preview, and export
                package from a guided layout.
              </p>
            </div>
          </div>
        </PageContainer>
      </div>
      <UploadFlow
        key={sampleRunId}
        sampleRunId={sampleRunId}
        autoRunSample
      />
    </main>
  );
}
