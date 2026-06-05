import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { Geist, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ProviderModeProvider } from "@/lib/provider-mode";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/providers/Toast";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { ServiceWorkerRegister } from "@/components/providers/ServiceWorkerRegister";
import { PwaInstallBanner } from "@/components/providers/PwaInstallBanner";
import { ObservabilityProvider } from "@/components/providers/ObservabilityProvider";
import { LazyToaster } from "@/components/providers/LazyToaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSiteUrl, SITE_NAME, SITE_TAGLINE, toAbsoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  preload: false,
  weight: ["600", "700"],
  adjustFontFallback: true,
});

const siteUrl = getSiteUrl();
const ogImagePath = "/opengraph-image";
const organizationId = `${siteUrl}#organization`;
const websiteId = `${siteUrl}#website`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Meetup-ready demo: turn UI screenshots into React + Tailwind scaffolds with Qwen3-VL and Qwen Code—offline-safe by default, no API key on stage.",
  applicationName: SITE_NAME,
  category: "Developer Tools",
  creator: SITE_NAME,
  publisher: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  keywords: [
    "Qwen UI Lab",
    "AI UI scaffolding",
    "screenshot to component",
    "React Tailwind generator",
    "design system demo",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description:
      "Live meetup demo—screenshot to React/Tailwind scaffold in minutes. Offline-safe; enable live Qwen only when you choose.",
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    locale: "en_US",
    images: [
      {
        url: ogImagePath,
        width: 1200,
        height: 630,
        alt: "qwen-ui-lab AI-assisted UI scaffolding",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description:
      "Mass-presentation demo: upload, analyze, and export scaffold-ready UI—no production API required.",
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
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "qwen-ui-lab",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
  viewportFit: "cover",
};

const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      var brandTheme = localStorage.getItem('brand-theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
      if (brandTheme === 'indigo' || brandTheme === 'emerald' || brandTheme === 'sunset') {
        document.documentElement.dataset.brand = brandTheme;
      } else {
        document.documentElement.dataset.brand = 'indigo';
      }
    } catch (e) {}
  })();
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", geist.variable, spaceGrotesk.variable)}
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icons/icon-192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/icons/icon-512.png" sizes="512x512" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180" />
        <link rel="mask-icon" href="/icons/icon-maskable.svg" color="#18181b" />
      </head>
      <body className="font-sans antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": websiteId,
                  name: "qwen-ui-lab",
                  url: siteUrl,
                  description:
                    "Meetup demo for converting UI screenshots into React/Tailwind scaffolds with Qwen3-VL and Qwen Code.",
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
                  name: "qwen-ui-lab",
                  applicationCategory: "DeveloperApplication",
                  operatingSystem: "Web",
                  url: siteUrl,
                  description:
                    "Offline-safe meetup workflow: screenshot upload, layout analysis, and React/Tailwind scaffold export.",
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
          }}
        />
        <ThemeProvider>
          <AuthProvider>
            <ProviderModeProvider>
            <ObservabilityProvider>
              <TooltipProvider>
                <ToastProvider>
                  <LazyToaster
                    closeButton
                    position="bottom-left"
                    offset={20}
                    mobileOffset={{
                      bottom: "max(1rem, env(safe-area-inset-bottom))",
                      left: "max(1rem, env(safe-area-inset-left))",
                    }}
                  />
                  <div className="flex min-h-screen flex-col">
                    <PwaInstallBanner />
                    <Suspense
                      fallback={
                        <header className="sticky top-0 z-40 h-16 border-b border-border/80 bg-card/85" />
                      }
                    >
                      <Header />
                    </Suspense>
                    <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
                      {children}
                    </main>
                    <Footer />
                  </div>
                  <ServiceWorkerRegister />
                </ToastProvider>
              </TooltipProvider>
            </ObservabilityProvider>
            </ProviderModeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
