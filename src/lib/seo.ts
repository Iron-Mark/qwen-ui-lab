import type { Metadata, MetadataRoute, Viewport } from "next";

const DEFAULT_SITE_URL = "http://localhost:3000";
export const SITE_NAME = "qwen-ui-lab";
export const SITE_TAGLINE = "Screenshot to React workspace";
export const SITE_PITCH =
  "Turn UI screenshots into inspectable React + Tailwind starter packages.";
export const DEFAULT_OG_IMAGE =
  "/social/home-social-preview-1200x630.png";
export const MANIFEST_PATH = "/manifest.webmanifest";
export const LEGACY_MANIFEST_PATH = "/manifest.json";
export const APP_ICON_SVG = "/icons/icon.svg";
export const APP_ICON_MASKABLE_SVG = "/icons/icon-maskable.svg";
export const APP_ICON_192 = "/icons/icon-192.png";
export const APP_ICON_512 = "/icons/icon-512.png";
export const APP_ICON_MASKABLE_512 = "/icons/icon-maskable-512.png";
export const APPLE_TOUCH_ICON = "/icons/apple-touch-icon.png";
export const SITEMAP_STATIC_ROUTES = [
  "/",
  "/demo",
  "/design-system",
  "/design-system/laws-of-ux",
  "/design-system/uilaws",
] as const;

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

export function createSiteMetadata(ogImagePath = DEFAULT_OG_IMAGE): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${SITE_NAME} | ${SITE_TAGLINE}`,
      template: `%s | ${SITE_NAME}`,
    },
    description:
      "Upload a UI screenshot, inspect detected structure, refine the result, and export a React + Tailwind starter package.",
    applicationName: SITE_NAME,
    category: "Developer Tools",
    creator: SITE_NAME,
    publisher: SITE_NAME,
    authors: [{ name: SITE_NAME }],
    keywords: [
      "Qwen UI Lab",
      "UI structure detection",
      "screenshot to component",
      "React Tailwind starter package",
      "design system export",
    ],
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: `${SITE_NAME} | ${SITE_TAGLINE}`,
      description:
        "Screenshot-to-React workflow with detected UI review, editable boxes, and starter project files.",
      type: "website",
      url: "/",
      siteName: SITE_NAME,
      locale: "en_US",
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: "qwen-ui-lab screenshot-to-React workflow",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} | ${SITE_TAGLINE}`,
      description:
        "Upload a UI screenshot, review the detected layout, and export a React + Tailwind starter package.",
      images: [ogImagePath],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    manifest: MANIFEST_PATH,
    icons: {
      shortcut: [{ url: "/favicon.ico", sizes: "any" }],
      icon: [
        { url: APP_ICON_SVG, type: "image/svg+xml" },
        { url: APP_ICON_192, sizes: "192x192", type: "image/png" },
        { url: APP_ICON_512, sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: APPLE_TOUCH_ICON, sizes: "180x180", type: "image/png" },
      ],
      other: [
        {
          rel: "mask-icon",
          url: APP_ICON_MASKABLE_SVG,
          color: "#18181b",
        },
      ],
    },
    appleWebApp: {
      capable: true,
      title: "qwen-ui-lab",
    },
  };
}

export function createManifestConfig(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${SITE_NAME} - screenshot to React`,
    short_name: SITE_NAME,
    description:
      "Screenshot-to-React workflow with inspectable starter packages.",
    start_url: "/",
    scope: "/",
    lang: "en-US",
    dir: "ltr",
    display: "standalone",
    display_override: ["standalone", "browser"],
    orientation: "any",
    background_color: "#fafafa",
    theme_color: "#18181b",
    categories: ["developer", "productivity", "utilities"],
    icons: [
      {
        src: APP_ICON_192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: APP_ICON_512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: APP_ICON_MASKABLE_512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: APPLE_TOUCH_ICON,
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: APP_ICON_SVG,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: APP_ICON_MASKABLE_SVG,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Analyze screenshot",
        short_name: "Analyze",
        description: "Upload a UI screenshot and export a starter package.",
        url: "/#upload-flow",
        icons: [{ src: APP_ICON_192, sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Design system",
        short_name: "Patterns",
        description: "Browse component snippets and UX-law patterns.",
        url: "/design-system",
        icons: [{ src: APP_ICON_192, sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Sample run",
        short_name: "Sample",
        description: "Open a guided layout and review a starter preview.",
        url: "/demo",
        icons: [{ src: APP_ICON_192, sizes: "192x192", type: "image/png" }],
      },
    ],
    screenshots: [
      {
        src: "/references/dashboard-reference.png",
        sizes: "1440x900",
        type: "image/png",
        form_factor: "wide",
        label: "Dashboard layout workspace",
      },
      {
        src: "/references/mobile-reference.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Mobile layout workspace",
      },
    ],
    launch_handler: {
      client_mode: "focus-existing",
    },
    prefer_related_applications: false,
  };
}

export function createSiteViewport(): Viewport {
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#fafafa" },
      { media: "(prefers-color-scheme: dark)", color: "#18181b" },
    ],
    viewportFit: "cover",
  };
}

export function createSitemapEntries(
  lastModified = new Date(),
): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return SITEMAP_STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}

export function createRobotsConfig(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
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

export function createSiteStructuredData(ogImagePath = DEFAULT_OG_IMAGE): { __html: string } {
  const siteUrl = getSiteUrl();
  const organizationId = `${siteUrl}#organization`;
  const websiteId = `${siteUrl}#website`;

  return {
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": websiteId,
          name: SITE_NAME,
          url: siteUrl,
          description:
            "Screenshot-to-React tool for converting UI screenshots into inspectable React/Tailwind starter packages.",
          inLanguage: "en-US",
          publisher: {
            "@id": organizationId,
          },
          potentialAction: {
            "@type": "SearchAction",
            target: `${toAbsoluteUrl("/design-system")}?q={query}`,
            "query-input": "required name=query",
          },
        },
        {
          "@type": "WebApplication",
          "@id": `${siteUrl}#webapp`,
          name: SITE_NAME,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Web",
          url: siteUrl,
          description:
            "Screenshot upload, layout analysis, editable detection review, and React/Tailwind starter package download.",
          image: toAbsoluteUrl(ogImagePath),
          offers: {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            price: "0",
            priceCurrency: "USD",
          },
          publisher: {
            "@id": organizationId,
          },
        },
        {
          "@type": "Organization",
          "@id": organizationId,
          name: SITE_NAME,
          url: siteUrl,
          logo: {
            "@type": "ImageObject",
            url: toAbsoluteUrl("/icons/icon-512.png"),
          },
          sameAs: [
            "https://github.com/QwenLM",
            "https://github.com/Iron-Mark/qwen-ui-lab",
          ],
        },
      ],
    }),
  };
}
