/**
 * localStorage-based cache persistence for SWR
 * Provides workspace-scoped caching with TTL (time-to-live) support
 */

const CACHE_TTL = 60 * 1000; // 60 seconds
const CACHE_PREFIX = "analytics_cache_";

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

/**
 * Check if a cache entry is stale (older than TTL)
 */
function isStale(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp > CACHE_TTL;
}

/**
 * Get workspace-scoped cache key
 */
function getCacheKey(workspaceSlug: string, key: string): string {
  return `${CACHE_PREFIX}${workspaceSlug}_${key}`;
}

/**
 * Create a localStorage-backed cache for SWR with workspace scoping
 */
export function createPersistentCache(workspaceSlug: string) {
  // In-memory fallback if localStorage is not available
  const memoryCache = new Map<string, any>();
  
  const isLocalStorageAvailable = typeof window !== "undefined" && window.localStorage;

  return {
    /**
     * Get value from cache
     */
    get(key: string): any {
      const cacheKey = getCacheKey(workspaceSlug, key);
      
      try {
        if (isLocalStorageAvailable) {
          const stored = localStorage.getItem(cacheKey);
          if (stored) {
            const entry: CacheEntry = JSON.parse(stored);
            
            // Check if stale
            if (isStale(entry)) {
              localStorage.removeItem(cacheKey);
              return undefined;
            }
            
            return entry.data;
          }
        } else {
          return memoryCache.get(cacheKey);
        }
      } catch (error) {
        console.error("💾 [Cache Error] Failed to read from cache:", error);
        if (isLocalStorageAvailable) {
          localStorage.removeItem(cacheKey);
        }
      }
      
      return undefined;
    },

    /**
     * Set value in cache with timestamp
     */
    set(key: string, value: any): void {
      const cacheKey = getCacheKey(workspaceSlug, key);
      
      try {
        const entry: CacheEntry = {
          data: value,
          timestamp: Date.now(),
        };
        
        if (isLocalStorageAvailable) {
          localStorage.setItem(cacheKey, JSON.stringify(entry));
        } else {
          memoryCache.set(cacheKey, value);
        }
      } catch (error) {
        console.error("💾 [Cache Error] Failed to write to cache:", error);
        // If localStorage is full, try to clear old entries
        if (isLocalStorageAvailable && error instanceof Error && error.name === "QuotaExceededError") {
          this.clearStale();
          // Try again after clearing
          try {
            const entry: CacheEntry = {
              data: value,
              timestamp: Date.now(),
            };
            localStorage.setItem(cacheKey, JSON.stringify(entry));
          } catch (retryError) {
            console.error("💾 [Cache Error] Failed to write even after clearing:", retryError);
          }
        }
      }
    },

    /**
     * Delete value from cache
     */
    delete(key: string): void {
      const cacheKey = getCacheKey(workspaceSlug, key);
      
      try {
        if (isLocalStorageAvailable) {
          localStorage.removeItem(cacheKey);
        } else {
          memoryCache.delete(cacheKey);
        }
      } catch (error) {
        console.error("💾 [Cache Error] Failed to delete from cache:", error);
      }
    },

    /**
     * Get all keys in cache
     */
    keys(): string[] {
      if (isLocalStorageAvailable) {
        const prefix = `${CACHE_PREFIX}${workspaceSlug}_`;
        const keys: string[] = [];
        
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(prefix)) {
              // Remove prefix to get original key
              keys.push(key.substring(prefix.length));
            }
          }
        } catch (error) {
          console.error("💾 [Cache Error] Failed to list keys:", error);
        }
        
        return keys;
      } else {
        const prefix = `${CACHE_PREFIX}${workspaceSlug}_`;
        return Array.from(memoryCache.keys())
          .filter(k => k.startsWith(prefix))
          .map(k => k.substring(prefix.length));
      }
    },

    /**
     * Clear all cache entries for this workspace
     */
    clear(): void {
      if (isLocalStorageAvailable) {
        const prefix = `${CACHE_PREFIX}${workspaceSlug}_`;
        const keysToRemove: string[] = [];
        
        try {
          // Collect keys to remove
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(prefix)) {
              keysToRemove.push(key);
            }
          }
          
          // Remove collected keys
          keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
          console.error("💾 [Cache Error] Failed to clear cache:", error);
        }
      } else {
        const prefix = `${CACHE_PREFIX}${workspaceSlug}_`;
        Array.from(memoryCache.keys())
          .filter(k => k.startsWith(prefix))
          .forEach(k => memoryCache.delete(k));
      }
    },

    /**
     * Clear only stale entries (older than TTL)
     */
    clearStale(): void {
      if (isLocalStorageAvailable) {
        const prefix = `${CACHE_PREFIX}${workspaceSlug}_`;
        const keysToRemove: string[] = [];
        
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(prefix)) {
              const stored = localStorage.getItem(key);
              if (stored) {
                try {
                  const entry: CacheEntry = JSON.parse(stored);
                  if (isStale(entry)) {
                    keysToRemove.push(key);
                  }
                } catch (parseError) {
                  // If can't parse, remove it
                  keysToRemove.push(key);
                }
              }
            }
          }
          
          keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
          console.error("Failed to clear stale cache:", error);
        }
      }
    },

    /**
     * Get cache statistics
     */
    getStats(): { size: number; count: number; workspace: string } {
      let size = 0;
      let count = 0;
      
      if (isLocalStorageAvailable) {
        const prefix = `${CACHE_PREFIX}${workspaceSlug}_`;
        
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(prefix)) {
              const value = localStorage.getItem(key);
              if (value) {
                size += value.length;
                count++;
              }
            }
          }
        } catch (error) {
          console.error("💾 [Cache Error] Failed to get stats:", error);
        }
      } else {
        const prefix = `${CACHE_PREFIX}${workspaceSlug}_`;
        Array.from(memoryCache.keys())
          .filter(k => k.startsWith(prefix))
          .forEach(() => count++);
      }
      
      return {
        size, // in bytes
        count,
        workspace: workspaceSlug,
      };
    },
  };
}

/**
 * Clear all analytics cache across all workspaces
 * Useful for debugging or when user logs out
 */
export function clearAllAnalyticsCache(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  
  const keysToRemove: string[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error("Failed to clear all analytics cache:", error);
  }
}

