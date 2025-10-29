/**
 * Generic hook for fetching analytics data with standard SWR configuration
 */

import { fetcher } from "@dub/utils";
import useSWR, { type SWRConfiguration, useSWRConfig } from "swr";
import { useAnalyticsApi, useAnalyticsWorkspace } from "./use-analytics-context";

export interface UseAnalyticsDataOptions {
  /**
   * Show demo data instead of making real API calls
   */
  demo?: boolean;
  /**
   * Custom SWR configuration options
   */
  swrOptions?: SWRConfiguration;
}

/**
 * Fetches analytics data with standard configuration
 * Eliminates repeated SWR config across analytics components
 * 
 * @example
 * const { data, isLoading, error } = useAnalyticsData<MyDataType>(
 *   `${baseApiPath}?groupBy=devices`,
 *   { demo: false }
 * );
 */
export function useAnalyticsData<T = any>(
  endpoint: string | null,
  options?: UseAnalyticsDataOptions,
): {
  data: T | null;
  isLoading: boolean;
  error: any;
  mutate: () => void;
} {
  const { requiresUpgrade } = useAnalyticsWorkspace();
  const { cache } = useSWRConfig();

  // Check if we have cached data for this endpoint
  const cachedEntry = endpoint ? cache.get(endpoint) : undefined;
  
  // Extract data and check cache freshness
  // The cache returns SWR state with our added _pimms_cached_at timestamp
  const cachedData = cachedEntry;
  const cacheTimestamp = (cachedEntry as any)?._pimms_cached_at || 0;
  const cacheAge = cacheTimestamp ? Date.now() - cacheTimestamp : Infinity;
  const isCacheFresh = cacheAge < 60000; // Fresh if < 60 seconds old

  const { data, isLoading, error, mutate } = useSWR<T>(
    !options?.demo && endpoint ? endpoint : null,
    fetcher,
    {
      shouldRetryOnError: !requiresUpgrade,
      // Only revalidate if cache is stale or doesn't exist
      revalidateIfStale: !isCacheFresh,
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      keepPreviousData: true,
      ...options?.swrOptions,
    },
  );

  return {
    data: data ?? null,
    isLoading: !data && !error,
    error,
    mutate,
  };
}

