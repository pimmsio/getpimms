/**
 * Normalizes a URL for exact matching by:
 * - Removing protocol (http:// or https://)
 * - Removing trailing slash only if no query params or hash
 * - Converting to lowercase
 * 
 * Examples:
 * - "https://pimms.io/" -> "pimms.io"
 * - "http://PIMMS.IO?abc=12#abc" -> "pimms.io?abc=12#abc"
 * - "pimms.io/" -> "pimms.io"
 * 
 * @param url - The URL to normalize
 * @returns The normalized URL for exact matching
 */
export function normalizeUrlForExactMatch(url: string): string {
  let normalized = url.trim().toLowerCase();
  
  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, '');
  
  // Only remove trailing slash if there are no query params or hash
  if (!normalized.includes('?') && !normalized.includes('#')) {
    normalized = normalized.replace(/\/+$/, '');
  }
  
  return normalized;
}

/**
 * Gets the current domain configuration from EMAIL_MARKETING_DOMAINS
 * @returns The domain configuration for the current hostname, or null if not found
 */
export function getCurrentDomainConfig() {
  const { EMAIL_MARKETING_DOMAINS } = require('../../types');
  const host = window.location.hostname.toLowerCase();
  return EMAIL_MARKETING_DOMAINS.find(
    (d: any) => host === d.domain || host.endsWith(`.${d.domain}`),
  ) || null;
}

/**
 * Checks if two URLs are considered exact matches according to our criteria:
 * - Same normalized URL (ignoring protocol and trailing slash)
 * - Identical query parameters and hash fragments
 * 
 * Examples of exact matches:
 * - "https://pimms.io?abc=12#abc" and "pimms.io?abc=12#abc" ✓
 * - "https://pimms.io/" and "pimms.io" ✓
 * - "https://pimms.io?abc=12" and "pimms.io?abc=12" ✓
 * 
 * Examples of non-matches:
 * - "pimms.io" and "pimms.io?abc=12" ✗
 * - "pimms.io?abc=12" and "pimms.io?def=34" ✗
 * 
 * @param url1 - First URL to compare
 * @param url2 - Second URL to compare
 * @returns true if URLs are exact matches
 */
export function isExactUrlMatch(url1: string, url2: string): boolean {
  const normalizeForComparison = (url: string): string => {
    let normalized = url.trim().toLowerCase();
    
    // Remove protocol but keep everything else
    normalized = normalized.replace(/^https?:\/\//, '');
    
    // Only remove trailing slash if there are no query params or hash
    if (!normalized.includes('?') && !normalized.includes('#')) {
      normalized = normalized.replace(/\/+$/, '');
    }
    
    return normalized;
  };
  
  const normalized1 = normalizeForComparison(url1);
  const normalized2 = normalizeForComparison(url2);
  
  return normalized1 === normalized2;
}
