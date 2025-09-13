import { fetcher } from "@dub/utils";
import { useContext } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { AnalyticsContext } from "@/ui/analytics/analytics-provider";

interface LinkInsightData {
  id: string;
  domain: string;
  key: string;
  url: string;
  shortLink: string;
  comments?: string;
  title?: string;
  createdAt: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
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

  const { data, error, isLoading } = useSWR<LinkInsightsResponse>(
    `${baseApiPath}/link-insights?${enhancedQueryString}`,
    fetcher,
    {
      shouldRetryOnError: !requiresUpgrade,
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
