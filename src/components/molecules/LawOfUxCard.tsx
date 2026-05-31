"use client";

import Link from "next/link";
import type { LawOfUx } from "@/data/lawsOfUx";
import { lawOfUxUrl, LAWS_OF_UX_SITE } from "@/data/lawsOfUx";
import { lawNames } from "@/data/uilaws";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { LawOfUxDemo } from "@/components/organisms/LawOfUxDemos";

const SURFACE_LABELS = {
  upload: "Upload flow",
  dashboard: "Dashboard",
  catalog: "Design catalog",
} as const;

interface LawOfUxCardProps {
  law: LawOfUx;
  className?: string;
}

export function LawOfUxCard({ law, className }: LawOfUxCardProps) {
  const uiLawLabels = law.relatedUiLawIds ? lawNames(law.relatedUiLawIds) : [];

  return (
    <Card className={cn("overflow-hidden shadow-sm", className)}>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{law.name}</CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{law.summary}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {SURFACE_LABELS[law.demoSurface]}
          </Badge>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          <span className="font-semibold text-card-foreground">In this app: </span>
          {law.application}
        </p>
        {uiLawLabels.length > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-semibold text-card-foreground">Related UI Laws: </span>
            {uiLawLabels.join(", ")}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="min-h-[8rem] border-b bg-background/50 p-4 sm:p-6">
        <LawOfUxDemo lawId={law.id} />
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <Link href={law.inAppHref} className={buttonVariants({ variant: "link", size: "sm" })}>
          See in app →
        </Link>
        <a
          href={lawOfUxUrl(law.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-card-foreground hover:underline"
        >
          {LAWS_OF_UX_SITE.replace("https://", "")}/{law.slug}
        </a>
      </CardFooter>
    </Card>
  );
}
