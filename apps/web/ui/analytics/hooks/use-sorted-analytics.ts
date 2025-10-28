/**
 * Hook that combines data fetching with automatic sorting by selected metric
 * Perfect for components that need sorted lists (devices, locations, etc.)
 */

import { AnalyticsGroupByOptions } from "@/lib/analytics/types";
import { editQueryString } from "@/lib/analytics/utils";
import { useMemo } from "react";
import { sortByMetric, type SelectedTab } from "../lib/sort-utils";
import { useAnalyticsApi, useAnalyticsState } from "./use-analytics-context";
import { useAnalyticsData, type UseAnalyticsDataOptions } from "./use-analytics-data";

export interface AnalyticsMetricData {
  clicks?: number;
  leads?: number;
  sales?: number;
  saleAmount?: number;
  [key: string]: any;
}

/**
 * Fetches analytics data grouped by a dimension and automatically sorts by the selected metric
 * 
 * @example
 * const { data: sortedDevices, isLoading } = useSortedAnalytics("devices");
 * // Returns devices sorted by clicks/leads/sales based on selectedTab
 */
export function useSortedAnalytics<T extends AnalyticsMetricData = AnalyticsMetricData>(
  groupBy: AnalyticsGroupByOptions,
  options?: UseAnalyticsDataOptions,
): {
  data: T[] | null;
  rawData: T[] | null;
  isLoading: boolean;
  error: any;
} {
  const { baseApiPath, queryString } = useAnalyticsApi();
  const { selectedTab } = useAnalyticsState();

  const endpoint = useMemo(() => {
    if (!baseApiPath) return null;
    return `${baseApiPath}?${editQueryString(queryString, {
      groupBy,
      event: "composite",
    })}`;
  }, [baseApiPath, queryString, groupBy]);

  const { data: rawData, isLoading, error } = useAnalyticsData<T[]>(
    endpoint,
    options,
  );

  const sortedData = useMemo(() => {
    if (!rawData) return null;
    return sortByMetric(rawData, selectedTab as SelectedTab);
  }, [rawData, selectedTab]);

  return {
    data: sortedData,
    rawData,
    isLoading,
    error,
  };
}

/**
 * Fetches multiple analytics dimensions at once, all sorted by the selected metric
 * Useful for components that display multiple related data sets
 * 
 * @example
 * const { devices, browsers, os, isLoading } = useMultipleSortedAnalytics({
 *   devices: "devices",
 *   browsers: "browsers", 
 *   os: "os"
 * });
 */
export function useMultipleSortedAnalytics<
  K extends string,
  T extends AnalyticsMetricData = AnalyticsMetricData
>(
  groups: Record<K, AnalyticsGroupByOptions>,
  options?: UseAnalyticsDataOptions,
): Record<K, T[] | null> & { isLoading: boolean } {
  const results: Record<string, any> = {};
  let anyLoading = false;

  Object.entries(groups).forEach(([key, groupBy]) => {
    const { data, isLoading } = useSortedAnalytics<T>(
      groupBy as AnalyticsGroupByOptions,
      options,
    );
    results[key] = data;
    if (isLoading) anyLoading = true;
  });

  return {
    ...results,
    isLoading: anyLoading,
  } as Record<K, T[] | null> & { isLoading: boolean };
}

