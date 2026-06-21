import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  createLawsOfUxRouteMetadata,
  resolveDesignSystemDomainRedirectFromSearchParams,
  type DesignSystemDomainSearchParams,
} from "@/features/design-system/lib/design-system-route";

export const metadata: Metadata = createLawsOfUxRouteMetadata();

type LawsOfUxRedirectPageProps = {
  searchParams: DesignSystemDomainSearchParams;
};

export default async function LawsOfUxRedirectPage({
  searchParams,
}: LawsOfUxRedirectPageProps) {
  redirect(
    await resolveDesignSystemDomainRedirectFromSearchParams(
      "laws-of-ux",
      searchParams,
    ),
  );
}
