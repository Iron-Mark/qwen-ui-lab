import type { MetadataRoute } from "next";
import { createManifestConfig } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return createManifestConfig();
}
