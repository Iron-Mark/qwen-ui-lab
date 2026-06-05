# CSP Hardening Rollout Guide

This project uses a two-track CSP strategy:

- `Content-Security-Policy` (enforced): stable baseline intended to avoid runtime breakage.
- `Content-Security-Policy-Report-Only` (staged): tighter policies used to detect violations safely before enforcement.

## Current rollout

- Enforced policy (Stage C — **done**): per-request nonce + `strict-dynamic` for scripts; no `unsafe-inline` or `unsafe-eval` in production.
  - Implemented in `src/proxy.ts` (Next.js 16 proxy) + `src/lib/csp.ts`; custom theme bootstrap script in `layout.tsx` receives the nonce via `x-nonce`.
  - `style-src 'unsafe-inline'` remains for Tailwind/runtime styles (Stage D).
- Enforced policy additionally pins:
  - `frame-src 'none'`
  - `manifest-src 'self'`
  - `worker-src 'self' blob:`
  - `connect-src 'self' https:` (Stage A — no `ws:` / `wss:`; app uses HTTPS `fetch` only)
  - `upgrade-insecure-requests` (Stage A — production is HTTPS-only)
- Report-only has staged strictness levels (tests **next** tightenings beyond enforced):
  - `standard` (default): style without `unsafe-inline` (`'report-sample'` only) — measures Stage D.
  - `strict`: also blocks script/style attributes and reports Trusted Types requirements (Stages E/F).
  - Reports violations to `/api/security/csp-report`

### Stage C implementation notes (Next.js 16)

- **Proxy, not static headers:** CSP must be set per request in `src/proxy.ts` so each response gets a fresh nonce. Static `Content-Security-Policy` in `next.config.ts` was removed for page routes.
- **Dynamic rendering required:** Root layout calls `connection()` so Next.js can inject nonces into framework scripts during SSR.
- **Trade-offs:** Pages are now dynamically rendered (`ƒ` in build output); CDN edge caching of HTML is disabled unless you add nonce-aware caching later. Opengraph/twitter image routes remain static (`○`).
- **Dev mode:** Proxy adds `'unsafe-eval'` to `script-src` in development (React dev tooling); production omits it (Stage B preserved).
- **Alternative not used:** Next.js experimental SRI (`experimental.sri`) offers hash-based CSP with static generation — viable for Stage C/D if dynamic rendering cost becomes unacceptable.

## Rollout toggles

- `CSP_REPORT_ONLY` (default enabled in production)
  - `true` or unset: emit strict report-only policy
  - `false`: disable report-only header
- `CSP_REPORT_ONLY_LEVEL` (default `standard`)
  - `standard`: practical tightening with low breakage risk
  - `strict`: advanced tightening to prepare for full strict enforcement

## Incremental hardening plan

1. **Collect** report-only violations for at least 7 days in each environment.
2. **Classify** by directive and source (`violated-directive`, `blocked-uri`).
3. **Fix** first-party offenders (inline scripts/styles, eval usage, non-HTTPS endpoints).
4. **Reduce noise** from known third-party sources by explicit allowlisting or removal.
5. **Promote** strict policy from report-only to enforced in stages:
   - Stage A: enforce strict `connect-src` (drop ws/wss if not required). **Done** (v0.1.6 lane).
   - Stage B: enforce script without `unsafe-eval`. **Done** — e2e rehearsal showed no `eval` violations; inline script noise remains report-only.
   - Stage C: enforce script without `unsafe-inline` (nonce/hash based). **Done** — nonce + `strict-dynamic` via `src/proxy.ts`; build and PR smoke e2e pass.
   - Stage D: enforce style without `unsafe-inline` (nonce/hash based).
   - Stage E: enforce `script-src-attr 'none'` and `style-src-attr 'none'`.
   - Stage F: enforce Trusted Types (`require-trusted-types-for 'script'`) after app compatibility work.

## Operational notes

- Reports are accepted at `POST /api/security/csp-report` and returned as `204`.
- Keep report payloads out of user-facing logs and dashboards unless redacted.
- Start in production with `CSP_REPORT_ONLY_LEVEL=standard`; raise to `strict` only after reviewing violation trends.

## Monitoring report-only violations

Report-only CSP does **not** block scripts or styles for the demo. Use it to learn what a stricter enforce policy would break later.

1. **Confirm the route is live** (staging or production build):
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" -X POST \
     -H "Content-Type: application/csp-report" \
     -d '{"csp-report":{"document-uri":"https://example.test/","violated-directive":"script-src","blocked-uri":"inline"}}' \
     https://<your-host>/api/security/csp-report
   ```
   Expect `204`.

2. **Collect violations** from server/runtime logs. The handler logs a single structured line per report:
   - `CSP report-only violation`
   - `violatedDirective`, `blockedUri`, `documentUri`, `sourceIp`, `userAgent`

3. **Triage weekly:** group by `violated-directive` and `blocked-uri`; fix first-party issues before changing enforced headers.

4. **Disable report-only temporarily** (e.g. noisy third-party): set `CSP_REPORT_ONLY=false` in the host env — enforced baseline in `next.config.ts` stays demo-safe.

5. **Do not enforce strict script/style policy** on the public demo until report-only noise is near zero on a rehearsal deploy.

See also `docs/POST_LAUNCH.md` (demo operators) and `docs/RELIABILITY_OPS.md` (health/CSP alongside synthetic checks).
