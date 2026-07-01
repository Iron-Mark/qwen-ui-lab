import { randomUUID } from "node:crypto";

export const CSP_REPORT_URI = "/api/security/csp-report";

export function createNonce(): string {
  return Buffer.from(randomUUID()).toString("base64");
}

type CspOptions = {
  nonce?: string;
  isDev?: boolean;
  reportUri?: string;
};

function joinDirectives(directives: string[]): string {
  return directives.join("; ");
}

/** Stage C enforced baseline: nonce + strict-dynamic for scripts (no unsafe-inline / unsafe-eval in prod). */
export function buildEnforcedContentSecurityPolicy({
  nonce,
  isDev = false,
}: Required<Pick<CspOptions, "nonce">> & Pick<CspOptions, "isDev">): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    "https:",
    "'report-sample'",
  ].join(" ");

  return joinDirectives([
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https:",
    `script-src ${scriptSrc}`,
    "connect-src 'self' https:",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ]);
}

/** Stage D probe: style without unsafe-inline (beyond enforced Stage C). */
export function buildReportOnlyStandardContentSecurityPolicy({
  reportUri = CSP_REPORT_URI,
}: Pick<CspOptions, "reportUri"> = {}): string {
  return joinDirectives([
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "style-src 'self' https: 'report-sample'",
    "script-src 'self' 'unsafe-inline' https:",
    "connect-src 'self' https:",
    "object-src 'none'",
    `report-uri ${reportUri}`,
  ]);
}

/** Stage E/F probe: strict script/style attrs + Trusted Types. */
export function buildReportOnlyStrictContentSecurityPolicy({
  reportUri = CSP_REPORT_URI,
}: Pick<CspOptions, "reportUri"> = {}): string {
  return joinDirectives([
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "style-src 'self' https: 'report-sample'",
    "style-src-attr 'none'",
    "script-src 'self' https: 'report-sample'",
    "script-src-attr 'none'",
    "connect-src 'self' https:",
    "object-src 'none'",
    "upgrade-insecure-requests",
    "require-trusted-types-for 'script'",
    `report-uri ${reportUri}`,
  ]);
}
