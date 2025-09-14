import { SINGULAR_ANALYTICS_ENDPOINTS } from "@/lib/analytics/constants";
import { 
  groupChannelAnalytics, 
  groupReferrerAnalytics, 
  getReferrerDisplayName,
  isReferrerInChannel,
  isGroupedReferrer,
  getBestDomainForLogo,
  type ChannelType} from "@/lib/analytics/utils";
import { UTM_TAGS_PLURAL, UTM_TAGS_PLURAL_LIST } from "@/lib/zod/schemas/utm";
import { BlurImage, useRouterStuff } from "@dub/ui";
import { 
  Link2, 
  Filter,
  ArrowUpRight
} from "lucide-react";
import { getGoogleFavicon } from "@dub/utils";
import { useContext, useMemo, useState } from "react";
import { AnalyticsCard } from "./analytics-card";
import { AnalyticsLoadingSpinner } from "./analytics-loading-spinner";
import { AnalyticsContext } from "./analytics-provider";
import MixedBarList from "./mixed-bar-list";
import ChannelPieChart from "./channel-pie-chart";
import { useAnalyticsFilterOption } from "./utils";

// Icon mapping for channels

export default function Channel() {
  const { queryParams, searchParams } = useRouterStuff();

  const { selectedTab, saleUnit } = useContext(AnalyticsContext);

  const [tab, setTab] = useState<"channels" | "referers">("channels");
  const [utmTag, setUtmTag] = useState<UTM_TAGS_PLURAL>("utm_sources");

  const { data: rawData } = useAnalyticsFilterOption({
    groupBy: "referers", // Always fetch referers
  });
  
  const { data: destinationUrlsData } = useAnalyticsFilterOption({
    groupBy: "top_urls",
  });

  const singularTabName = SINGULAR_ANALYTICS_ENDPOINTS[
    tab === "channels" ? "channels" : "referers"
  ];

  // Process data based on selected tab
  const data = useMemo(() => {
    if (!rawData) return rawData;
    
    if (tab === "channels") {
      // Check if we're filtering by a specific channel
      const channelFilter = searchParams.get("channel");
      if (channelFilter) {
        // Filter raw data to show only referrers that belong to this channel
        const filteredData = rawData.filter(item => {
          const referrerValue = item.referer || item.referers || '';
          const referrerDisplayName = getReferrerDisplayName(referrerValue);
          return isReferrerInChannel(referrerDisplayName, channelFilter as ChannelType);
        });
        
        // Return the grouped referrers for this channel
        return groupReferrerAnalytics(filteredData);
      }
      
      // Group referrers first, then group by channels
      const groupedReferrers = groupReferrerAnalytics(rawData);
      return groupChannelAnalytics(groupedReferrers);
    }
    
    // For referers tab, handle grouped referrer filtering
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
  }, [rawData, tab, utmTag, searchParams, singularTabName]);


  const subTabProps = useMemo(() => {
    return ({
      utms: {
        subTabs: [
          { id: "all", label: "All" },
          ...UTM_TAGS_PLURAL_LIST.map((u) => ({
            id: u,
            label: SINGULAR_ANALYTICS_ENDPOINTS[u].replace("utm_", "").charAt(0).toUpperCase() + SINGULAR_ANALYTICS_ENDPOINTS[u].replace("utm_", "").slice(1),
          })),
        ],
        selectedSubTabId: utmTag === "utm_sources" ? "utm_sources" : utmTag,
        onSelectSubTab: (value: string) => {
          if (value === "all") {
            setUtmTag("utm_sources"); // Default to sources when "All" is selected
          } else {
            setUtmTag(value as UTM_TAGS_PLURAL);
          }
        },
      },
    }[tab] ?? {});
  }, [tab, utmTag]);

  return (
    <AnalyticsCard
      tabs={[
        { 
          id: "channels", 
          label: "Channels", 
          icon: Filter
        },
        { 
          id: "referers", 
          label: "Referrers", 
          icon: ArrowUpRight
        },
      ]}
      selectedTabId={tab}
      onSelectTab={setTab}
      {...subTabProps}
      expandLimit={8}
      hasMore={(data?.length ?? 0) > 8}
    >
      {({ limit, setShowModal }) => (
        <>
          {data ? (
            data.length > 0 ? (
              tab === "channels" ? (
                <ChannelPieChart 
                  data={data as any}
                  groupedReferrerData={groupReferrerAnalytics(rawData || [])}
                  destinationUrlsData={destinationUrlsData || []}
                  selectedTab={selectedTab as "clicks" | "leads" | "sales"}
                  saleUnit={saleUnit}
                />
              ) : (
                <MixedBarList
                  tab="Referrer"
                  data={
                    data
                      ?.map((d) => {
                        const displayName = getReferrerDisplayName(d[singularTabName]);

                        return {
                          icon: displayName === "(direct)" ? (
                            <Link2 className="h-4 w-4" />
                          ) : (
                            <BlurImage
                              src={getGoogleFavicon(
                                getBestDomainForLogo(getReferrerDisplayName(d[singularTabName])),
                                false,
                              )}
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
              )
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
