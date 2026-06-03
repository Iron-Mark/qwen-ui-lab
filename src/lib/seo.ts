import type { Metadata } from "next";

const DEFAULT_SITE_URL = "http://localhost:3000";
export const SITE_NAME = "qwen-ui-lab";
export const SITE_TAGLINE = "Screenshot-to-scaffold meetup demo";
export const SITE_PITCH =
  "Turn UI screenshots into React + Tailwind scaffolds with Qwen3-VL and Qwen Code.";
export const DEFAULT_OG_IMAGE = "/opengraph-image";

function normalizeUrl(rawUrl: string): string {
  const withProtocol = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!envUrl) {
    return DEFAULT_SITE_URL;
  }
  return normalizeUrl(envUrl);
}

export function toAbsoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

type RouteMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImage?: string;
  ogImageAlt?: string;
  twitterImage?: string;
  twitterImageAlt?: string;
  shareSnippet?: string;
};

export function createRouteMetadata({
  title,
  description,
  path,
  keywords = [],
  ogImage = DEFAULT_OG_IMAGE,
  ogImageAlt = `${SITE_NAME} social preview`,
  twitterImage = ogImage,
  twitterImageAlt = ogImageAlt,
  shareSnippet,
}: RouteMetadataInput): Metadata {
  return {
    title: {
      absolute: `${title} | ${SITE_NAME}`,
    },
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: `${SITE_NAME} | ${title}`,
      description,
      type: "website",
      url: path,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} | ${title}`,
      description,
      images: [
        {
          url: twitterImage,
          alt: twitterImageAlt,
        },
      ],
    },
    ...(shareSnippet
      ? {
          other: {
            "share:snippet": shareSnippet,
          },
        }
      : {}),
  };
}

type StructuredDataThing = Record<string, unknown>;

type RouteStructuredDataInput = {
  title: string;
  description: string;
  path: string;
  breadcrumbLabel?: string;
  about?: string[];
  audience?: string;
  callToAction?: string;
  additionalGraph?: StructuredDataThing[];
};

export function createRouteStructuredData({
  title,
  description,
  path,
  breadcrumbLabel,
  about = [],
  audience = "Frontend engineers and product teams",
  callToAction,
  additionalGraph = [],
}: RouteStructuredDataInput): { __html: string } {
  const absoluteUrl = toAbsoluteUrl(path);
  const label = breadcrumbLabel ?? title;

  return {
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${absoluteUrl}#webpage`,
          url: absoluteUrl,
          name: title,
          description,
          isPartOf: {
            "@id": `${getSiteUrl()}#website`,
          },
          about: about.map((topic) => ({ "@type": "Thing", name: topic })),
          audience: {
            "@type": "Audience",
            audienceType: audience,
          },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: toAbsoluteUrl("/"),
            },
            {
              "@type": "ListItem",
              position: 2,
              name: label,
              item: absoluteUrl,
            },
          ],
        },
        ...(callToAction
          ? [
              {
                "@type": "SpeakableSpecification",
                cssSelector: [".growth-snippet"],
                description: callToAction,
              },
            ]
          : []),
        ...additionalGraph,
      ],
    }),
  };
}
