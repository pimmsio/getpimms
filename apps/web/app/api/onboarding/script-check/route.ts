import { withWorkspace } from "@/lib/auth";
import { NextResponse } from "next/server";

function parseBoolParam(value: string | null) {
  if (!value) return false;
  const v = value.toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google.com",
]);

function isBlockedHost(hostname: string): boolean {
  if (BLOCKED_HOSTS.has(hostname)) return true;

  // IPv4 private/reserved ranges
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 127) return true;                     // 127.0.0.0/8
    if (a === 10) return true;                      // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true;        // 192.168.0.0/16
    if (a === 169 && b === 254) return true;        // 169.254.0.0/16 (link-local / cloud metadata)
    if (a === 0) return true;                       // 0.0.0.0/8
  }

  // IPv6 loopback and private
  const bare = hostname.replace(/^\[|\]$/g, "");
  if (bare === "::1" || bare === "::") return true;
  if (bare.startsWith("fd") || bare.startsWith("fe80")) return true;
  if (bare.startsWith("fc")) return true;

  return false;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function scanHtml(html: string) {
  const detectionScript = "cdn.pimms.io/analytics/script.detection.js";
  const exposeScript = "cdn.pimms.io/analytics/script.expose.js";
  const injectFormScript = "cdn.pimms.io/analytics/script.inject-form.js";

  const scriptRegex =
    /<script[^>]*(?:src=["']([^"']*)["'][^>]*)?[^>]*>([\s\S]*?)<\/script>/gi;
  const matches = html.match(scriptRegex) || [];

  let scriptFound = false;
  let exposeFound = false;
  let injectFormFound = false;
  let thankYouFound = false;
  let forwardAllFound = false;
  const outboundDomains: string[] = [];

  for (const m of matches) {
    const srcMatch = m.match(/src=["']([^"']*)["']/);
    const src = srcMatch ? srcMatch[1] : "";
    if (src.includes(detectionScript)) {
      scriptFound = true;

      if (/data-forward-all=["']true["']/i.test(m)) {
        forwardAllFound = true;
      }

      const domainsMatch = m.match(/data-domains='([^']*)'/) || m.match(/data-domains="([^"]*)"/);
      if (domainsMatch) {
        try {
          const cfg = JSON.parse(decodeHtmlEntities(domainsMatch[1]));
          if (typeof cfg.outbound === "string" && cfg.outbound) {
            outboundDomains.push(
              ...cfg.outbound.split(",").map((d: string) => d.trim().toLowerCase()),
            );
          }
          if (typeof cfg["thank-you"] === "string" && cfg["thank-you"]) {
            thankYouFound = true;
          }
        } catch {
          // malformed JSON -- ignore
        }
      }
    }
    if (src.includes(exposeScript)) exposeFound = true;
    if (src.includes(injectFormScript)) injectFormFound = true;

    // inline bundle / snippet case
    if (m.includes("@getpimms/analytics")) scriptFound = true;
  }

  // Also accept the SDK meta tag as "detected" (either attribute order).
  const metaFound =
    /<meta[^>]+name=["']pimms-sdk["'][^>]+content=["']true["'][^>]*>/i.test(html) ||
    /<meta[^>]+content=["']true["'][^>]+name=["']pimms-sdk["'][^>]*>/i.test(html);
  if (metaFound) scriptFound = true;

  return { scriptFound, exposeFound, injectFormFound, outboundDomains, thankYouFound, forwardAllFound };
}

export const GET = withWorkspace(async ({ req }) => {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const requireInjectForm = parseBoolParam(searchParams.get("requireInjectForm"));
  const requireExpose = parseBoolParam(searchParams.get("requireExpose"));
  const requireOutbound = searchParams.get("requireOutbound")?.trim().toLowerCase() || null;
  const requireThankYou = parseBoolParam(searchParams.get("requireThankYou"));
  const requireForwardAll = parseBoolParam(searchParams.get("requireForwardAll"));

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  try {
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    const parsedUrl = new URL(normalizedUrl);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ detected: false, error: "Only HTTP and HTTPS URLs are allowed." });
    }
    if (isBlockedHost(parsedUrl.hostname)) {
      return NextResponse.json({ detected: false, error: "This URL cannot be checked." });
    }

    const response = await fetch(parsedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Pimms-Script-Checker/1.0)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json({
        detected: false,
        error: `Failed to fetch webpage: ${response.status} ${response.statusText}. Please check that the URL is accessible.`,
      });
    }

    const html = await response.text();
    let { scriptFound, exposeFound, injectFormFound, outboundDomains, thankYouFound, forwardAllFound } = scanHtml(html);

    const outboundOk = !requireOutbound || outboundDomains.includes(requireOutbound);

    // Fallback: render JS if we didn't meet the requirements.
    const needsMore =
      !scriptFound ||
      (requireInjectForm && !injectFormFound) ||
      (requireExpose && !exposeFound) ||
      (requireThankYou && !thankYouFound) ||
      (requireForwardAll && !forwardAllFound) ||
      !outboundOk;

    if (needsMore) {
      const wsApiKey = process.env.WEBSCRAPINGAI_API_KEY;
      if (!wsApiKey) throw new Error("WEBSCRAPINGAI_API_KEY not set");

      const wsUrl = `https://api.webscraping.ai/html?api_key=${wsApiKey}&url=${encodeURIComponent(
        parsedUrl.toString(),
      )}&render_js=true&wait=5`;

      const wsResponse = await fetch(wsUrl, {
        headers: { Accept: "text/html", "User-Agent": "Pimms Checker" },
      });

      if (!wsResponse.ok) {
        const errorText = await wsResponse.text().catch(() => "");
        console.warn("Webscraping.ai failed:", errorText);
        throw new Error(`Webscraping.ai fetch failed (${wsResponse.status})`);
      }

      const renderedHtml = await wsResponse.text();
      const fallback = scanHtml(renderedHtml);
      scriptFound = scriptFound || fallback.scriptFound;
      exposeFound = exposeFound || fallback.exposeFound;
      injectFormFound = injectFormFound || fallback.injectFormFound;
      thankYouFound = thankYouFound || fallback.thankYouFound;
      forwardAllFound = forwardAllFound || fallback.forwardAllFound;
      if (fallback.outboundDomains.length > 0) {
        const merged = new Set([...outboundDomains, ...fallback.outboundDomains]);
        outboundDomains = [...merged];
      }
    }

    const detected =
      scriptFound &&
      (!requireInjectForm || injectFormFound) &&
      (!requireExpose || exposeFound) &&
      (!requireOutbound || outboundDomains.includes(requireOutbound)) &&
      (!requireThankYou || thankYouFound) &&
      (!requireForwardAll || forwardAllFound);

    return NextResponse.json({
      detected,
      error: null,
      details: {
        scriptFound,
        injectFormFound,
        exposeFound,
        outboundDomains,
        thankYouFound,
        forwardAllFound,
      },
    });
  } catch (error) {
    console.error("Error checking script:", error);
    let errorMessage = "Unknown error occurred";
    if (error instanceof TypeError && error.message.includes("Invalid URL")) {
      errorMessage = "Invalid URL format. Please ensure the URL is correct.";
    } else if (error instanceof DOMException && error.name === "AbortError") {
      errorMessage = "Request timeout. The website took too long to respond.";
    } else if (error instanceof TypeError && error.message.includes("fetch")) {
      errorMessage = "Network error. Unable to reach the website.";
    }
    return NextResponse.json({ detected: false, error: errorMessage });
  }
});
