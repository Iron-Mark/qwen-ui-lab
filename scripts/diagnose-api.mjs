import { readFileSync, existsSync } from "node:fs";
import { getQwenConfig } from "../src/lib/qwen-analyze.mjs";

function loadEnvLocal() {
  const path = ".env.local";
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const config = getQwenConfig();
if (!config.ok) {
  console.log(JSON.stringify({ ok: false, reason: config.missing }, null, 2));
  process.exit(1);
}

const endpoint = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;
const body = {
  model: config.model,
  messages: [{ role: "user", content: "Reply with the single word OK." }],
  max_tokens: 8,
};

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const payload = await response.json().catch(() => ({}));

console.log(
  JSON.stringify(
    {
      ok: response.ok,
      httpStatus: response.status,
      endpointHost: new URL(endpoint).host,
      model: config.model,
      errorMessage:
        payload?.error?.message || payload?.message || null,
      code: payload?.error?.code || null,
    },
    null,
    2,
  ),
);

process.exit(response.ok ? 0 : 1);
