import { useRouterStuff } from "@dub/ui";
import { ReferredVia } from "@dub/ui/icons";
import { nFormatter } from "@dub/utils";
import { useContext, useMemo } from "react";
import { AnalyticsCard } from "./analytics-card";
import { AnalyticsContext } from "./analytics-provider";
import RefererIcon from "./referer-icon";
import { useAnalyticsFilterOption } from "./utils";
import { MetricsDisplay } from "./metrics-display";
import { RANK_COLORS } from "./lib";
import { groupReferrerAnalytics, getReferrerDisplayName, isGroupedReferrer, getDomainsForReferrerGroup } from "@/lib/analytics/utils";

export default function Channel({
  dragHandleProps,
}: {
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const { queryParams, searchParams } = useRouterStuff();
  const { selectedTab } = useContext(AnalyticsContext);

  const { data: referersData } = useAnalyticsFilterOption({ groupBy: "referers" });

  // Group referrer data
  const groupedData = useMemo(() => {
    if (!referersData) return null;
    
    // Check if we're filtering by a grouped referrer
    const refererFilter = searchParams.get('referer');
    if (refererFilter && isGroupedReferrer(refererFilter)) {
      // Filter raw data to show only items that belong to this group
      const filteredData = referersData.filter(item => {
        const referrerValue = item.referer || item.referers || '';
        const groupName = getReferrerDisplayName(referrerValue);
        return groupName === refererFilter;
      });
      
      // Then group the filtered data to show the grouped item
      return groupReferrerAnalytics(filteredData);
    }
    
    // Always show grouped data for referrers
    return groupReferrerAnalytics(referersData);
  }, [referersData, searchParams]);

  const isLoading = !referersData;
  const hasData = (groupedData?.length ?? 0) > 0;

  // Sort data based on selected metric
  const sortedReferersData = groupedData ? [...groupedData].sort((a, b) => {
    const aValue = selectedTab === "sales" ? (a.saleAmount || 0) : selectedTab === "leads" ? (a.leads || 0) : (a.clicks || 0);
    const bValue = selectedTab === "sales" ? (b.saleAmount || 0) : selectedTab === "leads" ? (b.leads || 0) : (b.clicks || 0);
    return bValue - aValue;
  }) : null;

  return (
    <AnalyticsCard
      tabs={[{ id: "referers", label: "Top Referrers", icon: ReferredVia }]}
      selectedTabId="referers"
      onSelectTab={() => {}}
      expandLimit={5}
      hasMore={(sortedReferersData?.length ?? 0) > 5}
      dragHandleProps={dragHandleProps}
    >
      {({ limit, setShowModal, isModal }) => (
        <>
          {isLoading ? (
            <div className="flex flex-col px-4 py-3 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="h-8 w-8 rounded-full bg-neutral-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-neutral-100 rounded w-3/4" />
                    <div className="h-2 bg-neutral-50 rounded w-1/2" />
                  </div>
                  <div className="h-3 w-12 bg-neutral-100 rounded" />
                </div>
              ))}
            </div>
          ) : !hasData ? (
            <div className="flex h-[380px] flex-col items-center justify-center gap-3 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 ring-1 ring-neutral-200/50">
                <ReferredVia className="h-6 w-6 text-neutral-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">No referrer data yet</p>
                <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed max-w-xs">
                  Discover where your traffic comes from - social media, search engines, direct visits, and more
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col px-4 py-3">
              <div className="space-y-2">
                {sortedReferersData?.slice(0, isModal ? undefined : (limit || 5)).map((item, idx) => {
                  const metric = selectedTab === "sales" ? item.saleAmount : selectedTab === "leads" ? item.leads : item.clicks;
                  const totalClicks = sortedReferersData.reduce((sum, r) => sum + (r.clicks || 0), 0);
                  const percentage = sortedReferersData.length > 0 ? Math.round((item.clicks / totalClicks) * 100) : 0;
                  const maxClicks = Math.max(...sortedReferersData.map(r => r.clicks || 0));
                  const barWidth = maxClicks > 0 ? (item.clicks / maxClicks) * 100 : 0;

                  return (
                    <a
                      key={idx}
                      href={queryParams({
                        ...(searchParams.has('referer')
                          ? { del: 'referer' }
                          : {
                              set: {
                                referer: (() => {
                                  // If this is a grouped referrer, use all domains from the group
                                  if (isGroupedReferrer(item.referer)) {
                                    return getDomainsForReferrerGroup(item.referer).join(',');
                                  }
                                  // Otherwise use the original referrer
                                  return item.referer;
                                })(),
                              },
                            }),
                        getNewPath: true,
                      }) as string}
                      className="relative flex items-center gap-3 rounded-lg px-3 py-1.5 hover:bg-neutral-50 transition-all group border border-transparent hover:border-neutral-200 overflow-hidden"
                    >
                      {/* Progress bar background - always visible */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-blue-100/30 to-transparent group-hover:from-blue-100/60 transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                      
                      {idx < 3 && (
                        <div className={`relative flex h-6 w-6 items-center justify-center rounded-full ${RANK_COLORS[idx]} text-xs font-bold flex-shrink-0 shadow-sm`}>
                          {idx + 1}
                        </div>
                      )}
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 flex-shrink-0">
                        <RefererIcon display={item.referer} className="h-4 w-4" />
                      </div>
                      <div className="relative flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {getReferrerDisplayName(item.referer) || "(direct)"}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {percentage}% of traffic
                        </p>
                      </div>
                      <MetricsDisplay
                        clicks={item.clicks || 0}
                        leads={item.leads}
                        sales={item.sales}
                        saleAmount={item.saleAmount}
                        primaryMetric={selectedTab}
                        className="relative"
                      />
                    </a>
                  );
                })}
              </div>
              
              {!isModal && (sortedReferersData?.length ?? 0) > 5 && (
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 text-xs text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 font-medium transition-all"
                >
                  View all {sortedReferersData?.length} referrers →
                </button>
              )}
            </div>
          )}
        </>
      )}
    </AnalyticsCard>
  );
}
