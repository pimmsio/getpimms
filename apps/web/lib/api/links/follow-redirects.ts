import { getApexDomain } from "@dub/utils";

export const MAX_HOPS = 5;
const REQUEST_TIMEOUT = 5000; // 5 seconds

interface RedirectChainResult {
  success: boolean;
  urls: string[];
  /**
   * Unique apex domains encountered in the chain (in order).
   */
  apexDomains: string[];
  /**
   * True as soon as the chain contains >1 unique apex domain.
   * This is the primary signal we care about for abuse prevention.
   */
  hasMultipleApexDomains: boolean;
  /**
   * Number of redirect hops followed (each 3xx with a Location counts as 1 hop).
   */
  hopsFollowed: number;
  error?: string;
  tooManyRedirects?: boolean;
}

/**
 * Follows a URL's redirect chain and returns all URLs in the chain.
 * Redirects to the same domain (ignoring subdomain differences) are not counted.
 *
 * @param url - The initial URL to check
 * @param maxRedirects - Maximum number of redirects to follow (default: 3)
 * @returns RedirectChainResult containing all URLs in the chain or error
 */
export async function followRedirectChain(
  url: string,
  {
    maxHops = MAX_HOPS,
    failClosed = false,
  }: { maxHops?: number; failClosed?: boolean } = {},
): Promise<RedirectChainResult> {
  const urls: string[] = [url];
  let currentUrl = url;
  let hopsFollowed = 0;

  const originalApexDomain = getApexDomain(url);
  const apexDomains: string[] = [];
  const seenApexDomains = new Set<string>();

  const addApexDomain = (candidate: string) => {
    const apex = (candidate || "").toLowerCase();
    if (!apex) return;
    if (!seenApexDomains.has(apex)) {
      seenApexDomains.add(apex);
      apexDomains.push(apex);
    }
  };

  addApexDomain(originalApexDomain);

  try {
    let exhaustedHopBudget = true;

    while (hopsFollowed < maxHops) {
      exhaustedHopBudget = false;
      // Create an abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      try {
        // Use HEAD request with manual redirect handling
        const response = await fetch(currentUrl, {
          method: "HEAD",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; PimmsBot/1.0; +https://pimms.io)",
          },
        });

        clearTimeout(timeoutId);

        // Check if this is a redirect (3xx status codes)
        if (response.status >= 300 && response.status < 400) {
          exhaustedHopBudget = true;
          const location = response.headers.get("Location");

          if (!location) {
            // Redirect status but no Location header - stop here
            break;
          }

          // Handle relative URLs
          let nextUrl: string;
          try {
            if (
              location.startsWith("http://") ||
              location.startsWith("https://")
            ) {
              nextUrl = location;
            } else if (location.startsWith("/")) {
              const urlObj = new URL(currentUrl);
              nextUrl = `${urlObj.protocol}//${urlObj.host}${location}`;
            } else {
              nextUrl = new URL(location, currentUrl).href;
            }
          } catch (e) {
            console.error("Error parsing redirect URL:", e);
            if (failClosed) {
              return {
                success: false,
                urls,
                apexDomains,
                hasMultipleApexDomains: apexDomains.length > 1,
                hopsFollowed,
                error: "Error parsing redirect URL",
              };
            }
            break;
          }

          urls.push(nextUrl);
          currentUrl = nextUrl;
          hopsFollowed++;

          const nextApexDomain = getApexDomain(nextUrl);
          addApexDomain(nextApexDomain);

          if (seenApexDomains.size > 1) {
            return {
              success: true,
              urls,
              apexDomains,
              hasMultipleApexDomains: true,
              hopsFollowed,
            };
          }
        } else {
          // Not a redirect - we've reached the final destination
          exhaustedHopBudget = false;
          break;
        }
      } catch (e) {
        clearTimeout(timeoutId);

        if (e instanceof Error && e.name === "AbortError") {
          if (failClosed) {
            return {
              success: false,
              urls,
              apexDomains,
              hasMultipleApexDomains: seenApexDomains.size > 1,
              hopsFollowed,
              error: "Request timeout while following redirects",
            };
          }
          break;
        }

        // For network errors, return what we have so far
        console.error("Error following redirect:", e);
        if (failClosed) {
          return {
            success: false,
            urls,
            apexDomains,
            hasMultipleApexDomains: seenApexDomains.size > 1,
            hopsFollowed,
            error: "Network error while following redirects",
          };
        }
        break;
      }
    }

    // If we exhausted hop budget and the last response was still a redirect, we'll end up here.
    // Treat as too many redirects to avoid infinite chains.
    if (hopsFollowed >= maxHops && exhaustedHopBudget) {
      return {
        success: false,
        urls,
        apexDomains,
        hasMultipleApexDomains: seenApexDomains.size > 1,
        hopsFollowed,
        error: `Too many redirects (maximum ${maxHops} hops allowed)`,
        tooManyRedirects: true,
      };
    }

    return {
      success: true,
      urls,
      apexDomains,
      hasMultipleApexDomains: seenApexDomains.size > 1,
      hopsFollowed,
    };
  } catch (e) {
    console.error("Unexpected error in followRedirectChain:", e);
    return {
      success: false,
      urls,
      apexDomains,
      hasMultipleApexDomains: seenApexDomains.size > 1,
      hopsFollowed,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
