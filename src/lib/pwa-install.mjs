/** localStorage key — dismiss persists across sessions until cache clear. */
export const PWA_INSTALL_DISMISS_KEY = "qwen-ui-lab:pwa-install-dismissed";

/**
 * True when the app is already installed (standalone / iOS home screen).
 * @param {{ matchStandalone?: boolean; navigatorStandalone?: boolean }} options
 */
export function isStandaloneDisplay({ matchStandalone = false, navigatorStandalone = false } = {}) {
  return matchStandalone || navigatorStandalone === true;
}

/** Safari on iOS/iPadOS — no beforeinstallprompt; show manual Add to Home Screen steps. */
export function isIosSafari(userAgent) {
  const isIos =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (/MacIntel/.test(userAgent) && /Mobile/.test(userAgent));
  if (!isIos) return false;
  return /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|mercury/i.test(userAgent);
}

/** Whether the install prompt UI should be eligible (not installed, not dismissed). */
export function shouldOfferPwaInstall({ standalone, dismissed, hasDeferredPrompt, iosSafari }) {
  if (standalone) return false;
  if (dismissed) return false;
  return hasDeferredPrompt || iosSafari;
}
