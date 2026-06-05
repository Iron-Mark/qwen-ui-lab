import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountPageClient } from "@/app/account/AccountPageClient";
import { Skeleton } from "@/components/ui/skeleton";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { createRouteMetadata } from "@/lib/seo";

type AccountPageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export async function generateMetadata({
  searchParams,
}: AccountPageProps): Promise<Metadata> {
  const { lang } = await searchParams;
  const t = getDictionary(resolveLocale(lang)).account;

  return createRouteMetadata({
    title: t.eyebrow,
    description: t.subtitle,
    path: "/account",
    keywords: ["account", "guest mode", "demo auth", "local session"],
  });
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="py-10">
          <Skeleton className="mx-auto h-96 max-w-2xl rounded-2xl" aria-hidden />
        </div>
      }
    >
      <AccountPageClient />
    </Suspense>
  );
}
