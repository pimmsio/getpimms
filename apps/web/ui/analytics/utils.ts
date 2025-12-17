import { AnalyticsGroupByOptions } from "@/lib/analytics/types";
import { editQueryString } from "@/lib/analytics/utils";
import { fetcher } from "@dub/utils";
import { useContext } from "react";
import useSWR, { useSWRConfig } from "swr";
import { AnalyticsContext } from "./analytics-provider";

type AnalyticsFilterResult = {
  data: ({ count?: number } & Record<string, any>)[] | null;
  loading: boolean;
};

/**
 * Fetches event counts grouped by the specified filter
 *
 * @param groupByOrParams Either a groupBy option or a query parameter object including groupBy
 * @param options Additional options
 */
export function useAnalyticsFilterOption(
  groupByOrParams:
    | AnalyticsGroupByOptions
    | ({ groupBy: AnalyticsGroupByOptions } & Record<string, any>),
  options?: { cacheOnly?: boolean },
): AnalyticsFilterResult {
  const { cache } = useSWRConfig();

  const { baseApiPath, queryString, selectedTab, requiresUpgrade } =
    useContext(AnalyticsContext);

  const groupBy = typeof groupByOrParams === "string" 
    ? groupByOrParams 
    : groupByOrParams.groupBy;

  const endpoint = `${baseApiPath}?${editQueryString(queryString, {
    ...(typeof groupByOrParams === "string"
      ? { groupBy: groupByOrParams }
      : groupByOrParams),
    event: "composite", // Always fetch all metrics for mixed bars
    sortMetric: selectedTab === "sales" ? "saleAmount" : selectedTab,
  })}`;

  // Check cache for this exact endpoint
  const cachedEntry = cache.get(endpoint);
  
  // Extract data and check cache freshness
  // The cache returns SWR state with our added _pimms_cached_at timestamp
  const cachedData = cachedEntry;
  const cacheTimestamp = (cachedEntry as any)?._pimms_cached_at || 0;
  const cacheAge = cacheTimestamp ? Date.now() - cacheTimestamp : Infinity;
  const isCacheFresh = cacheAge < 60000; // Fresh if < 60 seconds old
  const hasCachedData = !!cachedData;

  const enabled =
    !options?.cacheOnly || hasCachedData;

  const { data, isLoading } = useSWR<Record<string, any>[]>(
    enabled ? endpoint : null,
    fetcher,
    {
      shouldRetryOnError: !requiresUpgrade,
      // Only revalidate if cache is stale or doesn't exist
      revalidateIfStale: !isCacheFresh,
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  return {
    data:
      data?.map((d) => ({
        ...d,
        count: d[selectedTab] as number | undefined,
        clicks: d.clicks as number | undefined,
        leads: d.leads as number | undefined,
        sales: d.sales as number | undefined,
        saleAmount: d.saleAmount as number | undefined,
      })) ?? null,
    loading: !data || isLoading,
  };
}

/**
 * Fetches event counts grouped by the specified filter, excluding the filter itself
 * This is useful for multi-select filters where you want to see all options,
 * not just the ones that match the current filter
 *
 * @param groupByOrParams Either a groupBy option or a query parameter object including groupBy
 * @param excludeFilter The filter parameter(s) to exclude from the query (e.g., 'url', 'referer', or ['domain', 'key'])
 * @param options Additional options
 */
export function useAnalyticsFilterOptionWithoutSelf(
  groupByOrParams:
    | AnalyticsGroupByOptions
    | ({ groupBy: AnalyticsGroupByOptions } & Record<string, any>),
  excludeFilter: string | string[],
  options?: { cacheOnly?: boolean },
): AnalyticsFilterResult {
  const { cache } = useSWRConfig();

  const { baseApiPath, queryString, selectedTab, requiresUpgrade } =
    useContext(AnalyticsContext);

  const groupBy = typeof groupByOrParams === "string" 
    ? groupByOrParams 
    : groupByOrParams.groupBy;

  const endpoint = `${baseApiPath}?${editQueryString(queryString, {
    ...(typeof groupByOrParams === "string"
      ? { groupBy: groupByOrParams }
      : groupByOrParams),
    event: "composite", // Always fetch all metrics for mixed bars
    sortMetric: selectedTab === "sales" ? "saleAmount" : selectedTab,
  }, excludeFilter)}`;

  // Check cache for this exact endpoint
  const cachedEntry = cache.get(endpoint);
  
  // Extract data and check cache freshness
  // The cache returns SWR state with our added _pimms_cached_at timestamp
  const cachedData = cachedEntry;
  const cacheTimestamp = (cachedEntry as any)?._pimms_cached_at || 0;
  const cacheAge = cacheTimestamp ? Date.now() - cacheTimestamp : Infinity;
  const isCacheFresh = cacheAge < 60000; // Fresh if < 60 seconds old
  const hasCachedData = !!cachedData;

  const enabled =
    !options?.cacheOnly || hasCachedData;

  const { data, isLoading } = useSWR<Record<string, any>[]>(
    enabled ? endpoint : null,
    fetcher,
    {
      shouldRetryOnError: !requiresUpgrade,
      // Only revalidate if cache is stale or doesn't exist
      revalidateIfStale: !isCacheFresh,
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  return {
    data:
      data?.map((d) => ({
        ...d,
        count: d[selectedTab] as number | undefined,
        clicks: d.clicks as number | undefined,
        leads: d.leads as number | undefined,
        sales: d.sales as number | undefined,
        saleAmount: d.saleAmount as number | undefined,
      })) ?? null,
    loading: !data || isLoading,
  };
}
