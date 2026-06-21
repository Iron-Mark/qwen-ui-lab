"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  isIosSafari,
  isStandaloneDisplay,
  PWA_INSTALL_DISMISS_KEY,
  shouldOfferPwaInstall,
} from "../lib/pwa-install.mjs";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(PWA_INSTALL_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function persistDismissed() {
  try {
    localStorage.setItem(PWA_INSTALL_DISMISS_KEY, "1");
  } catch {
    // Ignore storage errors (private mode, quota, etc.).
  }
}

function readStandalone() {
  return isStandaloneDisplay({
    matchStandalone: window.matchMedia("(display-mode: standalone)").matches,
    navigatorStandalone:
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  });
}

export function PwaInstallBanner() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const dismissedRef = useRef(readDismissed());
  const [hasDeferredPrompt, setHasDeferredPrompt] = useState(false);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    const iosSafari = isIosSafari(navigator.userAgent);
    const eligible = shouldOfferPwaInstall({
      standalone: readStandalone(),
      dismissed: dismissedRef.current,
      hasDeferredPrompt: false,
      iosSafari,
    });
    setIosHint(eligible && iosSafari);
    setVisible(eligible);
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setHasDeferredPrompt(true);

      const eligible = shouldOfferPwaInstall({
        standalone: readStandalone(),
        dismissed: dismissedRef.current,
        hasDeferredPrompt: true,
        iosSafari: isIosSafari(navigator.userAgent),
      });
      setIosHint(false);
      setVisible(eligible);
    };

    const onAppInstalled = () => {
      deferredPromptRef.current = null;
      setHasDeferredPrompt(false);
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const dismiss = () => {
    dismissedRef.current = true;
    persistDismissed();
    setVisible(false);
  };

  const install = async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    await prompt.prompt();
    const choice = await prompt.userChoice;
    deferredPromptRef.current = null;
    setHasDeferredPrompt(false);

    if (choice.outcome === "accepted") {
      setVisible(false);
      return;
    }

    const eligible = shouldOfferPwaInstall({
      standalone: readStandalone(),
      dismissed: dismissedRef.current,
      hasDeferredPrompt: false,
      iosSafari: isIosSafari(navigator.userAgent),
    });
    setIosHint(eligible && isIosSafari(navigator.userAgent));
    setVisible(eligible);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Install qwen-ui-lab"
      data-testid="pwa-install-banner"
      className={cn(
        "sticky top-0 z-50 border-b border-primary/20 bg-primary/10 backdrop-blur-md",
        "supports-[backdrop-filter]:bg-primary/5",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-2.5 sm:items-center sm:py-2">
        <div
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full sm:mt-0",
            "bg-primary/15 text-primary",
          )}
          aria-hidden
        >
          {iosHint ? <Smartphone className="size-4" /> : <Download className="size-4" />}
        </div>

        <div className="min-w-0 flex-1 text-sm leading-5">
          <p className="font-medium">Install qwen-ui-lab</p>
          {iosHint ? (
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              Tap <Share className="inline size-3.5 align-[-2px]" aria-hidden /> Share, then{" "}
              <strong>Add to Home Screen</strong> for offline meetup demos.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              Add the app to your home screen or desktop for quick access and offline shell caching.
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {hasDeferredPrompt ? (
            <button
              type="button"
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "h-8 px-2.5")}
              onClick={() => void install()}
            >
              Install
            </button>
          ) : null}
          <button
            type="button"
            className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "h-9 w-9")}
            title="Dismiss"
            aria-label="Dismiss install banner"
            onClick={dismiss}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
