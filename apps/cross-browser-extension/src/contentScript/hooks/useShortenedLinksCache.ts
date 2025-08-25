import { useState, useCallback, useMemo } from "react";
import { isExactUrlMatch } from "../utils/normalizeUrl";

// Global cache to persist across component re-renders
// This stays in memory for the duration of the page load
let globalCache: Record<string, { shortenedUrl: string; timestamp: number }> = {};

// Version counter to track cache changes efficiently
let cacheVersion = 0;

// Cache interface
interface ShortenedLinkCache {
  [originalUrl: string]: {
    shortenedUrl: string;
    timestamp: number;
  };
}

export interface ShortenedLinksCacheHook {
  getCachedShortenedUrl: (originalUrl: string, position: number) => string | null;
  setCachedShortenedUrl: (originalUrl: string, position: number, shortenedUrl: string) => void;
  isCached: (originalUrl: string, position: number) => boolean;
  updatePositions: (links: Array<{href: string, id: string}>) => void;
  clearCache: () => void;
  findExactUrlMatch: (url: string) => string | null;
  hasExactUrlMatch: (url: string) => boolean;
}

/**
 * Hook to manage shortened links cache in memory during the session
 * Prevents creating duplicate shortened links for the same URL
 * Cache is cleared on page reload as requested
 */
export default function useShortenedLinksCache(): ShortenedLinksCacheHook {
  // Use state to trigger re-renders only when cache actually changes
  const [version, setVersion] = useState(cacheVersion);

  // Sync version with global cache version
  if (version !== cacheVersion) {
    setVersion(cacheVersion);
  }

  const getCachedShortenedUrl = useCallback((originalUrl: string, position: number): string | null => {
    const cacheKey = `${originalUrl}:${position}`;
    const entry = globalCache[cacheKey];
    return entry ? entry.shortenedUrl : null;
  }, [version]);

  const setCachedShortenedUrl = useCallback((originalUrl: string, position: number, shortenedUrl: string) => {
    const cacheKey = `${originalUrl}:${position}`;
    const wasChanged = !globalCache[cacheKey] || globalCache[cacheKey].shortenedUrl !== shortenedUrl;
    
    globalCache[cacheKey] = {
      shortenedUrl,
      timestamp: Date.now(),
    };
    
    // Only trigger re-render if cache actually changed
    if (wasChanged) {
      cacheVersion++;
      setVersion(cacheVersion);
    }
  }, []);

  const isCached = useCallback((originalUrl: string, position: number): boolean => {
    const cacheKey = `${originalUrl}:${position}`;
    return cacheKey in globalCache;
  }, [version]);

  const updatePositions = useCallback((links: Array<{href: string, id: string}>) => {
    if (Object.keys(globalCache).length === 0) {
      return;
    }
    
    const newCache: typeof globalCache = {};
    
    // For each cached entry, check if the exact same URL exists at the same position
    for (const [oldCacheKey, cacheEntry] of Object.entries(globalCache)) {
      // Split from the last colon to handle URLs with colons (like https://)
      const lastColonIndex = oldCacheKey.lastIndexOf(':');
      const url = oldCacheKey.substring(0, lastColonIndex);
      const oldPosition = parseInt(oldCacheKey.substring(lastColonIndex + 1));
      
      // Check if the same URL exists at the same position
      if (links[oldPosition] && links[oldPosition].href === url) {
        // Perfect match: same URL at same position
        newCache[oldCacheKey] = cacheEntry;
      }
      // If position changed or URL no longer exists at this position, entry is removed
    }
    
    // Update global cache only if there are changes
    const cacheChanged = Object.keys(globalCache).length !== Object.keys(newCache).length ||
      !Object.keys(globalCache).every(key => newCache[key]);
    
    if (cacheChanged) {
      globalCache = newCache;
      // Trigger re-render efficiently
      cacheVersion++;
      setVersion(cacheVersion);
    }
  }, []);

  const clearCache = useCallback(() => {
    globalCache = {};
    cacheVersion++;
    setVersion(cacheVersion);
  }, []);

  const findExactUrlMatch = useCallback((url: string): string | null => {
    for (const [cacheKey, entry] of Object.entries(globalCache)) {
      // Split from the last colon to handle URLs with colons (like https://)
      const lastColonIndex = cacheKey.lastIndexOf(':');
      const cachedUrl = cacheKey.substring(0, lastColonIndex);
      
      if (isExactUrlMatch(url, cachedUrl)) {
        return entry.shortenedUrl;
      }
    }
    return null;
  }, [version]);

  const hasExactUrlMatch = useCallback((url: string): boolean => {
    return findExactUrlMatch(url) !== null;
  }, [findExactUrlMatch]);

  return {
    getCachedShortenedUrl,
    setCachedShortenedUrl,
    isCached,
    updatePositions,
    clearCache,
    findExactUrlMatch,
    hasExactUrlMatch,
  };
}

