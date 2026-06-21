#!/usr/bin/env node

const args = process.argv.slice(2);
const urlArg = args.find((arg) => arg.startsWith("--url="));
const urlValue = urlArg ? urlArg.split("=")[1] : process.env.DEPLOY_URL;
const expectLive = String(process.env.EXPECT_LIVE_ANALYSIS || "false").toLowerCase() === "true";
const githubReportEnabled = parseBooleanEnv(process.env.SMOKE_GITHUB_REPORT);

if (!urlValue) {
  console.error("Missing deploy URL. Pass --url=https://your-app.example or set DEPLOY_URL.");
  process.exit(1);
}

let baseUrl;
try {
  baseUrl = new URL(urlValue);
} catch {
  console.error(`Invalid DEPLOY_URL: ${urlValue}`);
  process.exit(1);
}

const checks = [
  { path: "/", label: "home" },
  { path: "/design-system", label: "design-system" },
  { path: "/design-system/laws-of-ux", label: "laws-of-ux" },
  { path: "/design-system/uilaws", label: "uilaws" },
  { path: "/robots.txt", label: "robots" },
  { path: "/sitemap.xml", label: "sitemap" },
];

const failures = [];
const passes = [];

function parseBooleanEnv(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());
}

function recordPass(message) {
  passes.push(message);
  console.log(`PASS ${message}`);
}

async function safeFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`Request failed for ${url.toString()} (${message})`);
    return null;
  }
}

async function getJson(pathname) {
  const target = new URL(pathname, baseUrl);
  const response = await safeFetch(target, {
    headers: { Accept: "application/json" },
    redirect: "follow",
  });
  if (!response) {
    return { response: { ok: false, status: 0 }, json: null };
  }
  const json = await response.json().catch(() => null);
  return { response, json };
}

async function checkPage(pathname, label) {
  const target = new URL(pathname, baseUrl);
  const response = await safeFetch(target, { redirect: "follow" });
  if (!response) {
    return;
  }
  if (!response.ok) {
    failures.push(`${label} failed with HTTP ${response.status}`);
    return;
  }
  recordPass(`${label}: HTTP ${response.status}`);
}

console.log(`Running post-deploy smoke checks against ${baseUrl.toString()}`);
console.log(`Expected live analysis: ${expectLive ? "yes" : "no (demo default)"}`);

const health = await getJson("/api/health");
if (!health.response.ok) {
  failures.push(`/api/health failed with HTTP ${health.response.status}`);
} else if (!health.json || health.json.ok !== true) {
  failures.push("/api/health returned invalid payload.");
} else {
  const liveAnalysisEnabled = health.json.liveAnalysisEnabled === true;
  if (liveAnalysisEnabled !== expectLive) {
    failures.push(
      `/api/health liveAnalysisEnabled mismatch (expected ${expectLive}, got ${liveAnalysisEnabled}).`,
    );
  }

  if (expectLive) {
    if (health.json.provider !== "qwen") {
      failures.push(
        `/api/health provider mismatch (expected qwen, got ${String(health.json.provider)}).`,
      );
    }
    if (health.json.hasApiKey !== true) {
      failures.push("/api/health hasApiKey must be true when live analysis is enabled.");
    }
    if (typeof health.json.model !== "string" || health.json.model.length === 0) {
      failures.push("/api/health model must be set when live analysis is enabled.");
    }
  } else if (health.json.provider !== "demo") {
    failures.push(
      `/api/health provider mismatch (expected demo, got ${String(health.json.provider)}).`,
    );
  }

  recordPass(
    `health: provider=${health.json.provider}, liveAnalysisEnabled=${String(
      liveAnalysisEnabled,
    )}`,
  );
}

