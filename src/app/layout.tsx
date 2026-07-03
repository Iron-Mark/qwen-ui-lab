import { cookies } from "next/headers";
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
import {
  BRAND_THEME_COOKIE_NAME,
  THEME_COOKIE_NAME,
  resolveBrandTheme,
  resolveTheme,
} from "@/lib/theme-preferences";
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

const ogImagePath = "/social/home-social-preview-1200x630.png";

export const metadata = createSiteMetadata(ogImagePath);
export const viewport = createSiteViewport();

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const cookieStore = await cookies();
  const initialTheme = resolveTheme(cookieStore.get(THEME_COOKIE_NAME)?.value);
  const initialBrandTheme = resolveBrandTheme(
    cookieStore.get(BRAND_THEME_COOKIE_NAME)?.value,
  );

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-brand={initialBrandTheme}
      className={cn(
        "font-sans",
        initialTheme === "dark" && "dark",
        geist.variable,
        spaceGrotesk.variable,
      )}
    >
      <head>
        <StructuredDataScript
          id="site-structured-data"
          data={createSiteStructuredData(ogImagePath)}
        />
      </head>
      <body className="font-sans antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <ShellLayout>{children}</ShellLayout>
      </body>
    </html>
  );
}
