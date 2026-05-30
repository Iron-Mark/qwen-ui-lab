import type { Metadata } from "next";
import { Geist, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ProviderModeProvider } from "@/lib/provider-mode";
import { ToastProvider } from "@/components/providers/Toast";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { ServiceWorkerRegister } from "@/components/providers/ServiceWorkerRegister";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSiteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "qwen-ui-lab | AI-assisted UI scaffolding",
    template: "%s | qwen-ui-lab",
  },
  description:
    "Convert UI screenshots into React/Tailwind component scaffolds using Qwen3-VL and Qwen Code",
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
    title: "qwen-ui-lab | AI-assisted UI scaffolding",
    description:
      "Convert UI screenshots into React/Tailwind component scaffolds using Qwen3-VL and Qwen Code.",
    type: "website",
    url: "/",
    siteName: "qwen-ui-lab",
  },
  twitter: {
    card: "summary_large_image",
    title: "qwen-ui-lab | AI-assisted UI scaffolding",
    description:
      "Convert UI screenshots into React/Tailwind component scaffolds using Qwen3-VL and Qwen Code.",
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
  appleWebApp: {
    capable: true,
    title: "qwen-ui-lab",
  },
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", geist.variable, spaceGrotesk.variable)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg" />
        <link rel="mask-icon" href="/icons/icon-maskable.svg" color="#18181b" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  name: "qwen-ui-lab",
                  url: siteUrl,
                  description:
                    "Convert UI screenshots into React/Tailwind component scaffolds using Qwen3-VL and Qwen Code.",
                },
                {
                  "@type": "WebApplication",
                  name: "qwen-ui-lab",
                  applicationCategory: "DeveloperApplication",
                  operatingSystem: "Web",
                  url: siteUrl,
                  description:
                    "AI-assisted workflow for generating React and Tailwind component scaffolds from UI screenshots.",
                },
              ],
            }),
          }}
        />
        <ThemeProvider>
          <ProviderModeProvider>
            <TooltipProvider>
              <ToastProvider>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
                <ServiceWorkerRegister />
                <Toaster richColors closeButton position="top-center" />
              </ToastProvider>
            </TooltipProvider>
          </ProviderModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
