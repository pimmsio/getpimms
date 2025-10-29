"use client";

import { ReactNode, useMemo } from "react";
import { Cache, SWRConfig } from "swr";
import { createPersistentCache } from "./cache-persistence";

// Time threshold in milliseconds (60 seconds)
const CACHE_TIME = 60 * 1000;

// Global cache storage - one per workspace slug
// This ensures the cache persists across component re-renders
const cacheInstances = new Map<string, Cache>();

/**
 * Analytics-specific SWR cache provider with localStorage persistence
 * 
 * Revalidates (fetches data) ONLY when:
 * 1. User manually clicks refresh button (via mutate())
 * 2. No cached data exists (initial page load)
 * 3. Reload AND more than 1 minute has passed (cache is stale)
 * 
 * Does NOT revalidate when:
 * - User switches browser tabs (focus)
 * - Network reconnects
 * - Reload within 1 minute (uses cache from localStorage)
 */
export function AnalyticsCacheProvider({ 
  children, 
  workspaceSlug 
}: { 
  children: ReactNode;
  workspaceSlug: string;
}) {
  // Create or retrieve the cache instance for this workspace
  // useMemo ensures this only runs once per workspace change
  const cacheProvider = useMemo(() => {
    // Return existing cache if available (preserves data across re-renders)
    if (cacheInstances.has(workspaceSlug)) {
      return () => cacheInstances.get(workspaceSlug)!;
    }

    // Create new cache instance
    const persistentCache = createPersistentCache(workspaceSlug);
    const map = new Map<string, any>();
    
    // PRE-POPULATE: Load all localStorage keys into the Map on creation
    // This is CRITICAL so SWR knows cached data exists before deciding to fetch
    const persistedKeys = persistentCache.keys();
    persistedKeys.forEach((key) => {
      const rawValue = persistentCache.get(key);
      if (rawValue !== undefined) {
        // Check if value is already in the new envelope format
        const isEnvelope = rawValue && 
          typeof rawValue === 'object' && 
          'value' in rawValue && 
          '_pimms_cached_at' in rawValue;
        
        if (isEnvelope) {
          // Already in envelope format, use as-is
          map.set(key, rawValue);
        } else {
          // Old format: migrate to envelope format
          const envelope = {
            value: rawValue,
            _pimms_cached_at: Date.now(),
          };
          
          map.set(key, envelope);
          // Update localStorage with new format
          persistentCache.set(key, envelope);
        }
      }
    });
    
    const cache: Cache = new Map() as any;
    
    // Override Map methods to use persistent storage
    cache.get = function(key: string) {
      // Check in-memory map first (already populated from localStorage)
      let envelope = map.get(key);
      
      // Fallback: try to load from localStorage (in case it was added externally)
      if (envelope === undefined) {
        envelope = persistentCache.get(key);
        if (envelope !== undefined) {
          map.set(key, envelope);
        }
      }
      
      if (envelope === undefined) {
        return undefined;
      }
      
      // Check if this is the new envelope format
      const isEnvelope = envelope && 
        typeof envelope === 'object' && 
        'value' in envelope && 
        '_pimms_cached_at' in envelope;
      
      if (isEnvelope) {
        // Extract the value from the envelope
        const { value, _pimms_cached_at } = envelope as any;
        
        // Attach timestamp to the value for SWR hooks to use
        // For arrays and objects, add as a property
        if (Array.isArray(value)) {
          const valueWithTimestamp = [...value];
          (valueWithTimestamp as any)._pimms_cached_at = _pimms_cached_at;
          return valueWithTimestamp;
        } else if (value && typeof value === 'object') {
          return {
            ...value,
            _pimms_cached_at,
          };
        } else {
          // Primitives: return as-is (can't attach metadata)
          return value;
        }
      }
      
      // Old format: return as-is (shouldn't happen after migration)
      return envelope;
    };
    
    cache.set = function(key: string, value: any) {
      // Wrap the value in an envelope with timestamp
      // This ensures the timestamp survives JSON.stringify (unlike custom properties on arrays)
      const envelope = {
        value: value,
        _pimms_cached_at: Date.now(),
      };
      
      // Store in both memory and localStorage
      map.set(key, envelope);
      persistentCache.set(key, envelope);
      return cache;
    };
    
    cache.delete = function(key: string) {
      map.delete(key);
      persistentCache.delete(key);
      return true;
    };
    
    cache.keys = function() {
      // Return keys from the in-memory map (already has everything)
      return map.keys();
    };
    
    // Store the cache instance globally
    cacheInstances.set(workspaceSlug, cache);
    
    return () => cache;
  }, [workspaceSlug]);

  return (
    <SWRConfig
      value={{
        // Use persistent cache provider
        provider: cacheProvider,
        
        // Only revalidate on mount if cache is stale (>60s old) or doesn't exist
        revalidateIfStale: true,
        
        // Never auto-revalidate on these events
        revalidateOnFocus: false, // Don't refetch when window gains focus
        revalidateOnReconnect: false, // Don't refetch on network reconnect
        
        // Cache is fresh for 60 seconds - prevents duplicate requests
        dedupingInterval: CACHE_TIME,
        
        // Keep showing old data while fetching new (smooth UX)
        keepPreviousData: true,
        
      }}
    >
      {children}
    </SWRConfig>
  );
}

/**
 * Export the cache utilities for external use
 */
export { createPersistentCache, clearAllAnalyticsCache } from "./cache-persistence";

