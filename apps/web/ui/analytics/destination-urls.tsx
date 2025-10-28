import { LinkLogo, Tooltip, useRouterStuff } from "@dub/ui";
import { ExternalLink } from "lucide-react";
import { cn, getApexDomain } from "@dub/utils";
import { useMemo } from "react";
import { AnalyticsCard } from "./analytics-card";
import { MetricsDisplay } from "./metrics-display";
import { useAnalyticsFilterOption } from "./utils";
import { useAnalyticsState } from "./hooks";
import { RANK_COLORS, LOGO_SIZE_CLASS_NAME, LINK_LOGO_IMAGE_PROPS } from "./lib";

export default function DestinationUrls() {
  const { queryParams } = useRouterStuff();
  const { selectedTab } = useAnalyticsState();

  const { data: rawData } = useAnalyticsFilterOption({
    groupBy: "top_urls",
  });

  // Data is now grouped by base URL at the database level (query params stripped)
  // Format for display and sort by selected metric
  const groupedData = useMemo(() => {
    if (!rawData) return null;
    
    const formatted = rawData.map((item) => {
      const displayUrl = (item.url || '')
        .replace(/^https?:\/\//, '')  // Remove protocol for display
        .replace(/\/$/, '');  // Remove trailing slash
      
      return {
        url: item.url || '',  // Keep original with protocol for filtering
        displayUrl,  // For display only
        clicks: item.clicks || 0,
        leads: item.leads || 0,
        sales: item.sales || 0,
        saleAmount: item.saleAmount || 0,
      };
    });

    // Sort by selected metric
    return formatted.sort((a, b) => {
      const aValue = selectedTab === "sales" ? (a.saleAmount || 0) : selectedTab === "leads" ? (a.leads || 0) : (a.clicks || 0);
      const bValue = selectedTab === "sales" ? (b.saleAmount || 0) : selectedTab === "leads" ? (b.leads || 0) : (b.clicks || 0);
      return bValue - aValue;
    });
  }, [rawData, selectedTab]);

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
      {({ limit, setShowModal, isModal }) => (
        <>
          {groupedData ? (
            groupedData.length > 0 ? (
              <div className="flex flex-col px-4 py-3">
                <div className="space-y-2">
                  {groupedData?.slice(0, isModal ? undefined : limit).map((d, idx) => {
                    const domain = getApexDomain(d.url);
                    const maxClicks = Math.max(...(groupedData?.map((item) => item.clicks || 0) || [0]));
                    const barWidth = maxClicks > 0 ? (d.clicks / maxClicks) * 100 : 0;
                    
                    return (
                      <Tooltip
                        key={idx}
                        content={
                          <div className="max-w-xs p-2">
                            <p className="text-xs font-semibold text-neutral-900 mb-1">Full URL:</p>
                            <p className="text-xs text-neutral-600 break-all">{d.url}</p>
                            <div className="mt-2 pt-2 border-t border-neutral-200">
                              <p className="text-xs text-neutral-500">Click to filter by this destination</p>
                            </div>
                          </div>
                        }
                      >
                        <a
                          href={queryParams({
                            set: { url: d.url },
                            getNewPath: true,
                          }) as string}
                          className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-neutral-50 transition-all group border border-transparent hover:border-neutral-200 overflow-hidden"
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
                          <LinkLogo
                            apexDomain={domain}
                            className={cn(
                              "relative shrink-0 transition-[width,height]",
                              LOGO_SIZE_CLASS_NAME,
                            )}
                            imageProps={LINK_LOGO_IMAGE_PROPS}
                          />
                          <div className="relative flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {domain}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">
                              {d.displayUrl}
                            </p>
                          </div>
                          <MetricsDisplay
                            clicks={d.clicks || 0}
                            leads={d.leads}
                            sales={d.sales}
                            saleAmount={d.saleAmount}
                            primaryMetric={selectedTab}
                            className="relative"
                          />
                        </a>
                      </Tooltip>
                    );
                  })}
                </div>
              
              {!isModal && (groupedData?.length ?? 0) > 8 && (
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 text-xs text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 font-medium transition-all"
                >
                  View all {groupedData?.length} destinations →
                </button>
              )}
              </div>
            ) : (
              <div className="flex h-[380px] flex-col items-center justify-center gap-3 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 ring-1 ring-neutral-200/50">
                  <ExternalLink className="h-6 w-6 text-neutral-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">No destination data yet</p>
                  <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed max-w-xs">
                    Track which destination URLs get the most clicks
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col px-4 py-3 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 mb-2">
                  <div className="h-8 w-8 rounded-full bg-neutral-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-neutral-100 rounded w-2/3" />
                    <div className="h-2 bg-neutral-50 rounded w-full" />
                  </div>
                  <div className="h-3 w-12 bg-neutral-100 rounded" />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AnalyticsCard>
  );
}
