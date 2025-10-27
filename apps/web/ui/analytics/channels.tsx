import { 
  groupChannelAnalytics, 
  groupReferrerAnalytics, 
  getReferrerDisplayName,
  isReferrerInChannel,
  type ChannelType,
} from "@/lib/analytics/utils";
import { useRouterStuff } from "@dub/ui";
import { Filter } from "lucide-react";
import { useContext, useMemo } from "react";
import { AnalyticsCard } from "./analytics-card";
import { AnalyticsLoadingSpinner } from "./analytics-loading-spinner";
import { AnalyticsContext } from "./analytics-provider";
import ChannelPieChart from "./channel-pie-chart";
import { useAnalyticsFilterOption } from "./utils";

export default function Channels() {
  const { searchParams } = useRouterStuff();

  const { selectedTab, saleUnit } = useContext(AnalyticsContext);

  const { data: rawData } = useAnalyticsFilterOption({
    groupBy: "referers",
  });
  
  const { data: destinationUrlsData } = useAnalyticsFilterOption({
    groupBy: "top_urls",
  });

  // Process data for channels
  const data = useMemo(() => {
    if (!rawData) return rawData;
    
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
  }, [rawData, searchParams]);

  return (
    <AnalyticsCard
      tabs={[
        { 
          id: "channels", 
          label: "Channels", 
          icon: Filter
        },
      ]}
      selectedTabId="channels"
      onSelectTab={() => {}} // No tab switching
      expandLimit={5}
      hasMore={(data?.length ?? 0) > 8}
    >
      {({ limit, setShowModal }) => (
        <>
          {data ? (
            data.length > 0 ? (
              <ChannelPieChart 
                data={data as any}
                groupedReferrerData={groupReferrerAnalytics(rawData || [])}
                destinationUrlsData={destinationUrlsData || []}
                selectedTab={selectedTab as "clicks" | "leads" | "sales"}
                saleUnit={saleUnit}
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
