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
      </head>
      <body className="font-sans antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <StructuredDataScript data={createSiteStructuredData(ogImagePath)} />
        <ShellLayout>{children}</ShellLayout>
      </body>
    </html>
  );
}
