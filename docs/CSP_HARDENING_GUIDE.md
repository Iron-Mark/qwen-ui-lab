# CSP Hardening Rollout Guide

This project uses a two-track CSP strategy:

- `Content-Security-Policy` (enforced): stable baseline intended to avoid runtime breakage.
- `Content-Security-Policy-Report-Only` (strict): tighter policy used to detect violations safely before enforcement.

## Current rollout

- Enforced policy still allows:
  - `script-src 'unsafe-inline' 'unsafe-eval'`
  - `connect-src` websocket endpoints
- Report-only policy tests stricter controls:
  - Removes script `unsafe-inline` and `unsafe-eval`
  - Narrows `connect-src` to HTTPS
  - Reports violations to `/api/security/csp-report`

## Rollout toggles

- `CSP_REPORT_ONLY` (default enabled in production)
  - `true` or unset: emit strict report-only policy
  - `false`: disable report-only header

## Incremental hardening plan

1. **Collect** report-only violations for at least 7 days in each environment.
2. **Classify** by directive and source (`violated-directive`, `blocked-uri`).
3. **Fix** first-party offenders (inline scripts/styles, eval usage, non-HTTPS endpoints).
4. **Reduce noise** from known third-party sources by explicit allowlisting or removal.
5. **Promote** strict policy from report-only to enforced in stages:
   - Stage A: enforce strict `connect-src`
   - Stage B: enforce script without `unsafe-eval`
   - Stage C: enforce script without `unsafe-inline` (nonce/hash based)

## Operational notes

- Reports are accepted at `POST /api/security/csp-report` and returned as `204`.
- Keep report payloads out of user-facing logs and dashboards unless redacted.
