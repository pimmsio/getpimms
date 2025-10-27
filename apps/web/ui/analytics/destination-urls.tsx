import { BlurImage, useRouterStuff } from "@dub/ui";
import { ExternalLink } from "lucide-react";
import { getGoogleFavicon, getApexDomain } from "@dub/utils";
import { useMemo } from "react";
import { AnalyticsCard } from "./analytics-card";
import { AnalyticsLoadingSpinner } from "./analytics-loading-spinner";
import MixedBarList from "./mixed-bar-list";
import { useAnalyticsFilterOption } from "./utils";

export default function DestinationUrls() {
  const { queryParams } = useRouterStuff();

  const { data: rawData } = useAnalyticsFilterOption({
    groupBy: "top_urls",
  });

  // Group URLs by base path (without query params)
  const groupedData = useMemo(() => {
    if (!rawData) return null;
    
    const urlMap = new Map<string, {
      url: string;
      displayUrl: string;
      clicks: number;
      leads: number;
      sales: number;
      saleAmount: number;
    }>();
    
    rawData.forEach((item) => {
      const fullUrl = item.url || '';
      
      // Normalize URL for grouping: strip query params, hash, trailing slash
      let normalizedKey = fullUrl
        .split('?')[0]    // Remove query params
        .split('#')[0]    // Remove hash
        .replace(/\/$/, '');  // Remove trailing slash
      
      const existing = urlMap.get(normalizedKey);
      if (existing) {
        // Aggregate metrics for same base URL
        urlMap.set(normalizedKey, {
          url: existing.url, // Keep first full URL for filter value
          displayUrl: existing.displayUrl,
          clicks: existing.clicks + (item.clicks || 0),
          leads: existing.leads + (item.leads || 0),
          sales: existing.sales + (item.sales || 0),
          saleAmount: existing.saleAmount + (item.saleAmount || 0),
        });
      } else {
        urlMap.set(normalizedKey, {
          url: normalizedKey, // Use clean URL for filter value
          displayUrl: normalizedKey.replace(/^https?:\/\//, ''), // For display without protocol
          clicks: item.clicks || 0,
          leads: item.leads || 0,
          sales: item.sales || 0,
          saleAmount: item.saleAmount || 0,
        });
      }
    });
    
    // Convert back to array and sort by clicks (keep click sorting for analytics)
    return Array.from(urlMap.values()).sort((a, b) => b.clicks - a.clicks);
  }, [rawData]);

  const singularTabName = "url";

  return (
    <AnalyticsCard
      tabs={[
        { 
          id: "urls", 
          label: "Destination URLs", 
          icon: ExternalLink
        },
      ]}
      selectedTabId="urls"
      onSelectTab={() => {}} // No tab switching
      expandLimit={5}
      hasMore={(groupedData?.length ?? 0) > 8}
    >
      {({ limit, setShowModal }) => (
        <>
          {groupedData ? (
            groupedData.length > 0 ? (
              <MixedBarList
                tab="Destination URL"
                data={
                  groupedData
                    ?.map((d) => {
                      const domain = getApexDomain(d.displayUrl);
                      
                      return {
                        icon: (
                          <BlurImage
                            src={getGoogleFavicon(domain, false)}
                            alt={domain}
                            width={20}
                            height={20}
                            className="h-4 w-4 rounded-full"
                          />
                        ),
                        title: d.displayUrl, // Display without protocol
                        href: queryParams({
                          set: {
                            [singularTabName]: d.url, // Use full URL for filter
                          },
                          getNewPath: true,
                        }) as string,
                        clicks: d.clicks || 0,
                        leads: d.leads || 0,
                        sales: d.sales || 0,
                        saleAmount: d.saleAmount || 0,
                      };
                    })
                    ?.slice(0, limit)
                }
                setShowModal={setShowModal}
                {...(limit && { limit })}
              />
            ) : (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-sm text-gray-600">No data available</p>
              </div>
            )
          ) : (
            <div className="flex h-[300px] items-center justify-center">
              <AnalyticsLoadingSpinner />
            </div>
          )}
        </>
      )}
    </AnalyticsCard>
  );
}
