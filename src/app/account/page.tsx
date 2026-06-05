import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountPageClient } from "@/app/account/AccountPageClient";
import { Skeleton } from "@/components/ui/skeleton";
import { createRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = createRouteMetadata({
  title: "Account",
  description:
    "Demo-safe local account stub — guest mode by default, optional display name or magic-link flow stored in sessionStorage only.",
  path: "/account",
  keywords: ["account", "guest mode", "demo auth", "local session"],
});

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
