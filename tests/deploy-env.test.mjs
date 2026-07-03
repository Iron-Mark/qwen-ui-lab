import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

function runDeployEnv(args = [], env = {}) {
  return spawnSync(process.execPath, ["scripts/validate-deploy-env.mjs", ...args], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      ...env,
    },
    encoding: "utf8",
  });
}

test("deploy env validator accepts local-analysis target aliases", () => {
  for (const target of ["local", "local-analysis", "demo"]) {
    const result = runDeployEnv([`--target=${target}`]);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Deploy env validation target: local-analysis/);
    assert.match(result.stdout, /Deploy env validation passed/);
  }
});

test("deploy env local target blocks accidental live analysis", () => {
  const result = runDeployEnv(["--target=local"], {
    QWEN_LIVE_ANALYSIS: "true",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /forbids live upstream calls/);
});

test("deploy env validator keeps live target strict", () => {
  const result = runDeployEnv(["--target=live"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /requires QWEN_LIVE_ANALYSIS=true/);
  assert.match(result.stderr, /requires DASHSCOPE_API_KEY/);
});

test("deploy env docs avoid legacy demo command while package keeps compatibility alias", () => {
  const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
  assert.equal(
    packageJson.scripts["deploy:env:local"],
    "node scripts/validate-deploy-env.mjs --target=local",
  );
  assert.equal(
    packageJson.scripts["deploy:env:local-analysis"],
    "node scripts/validate-deploy-env.mjs --target=local-analysis",
  );
  assert.equal(
    packageJson.scripts["deploy:env:demo"],
    "node scripts/validate-deploy-env.mjs --target=demo",
  );

  const docs = [
    ".github/workflows/ci.yml",
    "README.md",
    "docs/README.md",
    "docs/ops/DEPLOYMENT_CHECKLIST.md",
    "docs/ops/LIVE_QWEN_ROLLOUT.md",
    "docs/ops/POST_LAUNCH.md",
    "docs/ops/PRODUCTION_DEPLOY_LANE.md",
    "docs/ops/PRODUCTION_ENV_READINESS.md",
    "docs/ops/ROLLBACK_CHECKLIST.md",
  ];

  const violations = [];
  for (const file of docs) {
    const source = readFileSync(join(process.cwd(), file), "utf8");
    if (source.includes("deploy:env:demo") || source.includes("--target=demo")) {
      violations.push(file);
    }
  }

  const readme = readFileSync(join(process.cwd(), "README.md"), "utf8");
  const docsReadme = readFileSync(join(process.cwd(), "docs", "README.md"), "utf8");
  assert.match(readme, /npm run deploy:env:local-analysis/);
  assert.match(docsReadme, /npm run deploy:env:local-analysis/);
  assert.match(docsReadme, /deploy:env:local` remains available as a short alias/);

  assert.deepEqual(violations, []);
});
