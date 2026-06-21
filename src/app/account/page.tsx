import { AccountPageContent } from "@/features/account/components/AccountPageContent";
import {
  createAccountRouteMetadataFromParams,
  type AccountRoutePageProps,
} from "@/features/account/lib/account-route";

export async function generateMetadata(props: AccountRoutePageProps) {
  return createAccountRouteMetadataFromParams(props);
}

export default function AccountPage() {
  return <AccountPageContent />;
}
