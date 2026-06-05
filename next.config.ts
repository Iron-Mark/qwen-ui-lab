import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import {
  buildReportOnlyStandardContentSecurityPolicy,
  buildReportOnlyStrictContentSecurityPolicy,
} from "./src/lib/csp";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const CSP_REPORT_ONLY_LEVEL = process.env.CSP_REPORT_ONLY_LEVEL ?? "standard";

// Enforced CSP (Stage C: nonce + strict-dynamic) is set per-request in src/proxy.ts.
const SECURITY_HEADERS = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
        ? buildReportOnlyStrictContentSecurityPolicy()
        : buildReportOnlyStandardContentSecurityPolicy();

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
