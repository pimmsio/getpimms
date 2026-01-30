import {
  AdminMiddleware,
  ApiMiddleware,
  AppMiddleware,
  AxiomMiddleware,
  CreateLinkMiddleware,
  LinkMiddleware,
} from "@/lib/middleware";
import { parse } from "@/lib/middleware/utils";
import {
  ADMIN_HOSTNAMES,
  API_HOSTNAMES,
  APP_DOMAIN,
  APP_HOSTNAMES,
  CBE_HOSTNAMES,
  DEFAULT_REDIRECTS,
  isValidUrl,
  SHORT_DOMAIN,
} from "@dub/utils";
import {
  type NextFetchEvent,
  NextRequest,
  NextResponse,
} from "next/server";
import CbeMiddleware from "./lib/middleware/cbe";
import { supportedWellKnownFiles } from "./lib/well-known";

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/ routes
     * 2. /_next/ (Next.js internals)
     * 3. /_proxy/ (proxies for third-party services)
     * 4. /static/ (public static assets)
     * 4. Metadata files: favicon.ico, sitemap.xml, robots.txt, manifest.webmanifest
     */
    "/((?!api/|_next/|_proxy/|static/|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest).*)",
  ],
};

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  AxiomMiddleware(req, event);

  const { domain, path, key, fullKey } = parse(req);

  // for App
  if (APP_HOSTNAMES.has(domain)) {
    return AppMiddleware(req);
  }

  // for API
  if (API_HOSTNAMES.has(domain)) {
    return ApiMiddleware(req);
  }

  // for public stats pages (e.g. d.to/stats/try)
  if (path.startsWith("/stats/")) {
    return NextResponse.rewrite(new URL(`/${domain}${path}`, req.url));
  }

  // for .well-known routes
  if (path.startsWith("/.well-known/")) {
    const file = path.split("/.well-known/").pop();
    if (file && supportedWellKnownFiles.includes(file)) {
      return NextResponse.rewrite(
        new URL(`/wellknown/${domain}/${file}`, req.url),
      );
    }
  }

  // default redirects for pim.ms
  if (domain === SHORT_DOMAIN && DEFAULT_REDIRECTS[key]) {
    return NextResponse.redirect(DEFAULT_REDIRECTS[key]);
  }

  // for Admin
  if (ADMIN_HOSTNAMES.has(domain)) {
    return AdminMiddleware(req);
  }

  // partners portal removed — redirect old hostnames to main app
  // covers e.g. partners.example.com, partners-staging.example.com, partners.localhost:8888
  if (domain.startsWith("partners.") || domain.startsWith("partners-")) {
    return NextResponse.redirect(new URL(APP_DOMAIN));
  }

  if (CBE_HOSTNAMES.has(domain)) {
    return CbeMiddleware(req);
  }

  if (isValidUrl(fullKey)) {
    return CreateLinkMiddleware(req);
  }

  return LinkMiddleware(req, event);
}
