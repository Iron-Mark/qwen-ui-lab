import assert from "node:assert/strict";
import test from "node:test";
import {
  handleCspReportPost,
  isLocalCspDocumentUri,
  normalizeCspReportPayload,
} from "../src/lib/csp-report.mjs";

function reportRequest(body) {
  return new Request("https://example.test/api/security/csp-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("normalizeCspReportPayload supports nested and flattened report shapes", () => {
  assert.deepEqual(
    normalizeCspReportPayload({
      "csp-report": {
        "document-uri": "https://example.test/",
        "violated-directive": "script-src",
        "blocked-uri": "inline",
      },
    }),
    {
      documentUri: "https://example.test/",
      violatedDirective: "script-src",
      blockedUri: "inline",
    },
  );

  assert.deepEqual(
    normalizeCspReportPayload({
      "document-uri": "https://example.test/account",
      "violated-directive": "style-src",
      "blocked-uri": "https://cdn.example.test",
    }),
    {
      documentUri: "https://example.test/account",
      violatedDirective: "style-src",
      blockedUri: "https://cdn.example.test",
    },
  );

  assert.equal(normalizeCspReportPayload(null), null);
});

test("handleCspReportPost logs normalized reports and always returns 204", async () => {
  const warnings = [];
  const response = await handleCspReportPost(
    reportRequest({
      "csp-report": {
        "document-uri": "https://example.test/",
        "violated-directive": "script-src",
        "blocked-uri": "inline",
      },
    }),
    {
      headers: new Headers({
        "x-forwarded-for": "203.0.113.10",
        "user-agent": "test-agent",
      }),
      logger: {
        warn(...args) {
          warnings.push(args);
        },
      },
    },
  );

  assert.equal(response.status, 204);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0][0], "CSP report-only violation");
  assert.deepEqual(warnings[0][1], {
    sourceIp: "203.0.113.10",
    documentUri: "https://example.test/",
    violatedDirective: "script-src",
    blockedUri: "inline",
    userAgent: "test-agent",
  });
});

test("handleCspReportPost suppresses localhost report noise", async () => {
  const warnings = [];
  const response = await handleCspReportPost(
    reportRequest({
      "csp-report": {
        "document-uri": "http://127.0.0.1:3211/",
        "violated-directive": "style-src-attr",
        "blocked-uri": "inline",
      },
    }),
    {
      logger: {
        warn(...args) {
          warnings.push(args);
        },
      },
    },
  );

  assert.equal(response.status, 204);
  assert.deepEqual(warnings, []);
  assert.equal(isLocalCspDocumentUri("http://localhost:3001/"), true);
  assert.equal(isLocalCspDocumentUri("https://qwen-ui-lab.vercel.app/"), false);
});

test("handleCspReportPost ignores invalid JSON report bodies", async () => {
  const warnings = [];
  const response = await handleCspReportPost(
    new Request("https://example.test/api/security/csp-report", {
      method: "POST",
      body: "{",
    }),
    {
      logger: {
        warn(...args) {
          warnings.push(args);
        },
      },
    },
  );

  assert.equal(response.status, 204);
  assert.deepEqual(warnings, []);
});
