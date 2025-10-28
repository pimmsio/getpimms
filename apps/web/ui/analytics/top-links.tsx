import { Tooltip, useRouterStuff, LinkLogo } from "@dub/ui";
import { Hyperlink } from "@dub/ui/icons";
import { cn, getApexDomain } from "@dub/utils";
import { AnalyticsCard } from "./analytics-card";
import { MetricsDisplay } from "./metrics-display";
import { useSortedAnalytics, useAnalyticsState } from "./hooks";
import { RANK_COLORS, LOGO_SIZE_CLASS_NAME, LINK_LOGO_IMAGE_PROPS } from "./lib";

export default function TopLinks() {
  const { queryParams } = useRouterStuff();
  const { selectedTab } = useAnalyticsState();

  const { data: sortedData } = useSortedAnalytics("top_links");

  return (
    <AnalyticsCard
      tabs={[{ id: "links", label: "Top Links", icon: Hyperlink }]}
      expandLimit={5}
      hasMore={(sortedData?.length ?? 0) > 5}
      selectedTabId="links"
      onSelectTab={() => {}}
    >
      {({ limit, setShowModal, isModal }) =>
        sortedData ? (
          sortedData.length > 0 ? (
            <div className="flex flex-col px-4 py-3">
              <div className="space-y-2">
                {sortedData?.slice(0, isModal ? undefined : limit).map((d: any, idx: number) => {
                  const shortLink = `${d.domain}/${d.key === "_root" ? "" : d.key}`;
                  const domain = getApexDomain(d.url);
                  const maxClicks = Math.max(...(sortedData?.map((item: any) => item.clicks || 0) || [0]));
                  const barWidth = maxClicks > 0 ? (d.clicks / maxClicks) * 100 : 0;
                  
                  return (
                    <Tooltip
                      key={idx}
                      content={
                        <div className="max-w-xs p-2">
                          <p className="text-xs font-semibold text-neutral-900 mb-1">{shortLink}</p>
                          <p className="text-xs text-neutral-600 mb-2 break-all">{d.url}</p>
                          {d.updatedAt && (
                            <p className="text-xs text-neutral-500 mb-2">
                              Updated: {new Date(d.updatedAt).toLocaleDateString()}
                            </p>
                          )}
                          <div className="flex gap-3 text-xs pt-2 border-t border-neutral-200">
                            <span className="text-neutral-500">Clicks: <strong>{d.clicks}</strong></span>
                            {d.leads > 0 && <span className="text-neutral-500">Conversions: <strong>{d.leads}</strong></span>}
                            {d.sales > 0 && <span className="text-neutral-500">Sales: <strong>{d.sales}</strong></span>}
                          </div>
                        </div>
                      }
                    >
                      <a
                        href={queryParams({
                          set: { domain: d.domain, key: d.key || "_root" },
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
                            {shortLink}
                          </p>
                          {d.title && (
                            <p className="text-xs text-neutral-500 truncate">
                              {d.title}
                            </p>
                          )}
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
              
              {!isModal && (sortedData?.length ?? 0) > 5 && (
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 text-xs text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 font-medium transition-all"
                >
                  View all {sortedData?.length} links →
                </button>
              )}
            </div>
          ) : (
            <div className="flex h-[380px] flex-col items-center justify-center gap-3 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 ring-1 ring-neutral-200/50">
                <Hyperlink className="h-6 w-6 text-neutral-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">No links data yet</p>
                <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed max-w-xs">
                  Compare performance across all your short links
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
                  <div className="h-3 bg-neutral-100 rounded w-3/4" />
                  <div className="h-2 bg-neutral-50 rounded w-1/2" />
                </div>
                <div className="h-3 w-12 bg-neutral-100 rounded" />
              </div>
            ))}
          </div>
        )
      }
    </AnalyticsCard>
  );
}
