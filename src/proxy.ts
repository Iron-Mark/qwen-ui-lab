import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  buildEnforcedContentSecurityPolicy,
  createNonce,
} from "@/lib/csp";

export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const isDev = process.env.NODE_ENV === "development";
  const contentSecurityPolicy = buildEnforcedContentSecurityPolicy({ nonce, isDev });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|sw.js|icons|icon|apple-icon|manifest.json|manifest.webmanifest|robots.txt|sitemap.xml|.*opengraph-image|.*twitter-image).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
