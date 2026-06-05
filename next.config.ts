import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const CSP_REPORT_URI = "/api/security/csp-report";
const CSP_REPORT_ONLY_LEVEL = process.env.CSP_REPORT_ONLY_LEVEL ?? "standard";

const ENFORCED_CONTENT_SECURITY_POLICY = [
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
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "connect-src 'self' https: ws: wss:",
  "object-src 'none'",
].join("; ");

const REPORT_ONLY_STANDARD_CONTENT_SECURITY_POLICY = [
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
  "script-src 'self' https: 'report-sample'",
  "connect-src 'self' https:",
  "object-src 'none'",
  "upgrade-insecure-requests",
  `report-uri ${CSP_REPORT_URI}`,
].join("; ");

// Strict report-only profile to measure breakage before enforcement.
const REPORT_ONLY_STRICT_CONTENT_SECURITY_POLICY = [
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
  `report-uri ${CSP_REPORT_URI}`,
].join("; ");

const SECURITY_HEADERS = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: ENFORCED_CONTENT_SECURITY_POLICY },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "chart.js"],
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    const enableReportOnly = process.env.CSP_REPORT_ONLY !== "false";
    const reportOnlyPolicy =
      CSP_REPORT_ONLY_LEVEL === "strict"
        ? REPORT_ONLY_STRICT_CONTENT_SECURITY_POLICY
        : REPORT_ONLY_STANDARD_CONTENT_SECURITY_POLICY;

    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/:path*",
        headers: isProduction
          ? [
              ...SECURITY_HEADERS,
              ...(enableReportOnly
                ? [
                    {
                      key: "Content-Security-Policy-Report-Only",
                      value: reportOnlyPolicy,
                    },
                  ]
                : []),
              {
                key: "Strict-Transport-Security",
                value: "max-age=31536000; includeSubDomains; preload",
              },
            ]
          : SECURITY_HEADERS,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
