export const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT = 5000; // 5 seconds

interface RedirectChainResult {
  success: boolean;
  urls: string[];
  error?: string;
  tooManyRedirects?: boolean;
}

/**
 * Follows a URL's redirect chain and returns all URLs in the chain.
 * 
 * @param url - The initial URL to check
 * @param maxRedirects - Maximum number of redirects to follow (default: 3)
 * @returns RedirectChainResult containing all URLs in the chain or error
 */
export async function followRedirectChain(
  url: string,
  maxRedirects: number = MAX_REDIRECTS,
): Promise<RedirectChainResult> {
  const urls: string[] = [url];
  const visitedUrls = new Set<string>([url]);
  let currentUrl = url;
  let redirectCount = 0;

  try {
    while (redirectCount < maxRedirects) {
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
            "User-Agent": "Mozilla/5.0 (compatible; PimmsBot/1.0; +https://pimms.io)",
          },
        });

        clearTimeout(timeoutId);

        // Check if this is a redirect (3xx status codes)
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("Location");
          
          if (!location) {
            // Redirect status but no Location header - stop here
            break;
          }

          // Handle relative URLs
          let nextUrl: string;
          try {
            if (location.startsWith("http://") || location.startsWith("https://")) {
              nextUrl = location;
            } else if (location.startsWith("/")) {
              const urlObj = new URL(currentUrl);
              nextUrl = `${urlObj.protocol}//${urlObj.host}${location}`;
            } else {
              nextUrl = new URL(location, currentUrl).href;
            }
          } catch (e) {
            console.error("Error parsing redirect URL:", e);
            break;
          }

          // Check for redirect loops
          if (visitedUrls.has(nextUrl)) {
            return {
              success: false,
              urls,
              error: "Redirect loop detected",
            };
          }

          urls.push(nextUrl);
          visitedUrls.add(nextUrl);
          currentUrl = nextUrl;
          redirectCount++;
        } else {
          // Not a redirect - we've reached the final destination
          break;
        }
      } catch (e) {
        clearTimeout(timeoutId);
        
        if (e instanceof Error && e.name === "AbortError") {
          return {
            success: false,
            urls,
            error: "Request timeout while following redirects",
          };
        }
        
        // For network errors, return what we have so far
        console.error("Error following redirect:", e);
        break;
      }
    }

    // Check if we hit the redirect limit
    if (redirectCount >= maxRedirects) {
      return {
        success: false,
        urls,
        error: `Too many redirects (maximum ${maxRedirects} allowed)`,
        tooManyRedirects: true,
      };
    }

    return {
      success: true,
      urls,
    };
  } catch (e) {
    console.error("Unexpected error in followRedirectChain:", e);
    return {
      success: false,
      urls,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

