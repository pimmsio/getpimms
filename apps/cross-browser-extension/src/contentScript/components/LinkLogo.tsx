import React, { useState, useCallback, memo, useEffect } from "react";

interface LinkLogoProps {
  href?: string;
  host?: string;
  className?: string;
  size?: number; // px
}

function getHostname(input?: string): string | null {
  if (!input) return null;
  try {
    const base = typeof window !== "undefined" ? window.location.href : "https://example.com";
    const url = new URL(input, base);
    return url.hostname;
  } catch {
    return null;
  }
}

// Simple URL cache - no complex preloading
const faviconCache = new Map<string, string>();
const loadedFavicons = new Set<string>();

// Default fallback icon as data URI to prevent loading issues  
const DEFAULT_ICON = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%236b7280'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244'/%3e%3c/svg%3e";

function getFaviconUrl(hostname: string): string {
  if (faviconCache.has(hostname)) {
    return faviconCache.get(hostname)!;
  }
  const url = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
  faviconCache.set(hostname, url);
  return url;
}

const LinkLogo: React.FC<LinkLogoProps> = memo(({ href, host, className, size = 16 }) => {
  const hostname = host || getHostname(href) || "";
  const [hasError, setHasError] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(() => loadedFavicons.has(hostname));

  const src = hostname && !hasError && hasLoaded
    ? getFaviconUrl(hostname)
    : DEFAULT_ICON;

  const handleLoad = useCallback(() => {
    if (hostname) {
      loadedFavicons.add(hostname);
      setHasLoaded(true);
    }
  }, [hostname]);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  return (
    <>
      {/* Always render both - one hidden to preload */}
      {hostname && !hasError && (
        <img
          src={getFaviconUrl(hostname)}
          alt=""
          style={{ display: 'none' }}
          onLoad={handleLoad}
          onError={handleError}
          referrerPolicy="no-referrer"
        />
      )}
      <img
        src={src}
        alt={hostname || "favicon"}
        className={className || "h-4 w-4"}
        referrerPolicy="no-referrer"
        loading="eager"
        decoding="sync"
      />
    </>
  );
});

LinkLogo.displayName = 'LinkLogo';

export default LinkLogo;
