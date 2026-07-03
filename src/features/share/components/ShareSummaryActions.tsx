"use client";

import Link from "next/link";
import { Home, ImageIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { localizedHref } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale.client";
import { cn } from "@/lib/utils";

export function ShareSummaryActions() {
  const { locale, dict } = useLocale();
  const t = dict.share;

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href={localizedHref("/", locale)}
        className={cn(buttonVariants({ variant: "outline" }), "min-h-11 gap-2 px-4")}
      >
        <Home className="size-4" aria-hidden />
        {t.backToWorkflow}
      </Link>
      <Link
        href={localizedHref("/demo", locale)}
        className={cn(buttonVariants({ variant: "ghost" }), "min-h-11 gap-2 px-4")}
      >
        <ImageIcon className="size-4" aria-hidden />
        {t.openSampleRun}
      </Link>
    </div>
  );
}
