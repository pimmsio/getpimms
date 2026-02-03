import {
  getDomainsForReferrerGroup,
  getReferrerDisplayName,
  groupReferrerAnalytics,
  isGroupedReferrer,
} from "@/lib/analytics/utils";
import { useRouterStuff } from "@dub/ui";
import { ReferredVia } from "@dub/ui/icons";
import { useContext, useMemo } from "react";
import { AnalyticsCard } from "./analytics-card";
import { AnalyticsContext } from "./analytics-provider";
import { AnalyticsEmptyState } from "./components/empty-states";
import { RANK_COLORS } from "./lib";
import { MetricsDisplay } from "./metrics-display";
import RefererIcon from "./referer-icon";
import { useAnalyticsFilterOption } from "./utils";

export default function Channel({
  dragHandleProps,
}: {
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const { queryParams, searchParams } = useRouterStuff();
  const { selectedTab } = useContext(AnalyticsContext);

  const { data: referersData } = useAnalyticsFilterOption({
    groupBy: "referers",
  });

  // Group referrer data
  const groupedData = useMemo(() => {
    if (!referersData) return null;

    // Check if we're filtering by a grouped referrer
    const refererFilter = searchParams.get("referer");
    if (refererFilter && isGroupedReferrer(refererFilter)) {
      // Filter raw data to show only items that belong to this group
      const filteredData = referersData.filter((item) => {
        const referrerValue = item.referer || item.referers || "";
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
  const sortedReferersData = groupedData
    ? [...groupedData].sort((a, b) => {
        const aValue =
          selectedTab === "sales"
            ? a.saleAmount || 0
            : selectedTab === "leads"
              ? a.leads || 0
              : a.clicks || 0;
        const bValue =
          selectedTab === "sales"
            ? b.saleAmount || 0
            : selectedTab === "leads"
              ? b.leads || 0
              : b.clicks || 0;
        return bValue - aValue;
      })
    : null;

  const totalClicks = sortedReferersData?.reduce((sum, r) => sum + (r.clicks || 0), 0) || 0;
  const totalLeads = sortedReferersData?.reduce((sum, r) => sum + (r.leads || 0), 0) || 0;

  return (
    <AnalyticsCard
      tabs={[{ id: "referers", label: "Top traffic sources", icon: ReferredVia }]}
      selectedTabId="referers"
      onSelectTab={() => {}}
      expandLimit={5}
      hasMore={(sortedReferersData?.length ?? 0) > 5}
      dragHandleProps={dragHandleProps}
    >
      {({ limit, setShowModal, isModal }) => (
        <>
          {isLoading ? (
            <div className="flex animate-pulse flex-col px-4 py-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="h-8 w-8 flex-shrink-0 rounded-md bg-neutral-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-neutral-100" />
                  <div className="h-2 w-1/2 rounded bg-neutral-100" />
                  </div>
                  <div className="h-3 w-12 rounded bg-neutral-100" />
                </div>
              ))}
            </div>
          ) : !hasData ? (
            <AnalyticsEmptyState
              icon={ReferredVia}
              title="No traffic source data yet"
              description="See where your traffic comes from: social media, search engines, direct visits, and more"
            />
          ) : (
            <div className="flex flex-col px-4 py-3">
              <div className="space-y-2">
                {sortedReferersData
                  ?.slice(0, isModal ? undefined : limit || 5)
                  .map((item, idx) => {
                    const metric =
                      selectedTab === "sales"
                        ? item.saleAmount
                        : selectedTab === "leads"
                          ? item.leads
                          : item.clicks;
                    const percentage =
                      sortedReferersData.length > 0
                        ? Math.round((item.clicks / totalClicks) * 100)
                        : 0;
                    const maxClicks = Math.max(
                      ...sortedReferersData.map((r) => r.clicks || 0),
                    );
                    const barWidth =
                      maxClicks > 0 ? (item.clicks / maxClicks) * 100 : 0;

                    return (
                      <a
                        key={idx}
                        href={
                          queryParams({
                            ...(searchParams.has("referer")
                              ? { del: "referer" }
                              : {
                                  set: {
                                    referer: (() => {
                                      // If this is a grouped referrer, use all domains from the group
                                      if (isGroupedReferrer(item.referer)) {
                                        return getDomainsForReferrerGroup(
                                          item.referer,
                                        ).join(",");
                                      }
                                      // Otherwise use the original referrer
                                      return item.referer;
                                    })(),
                                  },
                                }),
                            getNewPath: true,
                          }) as string
                        }
                        className="app-row group relative overflow-hidden px-3 py-1.5"
                      >
                        {/* minimal progress (subtle) */}
                        <div
                          className="pointer-events-none absolute inset-y-0 left-0 bg-neutral-100/60"
                          style={{ width: `${barWidth}%` }}
                        />

                        {idx < 3 && (
                          <div
                            className={`relative flex h-6 w-6 items-center justify-center rounded-md ${RANK_COLORS[idx]} flex-shrink-0 text-xs font-bold`}
                          >
                            {idx + 1}
                          </div>
                        )}
                        <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-neutral-100">
                          <RefererIcon
                            display={item.referer}
                            className="h-4 w-4"
                          />
                        </div>
                        <div className="relative min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-neutral-900">
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
                          totalClicks={totalClicks}
                          totalLeads={totalLeads}
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
                  className="app-btn-muted mt-4 w-full"
                >
                  View all {sortedReferersData?.length} traffic sources →
                </button>
              )}
            </div>
          )}
        </>
      )}
    </AnalyticsCard>
  );
}
