import test from "node:test";
import assert from "node:assert/strict";

import { resolveErrorReportingTargets } from "../src/lib/error-reporting.mjs";

test("error reporting targets default to empty", () => {
  const targets = resolveErrorReportingTargets({});
  assert.equal(targets.sentryDsn, null);
  assert.equal(targets.reportingUrl, null);
});

test("error reporting targets read env when set", () => {
  const targets = resolveErrorReportingTargets({
    NEXT_PUBLIC_SENTRY_DSN: "https://key@o0.ingest.sentry.io/1",
    NEXT_PUBLIC_ERROR_REPORTING_URL: "https://collector.example/errors",
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: "staging",
  });
  assert.equal(targets.sentryDsn, "https://key@o0.ingest.sentry.io/1");
  assert.equal(targets.sentryEnvironment, "staging");
});
