import { redirect } from "next/navigation";
import {
  createAccountModalRedirectHrefFromParams,
  createAccountRouteMetadataFromParams,
  type AccountRoutePageProps,
} from "@/features/account/lib/account-route";

export async function generateMetadata(props: AccountRoutePageProps) {
  return createAccountRouteMetadataFromParams(props);
}

export default async function AccountPage(props: AccountRoutePageProps) {
  redirect(await createAccountModalRedirectHrefFromParams(props));
}
