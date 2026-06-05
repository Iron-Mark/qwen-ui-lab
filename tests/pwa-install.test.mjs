import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isIosSafari,
  isStandaloneDisplay,
  PWA_INSTALL_DISMISS_KEY,
  shouldOfferPwaInstall,
} from "../src/lib/pwa-install.mjs";

describe("PWA install helpers", () => {
  it("exports a stable dismiss storage key", () => {
    assert.equal(PWA_INSTALL_DISMISS_KEY, "qwen-ui-lab:pwa-install-dismissed");
  });

  it("detects standalone display modes", () => {
    assert.equal(isStandaloneDisplay({ matchStandalone: true }), true);
    assert.equal(isStandaloneDisplay({ navigatorStandalone: true }), true);
    assert.equal(isStandaloneDisplay({}), false);
  });

  it("detects iOS Safari for manual install instructions", () => {
    assert.equal(
      isIosSafari(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ),
      true,
    );
    assert.equal(
      isIosSafari(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1",
      ),
      false,
    );
    assert.equal(
      isIosSafari(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ),
      false,
    );
  });

  it("offers install when deferred prompt or iOS Safari and not dismissed", () => {
    assert.equal(
      shouldOfferPwaInstall({
        standalone: false,
        dismissed: false,
        hasDeferredPrompt: true,
        iosSafari: false,
      }),
      true,
    );
    assert.equal(
      shouldOfferPwaInstall({
        standalone: false,
        dismissed: false,
        hasDeferredPrompt: false,
        iosSafari: true,
      }),
      true,
    );
    assert.equal(
      shouldOfferPwaInstall({
        standalone: true,
        dismissed: false,
        hasDeferredPrompt: true,
        iosSafari: true,
      }),
      false,
    );
    assert.equal(
      shouldOfferPwaInstall({
        standalone: false,
        dismissed: true,
        hasDeferredPrompt: true,
        iosSafari: true,
      }),
      false,
    );
  });
});
