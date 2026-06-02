#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const ROOT = process.cwd();
const PERF_DIR = path.join(ROOT, ".perf");
const LOCK_FILE = path.join(PERF_DIR, "perf-build.lock");
const REPORT_NAME = process.argv[2] || "latest";
const REPORT_PATH = path.join(PERF_DIR, `lighthouse-${REPORT_NAME}.json`);
const RANDOM_BASE_PORT = 4300 + Math.floor(Math.random() * 300);
const REQUESTED_PORT = Number(process.env.PERF_PORT || RANDOM_BASE_PORT);

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

async function resolvePort(basePort) {
  for (let port = basePort; port < basePort + 40; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`Unable to find open port in range ${basePort}-${basePort + 39}`);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      ...options,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function runBuildWithRetries(maxAttempts = 4) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      await run("npm", ["run", "build"]);
      return;
    } catch (error) {
      if (attempt >= maxAttempts) {
        throw error;
      }
      console.warn(
        `Build attempt ${attempt} failed (likely contention). Retrying in 8s...`,
      );
      // Give any other in-flight build time to finish.
      await delay(8000);
    }
  }
}

async function waitForServer(url, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.ok || response.status === 307 || response.status === 308) {
        return;
      }
    } catch {
      // Server not ready yet.
    }
    await delay(1000);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function extractTopBottlenecks(audits) {
  const candidates = Object.entries(audits)
    .filter(([, audit]) => typeof audit.score === "number")
    .filter(([, audit]) => audit.score < 0.9)
    .map(([id, audit]) => ({
      id,
      title: audit.title,
      score: audit.score,
      numericValue: audit.numericValue ?? null,
      displayValue: audit.displayValue ?? null,
    }))
    .sort((a, b) => a.score - b.score);

  return candidates.slice(0, 8);
}

function printSummary(lhr) {
  const perfScore = Math.round((lhr.categories.performance.score ?? 0) * 100);
  const fcp = lhr.audits["first-contentful-paint"]?.displayValue ?? "n/a";
  const lcp = lhr.audits["largest-contentful-paint"]?.displayValue ?? "n/a";
  const tbt = lhr.audits["total-blocking-time"]?.displayValue ?? "n/a";
  const cls = lhr.audits["cumulative-layout-shift"]?.displayValue ?? "n/a";
  const si = lhr.audits["speed-index"]?.displayValue ?? "n/a";

  const top = extractTopBottlenecks(lhr.audits);
  const summary = {
    report: path.relative(ROOT, REPORT_PATH),
    performanceScore: perfScore,
    metrics: { fcp, lcp, tbt, cls, si },
    topBottlenecks: top,
  };

  console.log("\nPERF_SUMMARY_START");
  console.log(JSON.stringify(summary, null, 2));
  console.log("PERF_SUMMARY_END\n");
}

let lockHandle;
let serverProcess;
let chrome;

try {
  await fs.mkdir(PERF_DIR, { recursive: true });
  lockHandle = await fs.open(LOCK_FILE, "wx");
  await lockHandle.write(`${process.pid}\n${new Date().toISOString()}\n`);

  console.log(`Acquired perf lock: ${path.relative(ROOT, LOCK_FILE)}`);
  await runBuildWithRetries();

  const selectedPort = await resolvePort(REQUESTED_PORT);
  const targetUrl = process.env.PERF_URL || `http://127.0.0.1:${selectedPort}/`;

  serverProcess = spawn("npm", ["run", "start", "--", "--port", String(selectedPort)], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });

  await waitForServer(targetUrl);
  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
    });
  } catch (error) {
    if (error?.code !== "ERR_LAUNCHER_NOT_INSTALLED") {
      throw error;
    }

    const playwright = await import("playwright");
    chrome = await chromeLauncher.launch({
      chromePath: playwright.chromium.executablePath(),
      chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
    });
  }

  const result = await lighthouse(targetUrl, {
    port: chrome.port,
    output: "json",
    logLevel: "error",
    onlyCategories: ["performance"],
    throttlingMethod: "simulate",
    formFactor: "desktop",
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  });

  if (!result?.lhr) {
    throw new Error("Lighthouse did not return an LHR payload.");
  }

  await fs.writeFile(REPORT_PATH, result.report, "utf8");
  printSummary(result.lhr);
} finally {
  if (chrome) {
    await chrome.kill();
  }
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill("SIGTERM");
  }
  if (lockHandle) {
    await lockHandle.close();
    await fs.rm(LOCK_FILE, { force: true });
  }
}
