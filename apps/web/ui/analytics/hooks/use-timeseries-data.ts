/**
 * Specialized hook for fetching timeseries analytics data
 */

import { editQueryString } from "@/lib/analytics/utils";
import { groupTimeseriesData } from "@/lib/analytics/utils/group-timeseries-data";
import { useMemo } from "react";
import { useAnalyticsApi, useAnalyticsState } from "./use-analytics-context";
import { useAnalyticsData, type UseAnalyticsDataOptions } from "./use-analytics-data";

export interface TimeseriesDataPoint {
  start: Date;
  clicks: number;
  leads: number;
  sales: number;
  saleAmount: number;
}

export interface FormattedTimeseriesPoint {
  date: Date;
  values: {
    clicks: number;
    leads: number;
    sales: number;
    saleAmount: number;
  };
}

/**
 * Fetches and formats timeseries data with automatic interval grouping
 * Handles weekly/biweekly grouping for longer date ranges
 * 
 * @example
 * const { data, isLoading } = useTimeseriesData({ demo: false });
 */
export function useTimeseriesData(options?: UseAnalyticsDataOptions): {
  data: FormattedTimeseriesPoint[] | null;
  rawData: TimeseriesDataPoint[] | null;
  isLoading: boolean;
  error: any;
} {
  const { baseApiPath, queryString } = useAnalyticsApi();
  const { interval } = useAnalyticsState();

  const endpoint = useMemo(() => {
    if (!baseApiPath) return null;
    return `${baseApiPath}?${editQueryString(queryString, {
      groupBy: "timeseries",
      event: "composite",
    })}`;
  }, [baseApiPath, queryString]);

  const { data: rawData, isLoading, error } = useAnalyticsData<TimeseriesDataPoint[]>(
    endpoint,
    options,
  );

  const formattedData = useMemo(() => {
    if (!rawData) return null;

    // Transform to standard format
    const dataMap = new Map<string, FormattedTimeseriesPoint>();

    rawData.forEach(({ start, clicks, leads, sales, saleAmount }) => {
      const dateKey = start.toString();
      dataMap.set(dateKey, {
        date: new Date(start),
        values: {
          clicks: clicks || 0,
          leads: leads || 0,
          sales: sales || 0,
          saleAmount: (saleAmount ?? 0) / 100,
        },
      });
    });

    const mergedData = Array.from(dataMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    // Apply grouping for weekly/biweekly intervals
    if (interval === "90d" || interval === "qtd") {
      return groupTimeseriesData(mergedData, "week");
    } else if (interval === "6m" || interval === "all") {
      return groupTimeseriesData(mergedData, "biweekly");
    }

    return mergedData;
  }, [rawData, interval]);

  return {
    data: formattedData,
    rawData,
    isLoading,
    error,
  };
}

