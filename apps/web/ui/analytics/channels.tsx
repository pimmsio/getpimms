import { 
  groupChannelAnalytics, 
  groupReferrerAnalytics,
} from "@/lib/analytics/utils";
import { Filter } from "lucide-react";
import { AnalyticsCard } from "./analytics-card";
import ChannelPieChart from "./channel-pie-chart";
import { useAnalyticsFilterOption } from "./utils";
import { PieChartLoadingSkeleton, NoDataYetEmptyState } from "./components";
import { useAnalyticsState } from "./hooks";

export default function Channels() {
  const { selectedTab, saleUnit } = useAnalyticsState();

  const { data: rawData } = useAnalyticsFilterOption({ groupBy: "referers" });
  const { data: destinationUrlsData } = useAnalyticsFilterOption({ groupBy: "top_urls" });

  const isLoading = !rawData;
  const groupedReferrers = rawData ? groupReferrerAnalytics(rawData) : null;
  const channelData = groupedReferrers ? groupChannelAnalytics(groupedReferrers) : null;
  const hasData = channelData && channelData.length > 0;

  return (
    <AnalyticsCard
      tabs={[{ id: "channels", label: "Top Channels", icon: Filter }]}
      selectedTabId="channels"
      onSelectTab={() => {}}
      expandLimit={5}
      hasMore={false}
    >
      {() => (
        <>
          {isLoading ? (
            <PieChartLoadingSkeleton />
          ) : !hasData ? (
            <NoDataYetEmptyState
              icon={Filter}
              dataType="channel data"
              description="See traffic distribution across different channels"
            />
          ) : (
            <ChannelPieChart 
              data={channelData as any}
              groupedReferrerData={groupedReferrers || []}
              destinationUrlsData={destinationUrlsData || []}
              selectedTab={selectedTab as "clicks" | "leads" | "sales"}
              saleUnit={saleUnit}
            />
          )}
        </>
      )}
    </AnalyticsCard>
  );
}

