import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

const STATIC_ROUTES = [
  "/",
  "/demo",
  "/design-system",
  "/design-system/laws-of-ux",
  "/design-system/uilaws",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  return STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