if (expectLive) {
  const analyzeProbe = await safeFetch(new URL("/api/analyze-ui", baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({}),
  });
  if (!analyzeProbe) {
    // safeFetch already recorded failure
  } else if (analyzeProbe.status !== 400) {
    failures.push(
      `/api/analyze-ui live route probe expected HTTP 400 for empty body, got ${analyzeProbe.status}.`,
    );
  } else {
    const payload = await analyzeProbe.json().catch(() => null);
    if (!payload || payload.ok !== false || typeof payload.code !== "string") {
      failures.push("/api/analyze-ui returned unexpected error payload for invalid body.");
    } else {
      recordPass(`analyze-ui route: invalid body rejected (${payload.code})`);
    }
  }
}

for (const check of checks) {
  await checkPage(check.path, check.label);
}

await maybePublishGithubSmokeReport({
  enabled: githubReportEnabled,
  baseUrl,
  expectLive,
  passes,
  failures,
});

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL ${failure}`);
  }
  process.exit(1);
}

console.log("Post-deploy smoke checks passed.");

function buildGithubSmokeReport({ baseUrl, expectLive, passes, failures }) {
  const status = failures.length > 0 ? "FAIL" : "PASS";
  const lines = [
    `## Post-deploy smoke: ${status}`,
    "",
    `- Target: ${baseUrl.toString()}`,
    `- Expected live analysis: ${expectLive ? "yes" : "no"}`,
    `- Result: ${status}`,
    "",
    "### Passing checks",
    ...(passes.length ? passes.map((pass) => `- ${pass}`) : ["- None recorded"]),
    "",
    "### Failures",
    ...(failures.length ? failures.map((failure) => `- ${failure}`) : ["- None"]),
  ];
  return lines.join("\n");
}

async function maybePublishGithubSmokeReport({
  enabled,
  baseUrl,
  expectLive,
  passes,
  failures,
}) {
  if (!enabled) return;

  const token =
    process.env.SMOKE_GITHUB_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const repository =
    process.env.SMOKE_GITHUB_REPOSITORY || process.env.GITHUB_REPOSITORY;
  if (!token || !repository) {
    console.warn(
      "Skipping GitHub smoke report: set SMOKE_GITHUB_TOKEN/GITHUB_TOKEN and SMOKE_GITHUB_REPOSITORY/GITHUB_REPOSITORY.",
    );
    return;
  }

  const body = buildGithubSmokeReport({ baseUrl, expectLive, passes, failures });
  const title = `Post-deploy smoke ${failures.length > 0 ? "FAIL" : "PASS"}: ${baseUrl.hostname}`;
  const issueNumber = process.env.SMOKE_GITHUB_ISSUE;

  try {
    const result = issueNumber
      ? await postGithubIssueComment({ token, repository, issueNumber, body })
      : await createGithubIssue({ token, repository, title, body });
    console.log(`GitHub smoke report published: ${result}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`GitHub smoke report failed: ${message}`);
    if (parseBooleanEnv(process.env.SMOKE_GITHUB_REPORT_REQUIRED)) {
      failures.push(`GitHub smoke report failed (${message})`);
    }
  }
}

async function postGithubIssueComment({ token, repository, issueNumber, body }) {
  const payload = await githubRequest({
    token,
    path: `/repos/${repository}/issues/${issueNumber}/comments`,
    method: "POST",
    body: { body },
  });
  return payload.html_url ?? `${repository}#issuecomment-${payload.id ?? issueNumber}`;
}

async function createGithubIssue({ token, repository, title, body }) {
  const payload = await githubRequest({
    token,
    path: `/repos/${repository}/issues`,
    method: "POST",
    body: {
      title,
      body,
      labels: ["post-deploy-smoke"],
    },
  });
  return payload.html_url ?? `${repository}#issue-${payload.number ?? "new"}`;
}

async function githubRequest({ token, path, method, body }) {
  const apiBase = (process.env.GITHUB_API_URL || "https://api.github.com").replace(
    /\/+$/,
    "",
  );
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "qwen-ui-lab-smoke",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || `GitHub API returned HTTP ${response.status}`);
  }
  return payload ?? {};
}
