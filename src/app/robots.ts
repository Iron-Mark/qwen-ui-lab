import type { MetadataRoute } from "next";
import { createRobotsConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return createRobotsConfig();
}
