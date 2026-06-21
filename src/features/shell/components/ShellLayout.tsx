import { Suspense, type ReactNode } from "react";
import { AuthProvider } from "@/features/account/components/AuthProvider";
import { PwaInstallBanner } from "@/features/pwa/components/PwaInstallBanner";
import { ServiceWorkerRegister } from "@/features/pwa/components/ServiceWorkerRegister";
import { LazyToaster } from "@/components/providers/LazyToaster";
import { ObservabilityProvider } from "@/components/providers/ObservabilityProvider";
import { ProviderModeProvider } from "@/components/providers/ProviderModeProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/Toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function ShellLayout({ children }: { children: ReactNode }) {
  return (
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
  );
}
