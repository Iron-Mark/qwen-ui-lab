import { headers } from "next/headers";
import { connection } from "next/server";
import { Geist, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { StructuredDataScript } from "@/components/layout/StructuredDataScript";
import { ShellLayout } from "@/features/shell/components/ShellLayout";
import {
  createSiteMetadata,
  createSiteStructuredData,
  createSiteViewport,
} from "@/lib/seo";
import { createThemeBootstrapScript } from "@/lib/theme-bootstrap.client";
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

const ogImagePath = "/opengraph-image";

export const metadata = createSiteMetadata(ogImagePath);
export const viewport = createSiteViewport();

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
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: createThemeBootstrapScript() }}
        />
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
        <StructuredDataScript data={createSiteStructuredData(ogImagePath)} />
        <ShellLayout>{children}</ShellLayout>
      </body>
    </html>
  );
}
