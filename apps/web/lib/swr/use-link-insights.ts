import { fetcher } from "@dub/utils";
import { useContext } from "react";
import useSWR, { SWRConfiguration, useSWRConfig } from "swr";
import { AnalyticsContext } from "@/ui/analytics/analytics-provider";

interface TagData {
  id: string;
  name: string;
  color: string;
}

interface LinkInsightData {
  id: string;
  domain: string;
  key: string;
  url: string;
  shortLink: string;
  comments?: string;
  title?: string;
  description?: string;
  createdAt: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  tags: TagData[];
  clicks: number;
  leads: number;
  sales: number;
  saleAmount: number;
  timeseriesData: Array<{
    start: string;
    clicks: number;
    leads: number;
    sales: number;
    saleAmount: number;
  }>;
}

interface LinkInsightsResponse {
  links: LinkInsightData[];
  timeseries: Array<{
    start: string;
    clicks: number;
    leads: number;
    sales: number;
    saleAmount: number;
  }>;
}

export default function useLinkInsights(
  options?: SWRConfiguration,
) {
  const { baseApiPath, queryString, requiresUpgrade } = useContext(AnalyticsContext);
  const { cache } = useSWRConfig();

  // Force event=composite to get all metrics (clicks, leads, sales)
  let enhancedQueryString = queryString.includes('event=') 
    ? queryString.replace(/event=[^&]*/, 'event=composite')
    : `${queryString}&event=composite`;
    
  // Force max 30 days for link insights to avoid errors
  const originalInterval = enhancedQueryString.match(/interval=([^&]*)/)?.[1];
  const effectiveInterval = originalInterval === "90d" || originalInterval === "1y" || originalInterval === "all" 
    ? "30d" 
    : originalInterval || "7d"; // default fallback
    
  enhancedQueryString = enhancedQueryString.includes('interval=')
    ? enhancedQueryString.replace(/interval=(90d|1y|all)/, 'interval=30d')
    : enhancedQueryString;
    
  // Removed groupBy parameter - using days only

  const endpoint = `${baseApiPath}/link-insights?${enhancedQueryString}`;

  // Check if we have cached data for this endpoint
  const cachedEntry = cache.get(endpoint);
  
  // Extract data and check cache freshness
  // The cache returns SWR state with our added _pimms_cached_at timestamp
  const cacheTimestamp = (cachedEntry as any)?._pimms_cached_at || 0;
  const cacheAge = cacheTimestamp ? Date.now() - cacheTimestamp : Infinity;
  const isCacheFresh = cacheAge < 60000; // Fresh if < 60 seconds old

  const { data, error, isLoading } = useSWR<LinkInsightsResponse>(
    endpoint,
    fetcher,
    {
      shouldRetryOnError: !requiresUpgrade,
      // Only revalidate if cache is stale or doesn't exist
      revalidateIfStale: !isCacheFresh,
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      keepPreviousData: true,
      ...options,
    },
  );

  return {
    data,
    error,
    loading: isLoading,
    effectiveInterval,
  };
}
