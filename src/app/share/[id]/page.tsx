import Link from "next/link";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { SharedSummaryCard } from "@/components/molecules/SharedSummaryCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createRouteMetadata } from "@/lib/seo";
import { getShareRecord } from "@/lib/share-store.mjs";

export const runtime = "nodejs";

type SharePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: SharePageProps) {
  const { id } = await params;
  const summary = await getShareRecord(id);

  if (!summary) {
    return createRouteMetadata({
      title: "Share not found",
      description: "This read-only analysis summary link is missing or expired.",
      path: `/share/${id}`,
    });
  }

  return createRouteMetadata({
    title: `Shared summary · ${summary.file}`,
    description: summary.summary,
    path: `/share/${id}`,
  });
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  const summary = await getShareRecord(id);

  if (!summary) {
    notFound();
  }

  return (
    <PageContainer className="py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            Share link
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Read-only analysis summary
          </h1>
          <p className="text-sm text-muted-foreground">
            Short link <span className="font-mono text-foreground">/share/{id}</span> —
            summary only, no generated code or API secrets.
          </p>
        </div>

        <SharedSummaryCard summary={summary} />

        <div className="flex flex-wrap gap-3">
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            Try the live demo
          </Link>
          <Link href="/demo" className={cn(buttonVariants({ variant: "ghost" }))}>
            One-click demo
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
