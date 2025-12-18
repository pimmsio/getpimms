import {
  createResponseWithCookies,
  detectBot,
  getFinalUrl,
  getMatchedApp,
  isExceptionToDirectRedirect,
  isExceptionToNativeBrowser,
  isFromSameApp,
  isNativeBrowser,
  isSupportedDeeplinkProtocol,
  isSupportedDirectAppLink,
  isSupportedUniversalLinks,
  parse,
  shallShowDirectPreview,
} from "@/lib/middleware/utils";
import { recordClick } from "@/lib/tinybird";
import { formatRedisLink } from "@/lib/upstash";
import {
  DUB_HEADERS,
  LEGAL_WORKSPACE_ID,
  LOCALHOST_GEO_DATA,
  LOCALHOST_IP,
  isUnsupportedKey,
  nanoid,
  punyEncode,
} from "@dub/utils";
import { ipAddress } from "@vercel/functions";
import { NextRequest, NextResponse, userAgent } from "next/server";
import { linkCache } from "../api/links/cache";
import { isCaseSensitiveDomain } from "../api/links/case-sensitivity";
import { clickCache } from "../api/links/click-cache";
import { getLinkViaEdge } from "../planetscale";
import { getDomainViaEdge } from "../planetscale/get-domain-via-edge";
import { normalizeSubstack } from "./utils/applink/extract-substack";
import { hasEmptySearchParams } from "./utils/has-empty-search-params";
import { resolveABTestURL } from "./utils/resolve-ab-test-url";

