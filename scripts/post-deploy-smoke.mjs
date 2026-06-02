#!/usr/bin/env node

const args = process.argv.slice(2);
const urlArg = args.find((arg) => arg.startsWith("--url="));
const urlValue = urlArg ? urlArg.split("=")[1] : process.env.DEPLOY_URL;
const expectLive = String(process.env.EXPECT_LIVE_ANALYSIS || "false").toLowerCase() === "true";

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

async function getJson(pathname) {
  const response = await fetch(new URL(pathname, baseUrl), {
    headers: { Accept: "application/json" },
    redirect: "follow",
  });
  const json = await response.json().catch(() => null);
  return { response, json };
}

async function checkPage(pathname, label) {
  const response = await fetch(new URL(pathname, baseUrl), { redirect: "follow" });
  if (!response.ok) {
    failures.push(`${label} failed with HTTP ${response.status}`);
    return;
  }
  console.log(`PASS ${label}: HTTP ${response.status}`);
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
  console.log(
    `PASS health: provider=${health.json.provider}, liveAnalysisEnabled=${String(
      liveAnalysisEnabled,
    )}`,
  );
}

for (const check of checks) {
  await checkPage(check.path, check.label);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL ${failure}`);
  }
  process.exit(1);
}

console.log("Post-deploy smoke checks passed.");
