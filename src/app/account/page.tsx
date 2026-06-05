import type { Metadata } from "next";
import { AccountPageClient } from "@/app/account/AccountPageClient";
import { createRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = createRouteMetadata({
  title: "Account",
  description:
    "Demo-safe local account stub — guest mode by default, optional display name or magic-link flow stored in sessionStorage only.",
  path: "/account",
  keywords: ["account", "guest mode", "demo auth", "local session"],
});

export default function AccountPage() {
  return <AccountPageClient />;
}
