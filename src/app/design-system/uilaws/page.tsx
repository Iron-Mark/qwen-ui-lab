import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  createUiLawsRouteMetadata,
  resolveDesignSystemDomainRedirectFromSearchParams,
  type DesignSystemDomainSearchParams,
} from "@/features/design-system/lib/design-system-route";

export const metadata: Metadata = createUiLawsRouteMetadata();

type UILawsRedirectPageProps = {
  searchParams: DesignSystemDomainSearchParams;
};

export default async function UILawsRedirectPage({
  searchParams,
}: UILawsRedirectPageProps) {
  redirect(
    await resolveDesignSystemDomainRedirectFromSearchParams("uilaws", searchParams),
  );
}
