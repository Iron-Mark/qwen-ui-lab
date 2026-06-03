# CSP Hardening Rollout Guide

This project uses a two-track CSP strategy:

- `Content-Security-Policy` (enforced): stable baseline intended to avoid runtime breakage.
- `Content-Security-Policy-Report-Only` (staged): tighter policies used to detect violations safely before enforcement.

## Current rollout

- Enforced policy allows compatibility-focused script and style behavior while tightening low-risk directives:
  - `script-src 'unsafe-inline' 'unsafe-eval'`
  - `style-src 'unsafe-inline'`
  - `connect-src` websocket endpoints
- Enforced policy now additionally pins:
  - `frame-src 'none'`
  - `manifest-src 'self'`
  - `worker-src 'self' blob:`
- Report-only has staged strictness levels:
  - `standard` (default): removes script `unsafe-inline` and `unsafe-eval`, narrows `connect-src` to HTTPS.
  - `strict`: also removes style `unsafe-inline`, blocks script/style attributes, and reports Trusted Types requirements.
  - Reports violations to `/api/security/csp-report`

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
   - Stage A: enforce strict `connect-src` (drop ws/wss if not required).
   - Stage B: enforce script without `unsafe-eval`.
   - Stage C: enforce script without `unsafe-inline` (nonce/hash based).
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
