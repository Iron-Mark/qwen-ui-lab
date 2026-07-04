import { redirect } from "next/navigation";
import {
  createAccountModalRedirectHrefFromParams,
  type AccountRoutePageProps,
} from "@/features/account/lib/account-route";

export default async function AccountPage(props: AccountRoutePageProps) {
  redirect(await createAccountModalRedirectHrefFromParams(props));
}
