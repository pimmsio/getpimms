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
 * Get filters to exclude based on groupBy to avoid conflicting filter + groupBy combinations
 */
function getFiltersToExclude(groupBy: AnalyticsGroupByOptions): string[] {
  const excludeMap: Record<string, string[]> = {
    'referers': ['referer', 'refererUrl', 'channel'],
    'referer_urls': ['referer', 'refererUrl', 'channel'],
    'channels': ['referer', 'refererUrl', 'channel'],
    'countries': ['country', 'continent', 'region', 'city'],
    'cities': ['city'],
    'regions': ['region'],
    'continents': ['continent'],
    'devices': ['device'],
    'browsers': ['browser'],
    'os': ['os'],
    'triggers': ['trigger', 'qr'],
    'top_urls': ['url'],
    'utm_sources': ['utm_source'],
    'utm_mediums': ['utm_medium'],
    'utm_campaigns': ['utm_campaign'],
    'utm_terms': ['utm_term'],
    'utm_contents': ['utm_content'],
  };
  
  return excludeMap[groupBy] || [];
}

/**
 * Remove specified filters from query string
 */
function removeFiltersFromQueryString(queryString: string, filtersToRemove: string[]): string {
  const params = new URLSearchParams(queryString);
  filtersToRemove.forEach(filter => params.delete(filter));
  return params.toString();
}

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

  // Determine which filters to exclude based on groupBy to avoid conflicts
  const filtersToExclude = getFiltersToExclude(groupBy);
  
  // Build query string without conflicting filters
  const cleanedQueryString = removeFiltersFromQueryString(queryString, filtersToExclude);

  const enabled =
    !options?.cacheOnly ||
    [...cache.keys()].includes(
      `${baseApiPath}?${editQueryString(cleanedQueryString, {
        ...(typeof groupByOrParams === "string"
          ? { groupBy: groupByOrParams }
          : groupByOrParams),
      })}`,
    );

  const { data, isLoading } = useSWR<Record<string, any>[]>(
    enabled
      ? `${baseApiPath}?${editQueryString(cleanedQueryString, {
          ...(typeof groupByOrParams === "string"
            ? { groupBy: groupByOrParams }
            : groupByOrParams),
          event: "composite", // Always fetch all metrics for mixed bars
        })}`
      : null,
    fetcher,
    {
      shouldRetryOnError: !requiresUpgrade,
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
