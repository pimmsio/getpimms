/**
 * Generic hook for fetching analytics data with standard SWR configuration
 */

import { fetcher } from "@dub/utils";
import useSWR, { type SWRConfiguration } from "swr";
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

  const { data, isLoading, error, mutate } = useSWR<T>(
    !options?.demo && endpoint ? endpoint : null,
    fetcher,
    {
      shouldRetryOnError: !requiresUpgrade,
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

