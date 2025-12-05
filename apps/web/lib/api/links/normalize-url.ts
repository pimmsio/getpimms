/**
 * Normalizes a URL by removing search parameters, hash fragments, and trailing slashes.
 * This creates a consistent base URL for grouping purposes.
 * 
 * @param url - The URL to normalize
 * @returns The normalized URL, or null if the input is invalid
 * 
 * @example
 * normalizeUrl("https://example.com/path?foo=bar#hash") // "https://example.com/path"
 * normalizeUrl("https://example.com/path/") // "https://example.com/path"
 * normalizeUrl("https://example.com") // "https://example.com"
 */
export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    
    // Build the base URL: protocol + hostname + pathname (without search params or hash)
    let normalized = `${urlObj.protocol}//${urlObj.hostname}`;
    
    // Add port if it's not the default for the protocol
    if (urlObj.port) {
      const isDefaultPort = 
        (urlObj.protocol === 'http:' && urlObj.port === '80') ||
        (urlObj.protocol === 'https:' && urlObj.port === '443');
      
      if (!isDefaultPort) {
        normalized += `:${urlObj.port}`;
      }
    }
    
    // Add pathname, removing trailing slashes
    let pathname = urlObj.pathname;
    
    // Remove trailing slash (even for root path "/")
    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }
    
    // For root path, don't add anything (normalized already has protocol + hostname)
    if (pathname !== '/') {
      normalized += pathname;
    }
    
    return normalized;
  } catch (error) {
    // If URL parsing fails, return null
    console.error(`Failed to normalize URL: ${url}`, error);
    return null;
  }
}
