import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEnforcedContentSecurityPolicy,
  buildReportOnlyStandardContentSecurityPolicy,
  buildReportOnlyStrictContentSecurityPolicy,
} from "../src/lib/csp.ts";

test("enforced CSP uses nonce and strict dynamic for production scripts", () => {
  const csp = buildEnforcedContentSecurityPolicy({
    nonce: "test-nonce",
    isDev: false,
  });

  assert.match(csp, /script-src .*'nonce-test-nonce'/);
  assert.match(csp, /script-src .*'strict-dynamic'/);
  assert.doesNotMatch(csp, /script-src .*'unsafe-inline'/);
  assert.doesNotMatch(csp, /script-src .*'unsafe-eval'/);
});

test("standard report-only CSP probes style hardening without noisy script reports", () => {
  const csp = buildReportOnlyStandardContentSecurityPolicy();

  assert.match(csp, /style-src 'self' https: 'report-sample'/);
  assert.match(csp, /script-src 'self' 'unsafe-inline' https:/);
  assert.doesNotMatch(csp, /script-src 'self' https: 'report-sample'/);
  assert.doesNotMatch(csp, /style-src-attr 'none'/);
  assert.match(csp, /report-uri \/api\/security\/csp-report/);
});

test("strict report-only CSP keeps advanced script and style probes opt-in", () => {
  const csp = buildReportOnlyStrictContentSecurityPolicy();

  assert.match(csp, /script-src 'self' https: 'report-sample'/);
  assert.match(csp, /script-src-attr 'none'/);
  assert.match(csp, /style-src-attr 'none'/);
  assert.match(csp, /require-trusted-types-for 'script'/);
});
