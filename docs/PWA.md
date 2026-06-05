# Progressive Web App (PWA)

qwen-ui-lab ships as an installable PWA for meetup demos. The service worker is **production-only** — `npm run dev` does not register it, so local development stays predictable.

## Install

### Desktop (Chrome / Edge)

1. Open the production site (or `npm run build && npm run start`).
2. Use the install icon in the address bar, or **App menu → Install qwen-ui-lab**.

### Android (Chrome)

1. Open the site in Chrome.
2. Tap the menu → **Install app** or **Add to Home screen**.

### iOS (Safari)

1. Open the site in Safari.
2. Tap **Share** → **Add to Home Screen**.

Requirements: valid [manifest.json](../public/manifest.json), 192/512 PNG icons, `display: standalone`, and a registered service worker over HTTPS (or `localhost` for local prod builds).

## Offline behavior

| Layer | What works offline |
|-------|-------------------|
| **Demo analysis** | Client-side offline algorithm (`src/lib/offline-analyze.mjs`) — no network needed after JS loads |
| **Cached shell** | `/`, `/design-system`, and static assets visited at least once |
| **Navigation fallback** | Unknown routes → cached page → `/` shell → [offline.html](../public/offline.html) |

The service worker ([public/sw.js](../public/sw.js)) uses:

- **Precache** — manifest, icons, `/`, `/design-system`, offline page
- **Cache-first** — `/_next/static/*` (content-hashed)
- **Network-first** — HTML navigations and other same-origin GETs, with cache fallback

`/api/*` requests are never intercepted — live Qwen calls fail normally when offline.

## Updates

1. Deploy a new build (cache name bumps in `sw.js`, e.g. `qwen-ui-lab-v5`).
2. On the next visit, the browser fetches `/sw.js` with `updateViaCache: "none"`.
3. The new worker installs, calls `skipWaiting()`, activates, and triggers a single page reload via `controllerchange`.

To verify locally:

```bash
npm run build
npm run start
# Hard refresh once, then change CACHE_NAME in public/sw.js, rebuild, reload
```

## Verification

```bash
npm run validate:assets   # manifest, icons, sw.js, offline.html
npm test                  # tests/pwa.test.mjs
npm run test:e2e          # manifest + sw.js reachability
```

## Next.js 16 notes

- **No `next-pwa`** — App Router + Next 16 is handled with a hand-written `public/sw.js` and client registration in `ServiceWorkerRegister`.
- **Dev vs prod** — SW registration is gated on `NODE_ENV === "production"`.
- **RSC payloads** — first visit needs network to populate runtime caches; repeat visits and demo analysis work offline after that.
- **CSP** — `worker-src 'self' blob:` and `manifest-src 'self'` are set in [next.config.ts](../next.config.ts).

See also [TROUBLESHOOTING_RUNBOOK.md](./TROUBLESHOOTING_RUNBOOK.md) (PWA/service worker section) and [OFFLINE_DEMO_E2E.md](./OFFLINE_DEMO_E2E.md) (demo algorithm without network).
