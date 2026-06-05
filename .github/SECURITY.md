# Security Policy

`qwen-ui-lab` is a **meetup demo** and reference UI lab—not a hardened production service. We still welcome responsible reports of security issues that affect users of the public demo.

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |
| &lt; 0.1  | No        |

Releases are tagged on [GitHub Releases](https://github.com/Iron-Mark/qwen-ui-lab/releases). Production demo: [qwen-ui-lab.vercel.app](https://qwen-ui-lab.vercel.app).

## Reporting a vulnerability

1. **Do not** open a public GitHub issue for undisclosed vulnerabilities.
2. Use [GitHub private vulnerability reporting](https://github.com/Iron-Mark/qwen-ui-lab/security/advisories/new) on this repository, or open a **private** security advisory if you have maintainer access.
3. If private reporting is unavailable, contact the repository owner via GitHub (profile: [Iron-Mark](https://github.com/Iron-Mark)) with a clear description and reproduction steps.

**Never include in reports or issues:**

- `DASHSCOPE_API_KEY` or other provider secrets
- Production `.env` / Vercel env values
- Personal access tokens or session cookies

Describe impact, affected routes (e.g. `/api/analyze-ui`, `/api/health`), and whether the issue reproduces in **demo mode** (default, no live API).

## What we treat as in scope

- Cross-site scripting or unsafe rendering in the demo UI
- Authentication or authorization flaws on API routes (if introduced in future versions)
- Information disclosure of server-side secrets via misconfiguration
- Dependency vulnerabilities with a demonstrated exploit path in this app

## Out of scope / expectations

- Issues that require `QWEN_LIVE_ANALYSIS=true` and your own API key on a self-hosted fork
- Missing features (rate limits, WAF, full strict CSP — script/style without `unsafe-*`) documented as staged roadmap in [docs/CSP_HARDENING_GUIDE.md](../docs/CSP_HARDENING_GUIDE.md); Stage A (`connect-src`, `upgrade-insecure-requests`) is enforced in production
- Social engineering or denial-of-service against the public Vercel deployment

## Safe demo operations

- Keep **`QWEN_LIVE_ANALYSIS` unset** on the public meetup deployment.
- Never commit `.env.local` or keys; use [`.env.example`](../.env.example) as a template only.
- Follow [CONTRIBUTING.md](../CONTRIBUTING.md) and [docs/PRODUCTION_DEPLOY_LANE.md](../docs/PRODUCTION_DEPLOY_LANE.md) for deploy checks.

We aim to acknowledge reports within a reasonable timeframe and will coordinate fixes on `main` and patch releases in the 0.1.x line when appropriate.
