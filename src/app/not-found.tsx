import { NotFoundContent } from "@/features/shell/components/NotFoundContent";
import { createNotFoundRouteMetadata } from "@/features/shell/lib/shell-route";

export const metadata = createNotFoundRouteMetadata();

export default function NotFound() {
  return <NotFoundContent />;
}
