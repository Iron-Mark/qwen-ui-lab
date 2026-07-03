# Progressive Web App (PWA)

qwen-ui-lab ships as an installable PWA. The service worker is **production-only** - `npm run dev` does not register it, so local development stays predictable.

## Install

### Desktop (Chrome / Edge)

1. Open the production site (or `npm run build && npm run start`).
2. Use the install icon in the address bar, or **App menu -> Install qwen-ui-lab**.

### Android (Chrome)

1. Open the site in Chrome.
2. Tap the menu -> **Install app** or **Add to Home screen**.

The in-app [PwaInstallBanner](../../src/features/pwa/components/PwaInstallBanner.tsx) surfaces the same flow when `beforeinstallprompt` fires.

### Android (Play Store - Trusted Web Activity)

For teams that want a **Play Store listing** instead of (or in addition to) Chrome install, wrap the production PWA in a **Trusted Web Activity (TWA)**. The Android shell is a thin APK; all UI loads from your HTTPS origin.

| Step | Action |
|------|--------|
| 1 | Confirm the live site meets PWA criteria (manifest, icons, SW) - see [Verification](#verification). |
| 2 | Generate an Android project with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) or [PWABuilder](https://www.pwabuilder.com/) pointing at `https://qwen-ui-lab.vercel.app` (or your fork's domain). |
| 3 | Note the **package name** (e.g. `com.yourorg.qwenuilab`) and the **SHA-256 signing certificate fingerprint** from your upload key or Play App Signing. |
| 4 | Copy [docs/ops/assetlinks.template.json](./assetlinks.template.json), replace placeholders, and publish as **`/.well-known/assetlinks.json`** on the **same origin** as `start_url` in [manifest.json](../../public/manifest.json). |
| 5 | Verify: [Google Digital Asset Links API](https://developers.google.com/digital-asset-links/v1/getting-started) or `curl https://YOUR_DOMAIN/.well-known/assetlinks.json`. |
| 6 | Build, sign, and upload the APK/AAB to Play Console; set the default URL to `/` for the main workflow or `/demo` for a sample run. |

**Hosting `assetlinks.json` on Vercel**

1. Create `public/.well-known/assetlinks.json` from the template (remove `.template` suffix - the file must be served at exactly `/.well-known/assetlinks.json`).
2. Redeploy. `public/` files are static; no Next.js route is required.
3. Response must be `application/json` over HTTPS with no redirects on that path.

**When to skip TWA**

- Public web deployments: Chrome **Install app** is enough - no Play review cycle.
- Forks on custom domains: update `assetlinks.json` with **your** package name and fingerprint; the template is not committed to production by default.

**References**

- [Trusted Web Activity overview](https://developer.chrome.com/docs/android/trusted-web-activity)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)
- Presentation recording / slides: [docs/media/PRODUCT_MEDIA.md](../media/PRODUCT_MEDIA.md)

### iOS (Safari)

1. Open the site in Safari.
2. Tap **Share** -> **Add to Home Screen**.

Requirements: valid [manifest.json](../../public/manifest.json), 192/512 PNG icons, `display: standalone`, and a registered service worker over HTTPS (or `localhost` for local prod builds).

### In-app install banner

[PwaInstallBanner](../../src/features/pwa/components/PwaInstallBanner.tsx) shows a **dismissible top banner** when install is possible:

| Platform | Trigger | Actions |
|----------|---------|---------|
| **Chrome / Edge / Android** | `beforeinstallprompt` (after SW + manifest criteria) | **Install** runs the deferred prompt; **Dismiss** hides until localStorage is cleared |
| **iOS Safari** | Detected via user agent (no `beforeinstallprompt`) | Instructions: **Share -> Add to Home Screen** |

The banner is hidden when the app is already running standalone (`display-mode: standalone` or `navigator.standalone` on iOS). Dismiss state is stored under `qwen-ui-lab:pwa-install-dismissed`.

## Offline behavior

| Layer | What works offline |
|-------|-------------------|
| **Local analysis** | Client-side offline algorithm (`src/features/analysis/lib/offline-analyze.mjs`) - no network needed after JS loads |
| **Cached shell** | `/`, `/design-system`, and static assets visited at least once |
| **Health probe** | `GET /api/health` - network-first with cache fallback after at least one online visit |
| **Navigation fallback** | Unknown routes -> cached page -> `/` shell -> [offline.html](../../public/offline.html) |

The service worker ([public/sw.js](../../public/sw.js)) uses:

- **Precache** - manifest, icons, `/`, `/design-system`, offline page
- **Cache-first** - `/_next/static/*` (content-hashed)
- **Network-first** - HTML navigations, `GET /api/health`, and other same-origin GETs, with cache fallback

Other `/api/*` requests are never intercepted - live Qwen calls fail normally when offline.

## Cache versioning

Bump `CACHE_NAME` in `public/sw.js` (for example `qwen-ui-lab-v7` -> `qwen-ui-lab-v8`) when:

- The `PRECACHE` list changes
- Fetch / navigation caching strategy changes
- You need `activate` to delete stale runtime caches

You do **not** need a bump for comment-only edits. Hashed Next assets under `/_next/static/` are safe across deploys; old cache buckets are removed on activate when `CACHE_NAME` changes.

`npm run validate:assets` and `npm test` assert the `qwen-ui-lab-v{N}` pattern and required SW hooks.

Review-only candidates under `public/generated-assets/` are intentionally excluded from this production asset budget until a file is wired into the manifest, service worker, metadata, or app UI. Once promoted, move the asset into the owning public folder (`icons/`, `references/`, or a route-owned image path) so `validate:assets` covers it.

## Updates

1. Deploy a new build with an incremented `CACHE_NAME` in `public/sw.js`.
2. On the next visit, the browser fetches `/sw.js` with `updateViaCache: "none"` and `Cache-Control: no-cache` from [next.config.ts](../../next.config.ts).
3. When a new worker is **waiting** while an older one still controls the page, [ServiceWorkerRegister](../../src/features/pwa/components/ServiceWorkerRegister.tsx) shows an optional bottom-left toast: **Refresh** applies the update; **Dismiss** leaves the current tab on the old build until the user refreshes manually.
4. **Refresh** posts `{ type: "SKIP_WAITING" }` to the waiting worker (handled in `sw.js`), then reloads once on `controllerchange`.

First install does not show the toast (no prior controller).

### Verify locally

```bash
npm run build
npm run start
# Hard refresh once, bump CACHE_NAME in public/sw.js, rebuild, reload - toast should appear
```

### Production-server E2E

Playwright's default `test:e2e` runs against `next dev` (no SW). PWA registration is covered by:

```bash
npm run test:e2e:pwa
```

This uses [playwright.pwa.config.ts](../../playwright.pwa.config.ts) to `build` + `start` on a dedicated PWA E2E port (`3211` by default, override with `E2E_PWA_PORT`), then runs [e2e/pwa-production.spec.ts](../../e2e/pwa-production.spec.ts).

## Verification

```bash
npm run validate:assets   # manifest, icons, sw.js CACHE_NAME, offline.html
npm test                  # tests/pwa.test.mjs, tests/pwa-install.test.mjs
npm run test:e2e          # dev server - manifest + sw.js reachability (qa-coverage)
npm run test:e2e:pwa      # prod server - SW registration + cache headers
```

## Next.js 16 notes

- **No `next-pwa`** - App Router + Next 16 is handled with a hand-written `public/sw.js` and client registration in `ServiceWorkerRegister`.
- **Dev vs prod** - SW registration is gated on `NODE_ENV === "production"`.
- **RSC payloads** - first visit needs network to populate runtime caches; repeat visits and sample-run analysis work offline after that.
- **CSP** - `worker-src 'self' blob:` and `manifest-src 'self'` are set in [next.config.ts](../../next.config.ts).

See also [TROUBLESHOOTING_RUNBOOK.md](./TROUBLESHOOTING_RUNBOOK.md) (PWA/service worker section) and [LOCAL_ANALYSIS_E2E.md](./LOCAL_ANALYSIS_E2E.md) (local-analysis algorithm without network).
