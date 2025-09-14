import { SINGULAR_ANALYTICS_ENDPOINTS } from "@/lib/analytics/constants";
import { 
  groupReferrerAnalytics, 
  getReferrerDisplayName,
  isGroupedReferrer,
  getBestDomainForLogo,
} from "@/lib/analytics/utils";
import { BlurImage, useRouterStuff } from "@dub/ui";
import { ArrowUpRight, Link2 } from "lucide-react";
import { getGoogleFavicon } from "@dub/utils";
import { useMemo } from "react";
import { AnalyticsCard } from "./analytics-card";
import { AnalyticsLoadingSpinner } from "./analytics-loading-spinner";
import MixedBarList from "./mixed-bar-list";
import { useAnalyticsFilterOption } from "./utils";

export default function Referrers() {
  const { queryParams, searchParams } = useRouterStuff();

  const { data: rawData } = useAnalyticsFilterOption({
    groupBy: "referers",
  });

  const singularTabName = SINGULAR_ANALYTICS_ENDPOINTS["referers"];

  // Group referrer data
  const data = useMemo(() => {
    if (!rawData) return rawData;
    
    // Check if we're filtering by a grouped referrer
    const refererFilter = searchParams.get(singularTabName);
    if (refererFilter && isGroupedReferrer(refererFilter)) {
      // Filter raw data to show only items that belong to this group
      const filteredData = rawData.filter(item => {
        const referrerValue = item.referer || item.referers || '';
        const groupName = getReferrerDisplayName(referrerValue);
        return groupName === refererFilter;
      });
      
      // Then group the filtered data to show the grouped item
      return groupReferrerAnalytics(filteredData);
    }
    
    // Always show grouped data for referrers
    return groupReferrerAnalytics(rawData);
  }, [rawData, searchParams, singularTabName]);

  return (
    <AnalyticsCard
      tabs={[
        { 
          id: "referrers", 
          label: "Referrers", 
          icon: ArrowUpRight
        },
      ]}
      selectedTabId="referrers"
      onSelectTab={() => {}} // No tab switching
      expandLimit={8}
      hasMore={(data?.length ?? 0) > 8}
    >
      {({ limit, setShowModal }) => (
        <>
          {data ? (
            data.length > 0 ? (
              <MixedBarList
                tab="Referrer"
                data={
                  data
                    ?.map((d) => {
                      const referrerValue = d.referer || d.referers || '';
                      const displayName = getReferrerDisplayName(referrerValue);
                      const domain = getBestDomainForLogo(referrerValue);
                      
                      return {
                        icon: displayName === "(direct)" ? (
                          <Link2 className="h-4 w-4" />
                        ) : (
                          <BlurImage
                            src={getGoogleFavicon(domain, false)}
                            alt={displayName}
                            width={20}
                            height={20}
                            className="h-4 w-4 rounded-full"
                          />
                        ),
                        title: displayName,
                        href: queryParams({
                          set: {
                            [singularTabName]: displayName,
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
                <p className="text-sm text-gray-600">No referrer data available</p>
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