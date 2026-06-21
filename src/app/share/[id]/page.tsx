import { notFound } from "next/navigation";

import { SharePageContent } from "@/features/share/components/SharePageContent";
import {
  createShareRouteMetadataFromParams,
  resolveSharePageModel,
  type ShareRouteProps,
} from "@/features/share/lib/share-page";

export const runtime = "nodejs";

export async function generateMetadata(props: ShareRouteProps) {
  return createShareRouteMetadataFromParams(props);
}

export default async function SharePage({ params }: ShareRouteProps) {
  const model = await resolveSharePageModel({ params });

  if (!model) {
    notFound();
  }

  return <SharePageContent id={model.id} summary={model.summary} />;
}
