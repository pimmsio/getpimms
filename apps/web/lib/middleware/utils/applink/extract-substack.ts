import { extractDomainAndPath } from "./extract-generic";

export const getSubstackAndroidPath = (url: string): string | null => {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname;
      const search = parsed.search;
  
      // Case 1: open.substack.com → use as-is
      if (hostname === "open.substack.com") {
        const path = extractDomainAndPath(url);
        return path || null;
      }
  
      // Case 2: username.substack.com → rewrite
      const subdomainMatch = hostname.match(/^([a-z0-9-]+)\.substack\.com$/i);
      if (subdomainMatch) {
        const username = subdomainMatch[1];
        const pathname = parsed.pathname.replace(/^\/+|\/+$/g, "");
        const pathPart = pathname ? `${username}/${pathname}` : username;
        return `open.substack.com/pub/${pathPart}${search}`;
      }
  
      // Case 3: fallback
      return extractDomainAndPath(url) || null;
    } catch {
      return null;
    }
  };
  