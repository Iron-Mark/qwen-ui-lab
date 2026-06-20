# Share links v2

Read-only analysis summaries can be shared without exposing generated code, plans, or API secrets.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/share` | Store a sanitized summary; returns `{ ok, id, url }` |
| `GET` | `/api/share?id=<id>` | Fetch a stored summary by short ID |
| `GET` | `/share/[id]` | Human-readable read-only summary page |

Payload shape (v1, secret-free):

```json
{
  "v": 1,
  "summary": "Admin dashboard with stat grid…",
  "stats": [{ "l": "Components", "v": "6" }],
  "mode": "Local demo mode",
  "file": "dashboard-reference.svg"
}
```

Fields such as `generatedCode`, `plan`, or API keys are stripped by `buildShareableSummary` before storage.

## Client flow

1. After analyze, **Copy short share link** POSTs the sanitized payload to `/api/share`.
2. On success, the clipboard receives `https://<host>/share/<id>` (8-char ID by default).
3. If the API is unavailable, the app falls back to a URL hash (`#share=…`) plus `sessionStorage` (`qwen-ui-lab:last-share`).
4. Opening a hash link on `/` or `/demo` attempts a one-time redirect to the short `/share/[id]` route when the API succeeds.

## Storage backends

### Development / demo (default)

`src/features/share/lib/share-store.mjs` keeps an in-memory `Map` per Node/serverless instance. Links survive until TTL expiry (default 7 days) but may not resolve across cold starts or other instances.

### Production — Vercel KV

For durable short links on Vercel, attach a [Vercel KV](https://vercel.com/docs/storage/vercel-kv) (Upstash Redis) store to the project and set:

| Variable | Description |
|----------|-------------|
| `KV_REST_API_URL` | Upstash REST URL from the KV dashboard |
| `KV_REST_API_TOKEN` | Upstash REST token (server-only) |

Optional tuning:

| Variable | Default | Description |
|----------|---------|-------------|
| `SHARE_ID_LENGTH` | `8` | Short ID length |
| `SHARE_TTL_MS` | `604800000` (7d) | Entry lifetime in milliseconds |

No `@vercel/kv` package is required — the store uses the Upstash REST API when both env vars are present.

## Operations

- Treat share payloads as **public** — never include secrets in client-side share input.
- Monitor 404 rate on `/share/[id]` after deploys (in-memory store resets on redeploy until KV is wired).
- See `docs/ops/PRODUCTION_DEPLOY_LANE.md` for general Vercel env policy (`NEXT_PUBLIC_*` must not carry secrets).