export default async function LinkMiddleware(
  req: NextRequest,
  ctx?: { waitUntil?: (promise: Promise<unknown>) => void },
) {
  const waitUntil =
    ctx?.waitUntil ??
    ((promise: Promise<unknown>) => {
      void promise.catch(() => {});
    });

  const { domain, fullKey: originalKey, searchParamsObj } = parse(req);

  if (!domain) {
    return NextResponse.next();
  }

  // encode the key to ascii
  // links on PiMMs are case insensitive by default
  let key = punyEncode(originalKey);

  if (!isCaseSensitiveDomain(domain)) {
    key = key.toLowerCase();
  }

  const inspectMode = key.endsWith("+");
  // if inspect mode is enabled, remove the trailing `+` from the key
  if (inspectMode) {
    key = key.slice(0, -1);
  }

  // if key is empty string, set to _root (root domain link)
  if (key === "") {
    key = "_root";
  }

  // we don't support .php links (too much bot traffic)
  // hence we redirect to the root domain and add `pimms-no-track` header to avoid tracking bot traffic
  if (isUnsupportedKey(key)) {
    return NextResponse.redirect(new URL("/?pimms-no-track=1", req.url), {
      headers: {
        ...DUB_HEADERS,
        "X-Robots-Tag": "googlebot: noindex",
      },
      status: 302,
    });
  }

  let cachedLink = await linkCache.get({ domain, key });

  if (!cachedLink) {
    const linkData = await getLinkViaEdge({
      domain,
      key,
    });

    if (!linkData) {
      // check if domain has notFoundUrl configured
      const domainData = await getDomainViaEdge(domain);
      if (domainData?.notFoundUrl) {
        return NextResponse.redirect(domainData.notFoundUrl, {
          headers: {
            ...DUB_HEADERS,
            "X-Robots-Tag": "googlebot: noindex",
            // pass the Referer value to the not found URL
            Referer: req.url,
          },
          status: 302,
        });
      } else {
        return NextResponse.rewrite(new URL(`/${domain}/not-found`, req.url), {
          headers: DUB_HEADERS,
        });
      }
    }

    // format link to fit the RedisLinkProps interface
    cachedLink = formatRedisLink(linkData as any);
    // cache in Redis
    waitUntil(linkCache.set(linkData as any));
  }

  const {
    id: linkId,
    password,
    trackConversion,
    proxy,
    rewrite,
    expiresAt,
    ios,
    android,
    geo,
    expiredUrl,
    doIndex,
    webhookIds,
    testVariants,
    testCompletedAt,
    projectId: workspaceId,
  } = cachedLink;

  const testUrl = resolveABTestURL({
    testVariants,
    testCompletedAt,
    cookieStore: req.cookies,
  });

  let url = testUrl || cachedLink.url;

  const ua = userAgent(req);

  // by default, we only index default pimms domain links (e.g. pim.ms)
  // everything else is not indexed by default, unless the user has explicitly set it to be indexed
  const shouldIndex = doIndex === true;

  // only show inspect modal if the link is not password protected
  if (inspectMode && !password) {
    return NextResponse.rewrite(
      new URL(`/inspect/${domain}/${encodeURIComponent(key)}+`, req.url),
      {
        headers: {
          ...DUB_HEADERS,
          ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
        },
      },
    );
  }

  // if the link is password protected
  if (password) {
    const pw =
      req.nextUrl.searchParams.get("pw") ||
      req.cookies.get(`pimms_password_${linkId}`)?.value;

    // rewrite to auth page (/password/[domain]/[key]) if:
    // - no `pw` param is provided
    // - the `pw` param is incorrect
    // this will also ensure that no clicks are tracked unless the password is correct
    if (!pw || (await getLinkViaEdge({ domain, key }))?.password !== pw) {
      return NextResponse.rewrite(new URL(`/password/${linkId}`, req.url), {
        headers: {
          ...DUB_HEADERS,
          ...(!shouldIndex && {
            "X-Robots-Tag": "googlebot: noindex",
          }),
        },
      });
    } else if (pw) {
      // strip it from the URL if it's correct
      req.nextUrl.searchParams.delete("pw");
    }
  }

  // if the link is banned
  if (workspaceId === LEGAL_WORKSPACE_ID) {
    return NextResponse.rewrite(new URL("/banned", req.url), {
      headers: {
        ...DUB_HEADERS,
        ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
      },
    });
  }

  // if the link has expired
  if (expiresAt && new Date(expiresAt) < new Date()) {
    if (expiredUrl) {
      return NextResponse.redirect(expiredUrl, {
        headers: {
          ...DUB_HEADERS,
          ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
        },
        status: 302,
      });
    } else {
      return NextResponse.rewrite(new URL(`/expired/${domain}`, req.url), {
        headers: {
          ...DUB_HEADERS,
          ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
        },
      });
    }
  }

  const pimmsIdCookieName = `pimms_id_${domain}_${key}`;
  const pimmsAnonymousIdCookieName = `pimms_anonymous_id`;

  const cookieStore = req.cookies;

  // Get or create persistent anonymous visitor ID
  let anonymousId = cookieStore.get(pimmsAnonymousIdCookieName)?.value;
  if (!anonymousId) {
    anonymousId = `anon_${nanoid(16)}`;
  }

  let clickId = cookieStore.get(pimmsIdCookieName)?.value;

  if (!clickId) {
    // if trackConversion is enabled, check if clickId is cached in Redis
    if (trackConversion) {
      const ip = process.env.VERCEL === "1" ? ipAddress(req) : LOCALHOST_IP;

      clickId = (await clickCache.get({ domain, key, ip })) || undefined;
    }

    // if there's still no clickId, generate a new one
    if (!clickId) {
      clickId = nanoid(16);
    }
  }

  const cookieData = {
    path: `/${originalKey}`,
    pimmsIdCookieName,
    pimmsIdCookieValue: clickId,
    pimmsTestUrlValue: testUrl,
    pimmsAnonymousIdCookieName,
    pimmsAnonymousIdCookieValue: anonymousId,
  };

  // for root domain links, if there's no destination URL, rewrite to placeholder page
  if (!url) {
    waitUntil(
      recordClick({
        req,
        clickId,
        linkId,
        domain,
        key,
        url,
        webhookIds,
        workspaceId,
        trackConversion,
        anonymousId,
      }),
    );

    return createResponseWithCookies(
      NextResponse.rewrite(new URL(`/${domain}`, req.url), {
        headers: {
          ...DUB_HEADERS,
          // we only index root domain links if they're not subdomains
          ...(shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
        },
      }),
      cookieData,
    );
  }

  url = normalizeSubstack(url);

  const isBot = detectBot(req);

  const { country } =
    process.env.VERCEL === "1" && (req as any).geo
      ? ((req as any).geo as typeof LOCALHOST_GEO_DATA)
      : LOCALHOST_GEO_DATA;

  // rewrite to proxy page (/proxy/[domain]/[key]) if it's a bot and proxy is enabled
  if (isBot && proxy) {
    return createResponseWithCookies(
      NextResponse.rewrite(
        new URL(`/proxy/${domain}/${encodeURIComponent(key)}`, req.url),
        {
          headers: {
            ...DUB_HEADERS,
            "X-Robots-Tag": "googlebot: noindex",
          },
        },
      ),
      cookieData,
    );
    // rewrite to applink page if url matches a direct links
  } else if (
    isSupportedDirectAppLink(url, ua.os?.name?.toLowerCase()) &&
    !shallShowDirectPreview(req) &&
    !isFromSameApp(ua.browser?.name, getMatchedApp(url)?.appName) &&
    !shouldIndex // we don't deeplink indexed links
  ) {
    waitUntil(
      recordClick({
        req,
        clickId,
        linkId,
        domain,
        key,
        url,
        webhookIds,
        workspaceId,
        trackConversion,
        anonymousId,
      }),
    );

    console.log("ua.os.name", ua?.os?.name);
    console.log("ua.browser.name", ua?.browser?.name);

    const rewriteUrl = new URL(
      `/applink/${encodeURIComponent(
        getFinalUrl(url, {
          req,
          clickId: trackConversion ? clickId : undefined,
        }),
      )}`,
      req.url,
    );

    if (ua?.os?.name) {
      rewriteUrl.searchParams.set("os", ua?.os?.name?.toLowerCase());
    }
    if (ua?.browser?.name) {
      rewriteUrl.searchParams.set("browser", ua?.browser?.name?.toLowerCase());
    }

    return createResponseWithCookies(
      NextResponse.rewrite(rewriteUrl, {
        headers: {
          ...DUB_HEADERS,
          "X-Robots-Tag": "googlebot: noindex",
        },
      }),
      cookieData,
    );
    // rewrite to deeplink page if the link is a mailto: or tel:
  } else if (isSupportedDeeplinkProtocol(url) && !shouldIndex) {
    waitUntil(
      recordClick({
        req,
        clickId,
        linkId,
        domain,
        key,
        url,
        webhookIds,
        workspaceId,
        trackConversion,
        anonymousId,
      }),
    );

    return createResponseWithCookies(
      NextResponse.rewrite(
        new URL(
          `/deeplink/${encodeURIComponent(
            getFinalUrl(url, {
              req,
              clickId: trackConversion ? clickId : undefined,
            }),
          )}`,
          req.url,
        ),
        {
          headers: {
            ...DUB_HEADERS,
            "X-Robots-Tag": "googlebot: noindex",
          },
        },
      ),
      cookieData,
    );

    // rewrite to target URL if link cloaking is enabled
  } else if (rewrite) {
    waitUntil(
      recordClick({
        req,
        clickId,
        linkId,
        domain,
        key,
        url,
        webhookIds,
        workspaceId,
        trackConversion,
        anonymousId,
      }),
    );

    return createResponseWithCookies(
      NextResponse.rewrite(
        new URL(
          `/cloaked/${encodeURIComponent(
            getFinalUrl(url, {
              req,
              clickId: trackConversion ? clickId : undefined,
            }),
          )}`,
          req.url,
        ),
        {
          headers: {
            ...DUB_HEADERS,
            ...(!shouldIndex && {
              "X-Robots-Tag": "googlebot: noindex",
            }),
          },
        },
      ),
      cookieData,
    );

    // redirect to iOS link if it is specified and the user is on an iOS device
  } else if (ios && userAgent(req).os?.name === "iOS") {
    waitUntil(
      recordClick({
        req,
        clickId,
        linkId,
        domain,
        key,
        url: ios,
        webhookIds,
        workspaceId,
        trackConversion,
        anonymousId,
      }),
    );

    return createResponseWithCookies(
      NextResponse.redirect(
        getFinalUrl(ios, {
          req,
          clickId: trackConversion ? clickId : undefined,
        }),
        {
          headers: {
            ...DUB_HEADERS,
            ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
          },
          status: key === "_root" ? 301 : 302,
        },
      ),
      cookieData,
    );

    // redirect to Android link if it is specified and the user is on an Android device
  } else if (android && userAgent(req).os?.name === "Android") {
    waitUntil(
      recordClick({
        req,
        clickId,
        linkId,
        domain,
        key,
        url: android,
        webhookIds,
        workspaceId,
        trackConversion,
        anonymousId,
      }),
    );

    return createResponseWithCookies(
      NextResponse.redirect(
        getFinalUrl(android, {
          req,
          clickId: trackConversion ? clickId : undefined,
        }),
        {
          headers: {
            ...DUB_HEADERS,
            ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
          },
          status: key === "_root" ? 301 : 302,
        },
      ),
      cookieData,
    );

    // redirect to geo-specific link if it is specified and the user is in the specified country
  } else if (geo && country && country in geo) {
    waitUntil(
      recordClick({
        req,
        clickId,
        linkId,
        domain,
        key,
        url: geo[country],
        webhookIds,
        workspaceId,
        trackConversion,
        anonymousId,
      }),
    );

    return createResponseWithCookies(
      NextResponse.redirect(
        getFinalUrl(geo[country], {
          req,
          clickId: trackConversion ? clickId : undefined,
        }),
        {
          headers: {
            ...DUB_HEADERS,
            ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
          },
          status: key === "_root" ? 301 : 302,
        },
      ),
      cookieData,
    );

    // regular redirect
  } else if (
    (ua?.device?.type != "mobile" && ua?.device?.type != "tablet") ||
    shallShowDirectPreview(req) ||
    isExceptionToDirectRedirect(req) ||
    (isNativeBrowser(req) && !isExceptionToNativeBrowser(req)) ||
    isFromSameApp(ua.browser?.name, getMatchedApp(url)?.appName) ||
    shouldIndex
  ) {
    console.log("referrer", req.headers.get("referer"));
    console.log("ua.os.name", ua?.os?.name);
    console.log("ua.browser.name", ua?.browser?.name);
    console.log("ua.device.type", ua?.device?.type);
    console.log("shouldIndex", shouldIndex);

    waitUntil(
      recordClick({
        req,
        clickId,
        linkId,
        domain,
        key,
        url,
        webhookIds,
        workspaceId,
        trackConversion,
        anonymousId,
      }),
    );

    if (hasEmptySearchParams(url)) {
      return createResponseWithCookies(
        NextResponse.rewrite(new URL("/api/patch-redirect", req.url), {
          request: {
            headers: new Headers({
              destination: getFinalUrl(url, {
                req,
                clickId: trackConversion ? clickId : undefined,
              }),
            }),
          },
        }),
        cookieData,
      );
    }

    return createResponseWithCookies(
      NextResponse.redirect(
        getFinalUrl(url, {
          req,
          clickId: trackConversion ? clickId : undefined,
        }),
        {
          headers: {
            ...DUB_HEADERS,
            ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
          },
          status: key === "_root" ? 301 : 302,
        },
      ),
      cookieData,
    );
    // rewrite to universal link page
  } else if (
    isSupportedUniversalLinks(url) &&
    !shallShowDirectPreview(req) &&
    !shouldIndex
  ) {
    waitUntil(
      recordClick({
        req,
        clickId,
        linkId,
        domain,
        key,
        url,
        webhookIds,
        workspaceId,
        trackConversion,
        anonymousId,
      }),
    );

    console.log("ua.os.name", ua?.os?.name);
    console.log("ua.browser.name", ua?.browser?.name);
    console.log("searchParamsObj", searchParamsObj);

    const rewriteUrl = new URL(
      `/universallink/${encodeURIComponent(
        getFinalUrl(url, {
          req,
          clickId: trackConversion ? clickId : undefined,
        }),
      )}`,
      req.url,
    );

    if (ua?.os?.name) {
      rewriteUrl.searchParams.set("os", ua?.os?.name?.toLowerCase());
    }
    if (ua?.browser?.name) {
      rewriteUrl.searchParams.set("browser", ua?.browser?.name?.toLowerCase());
    }
    if (searchParamsObj) {
      Object.entries(searchParamsObj).forEach(([key, value]) =>
        rewriteUrl.searchParams.set(key, value),
      );
    }
    rewriteUrl.searchParams.set("key", key);
    rewriteUrl.searchParams.set("domain", domain);
    return createResponseWithCookies(
      NextResponse.rewrite(rewriteUrl, {
        headers: {
          ...DUB_HEADERS,
          "X-Robots-Tag": "googlebot: noindex",
        },
      }),
      cookieData,
    );
    // direct link redirect
  } else {
    waitUntil(
      recordClick({
        req,
        clickId,
        linkId,
        domain,
        key,
        url,
        webhookIds,
        workspaceId,
        trackConversion,
        anonymousId,
      }),
    );

    console.log("ua.os.name", ua?.os?.name);
    console.log("ua.browser.name", ua?.browser?.name);

    const rewriteUrl = new URL(
      `/directlink/${encodeURIComponent(
        getFinalUrl(url, {
          req,
          clickId: trackConversion ? clickId : undefined,
        }),
      )}`,
      req.url,
    );

    if (ua?.os?.name) {
      rewriteUrl.searchParams.set("os", ua?.os?.name?.toLowerCase());
    }
    if (ua?.browser?.name) {
      rewriteUrl.searchParams.set("browser", ua?.browser?.name?.toLowerCase());
    }
    return createResponseWithCookies(
      NextResponse.rewrite(rewriteUrl, {
        headers: {
          ...DUB_HEADERS,
          "X-Robots-Tag": "googlebot: noindex",
        },
      }),
      cookieData,
    );
  }
}
