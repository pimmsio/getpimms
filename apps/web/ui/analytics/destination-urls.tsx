import { LinkLogo, Tooltip, useRouterStuff } from "@dub/ui";
import { cn, getApexDomain } from "@dub/utils";
import { ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { AnalyticsCard } from "./analytics-card";
import { AnalyticsEmptyState } from "./components/empty-states";
import { useAnalyticsState } from "./hooks";
import {
  LINK_LOGO_IMAGE_PROPS,
  LOGO_SIZE_CLASS_NAME,
  RANK_COLORS,
} from "./lib";
import { MetricsDisplay } from "./metrics-display";
import { useAnalyticsFilterOption } from "./utils";

export default function DestinationUrls({
  dragHandleProps,
}: {
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const { queryParams } = useRouterStuff();
  const { selectedTab } = useAnalyticsState();

  // Fetch top_urls data to display destination URL analytics
  // This is a primary analytics card that shows on every page load
  const { data: rawData } = useAnalyticsFilterOption({
    groupBy: "top_urls",
  });

  // Data is now grouped by base URL at the database level (query params stripped)
  // Format for display and sort by selected metric
  const groupedData = useMemo(() => {
    if (!rawData) return null;

    const formatted = rawData.map((item) => {
      const displayUrl = (item.url || "")
        .replace(/^https?:\/\//, "") // Remove protocol for display
        .replace(/\/$/, ""); // Remove trailing slash

      return {
        url: item.url || "", // Keep original with protocol for filtering
        displayUrl, // For display only
        clicks: item.clicks || 0,
        leads: item.leads || 0,
        sales: item.sales || 0,
        saleAmount: item.saleAmount || 0,
      };
    });

    // Sort by selected metric
    return formatted.sort((a, b) => {
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
    });
  }, [rawData, selectedTab]);

  const singularTabName = "url";

  const totalClicks = useMemo(
    () => groupedData?.reduce((sum, d) => sum + (d.clicks || 0), 0) || 0,
    [groupedData],
  );

  const totalLeads = useMemo(
    () => groupedData?.reduce((sum, d) => sum + (d.leads || 0), 0) || 0,
    [groupedData],
  );

  return (
    <AnalyticsCard
      tabs={[
        {
          id: "urls",
          label: "Destination URLs",
          icon: ExternalLink,
        },
      ]}
      selectedTabId="urls"
      onSelectTab={() => {}} // No tab switching
      expandLimit={5}
      hasMore={(groupedData?.length ?? 0) > 8}
      dragHandleProps={dragHandleProps}
    >
      {({ limit, setShowModal, isModal }) => (
        <>
          {groupedData ? (
            groupedData.length > 0 ? (
              <div className="flex flex-col px-4 py-3">
                <div className="space-y-2">
                  {groupedData
                    ?.slice(0, isModal ? undefined : limit)
                    .map((d, idx) => {
                      const domain = getApexDomain(d.url);
                      const maxClicks = Math.max(
                        ...(groupedData?.map((item) => item.clicks || 0) || [
                          0,
                        ]),
                      );
                      const barWidth =
                        maxClicks > 0 ? (d.clicks / maxClicks) * 100 : 0;

                      return (
                        <Tooltip
                          key={idx}
                          content={
                            <div className="max-w-xs p-2">
                              <p className="mb-1 text-xs font-semibold text-neutral-900">
                                Full URL:
                              </p>
                              <p className="break-all text-xs text-neutral-600">
                                {d.url}
                              </p>
                              <div className="mt-2 border-t border-neutral-100 pt-2">
                                <p className="text-xs text-neutral-500">
                                  Click to filter by this destination
                                </p>
                              </div>
                            </div>
                          }
                        >
                          <a
                            href={
                              queryParams({
                                set: { url: d.url },
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
                            <LinkLogo
                              apexDomain={domain}
                              className={cn(
                                "relative shrink-0 transition-[width,height]",
                                LOGO_SIZE_CLASS_NAME,
                              )}
                              imageProps={LINK_LOGO_IMAGE_PROPS}
                            />
                            <div className="relative min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-neutral-900">
                                {domain}
                              </p>
                              <p className="truncate text-xs text-neutral-500">
                                {d.displayUrl}
                              </p>
                            </div>
                            <MetricsDisplay
                              clicks={d.clicks || 0}
                              leads={d.leads}
                              sales={d.sales}
                              saleAmount={d.saleAmount}
                              totalClicks={totalClicks}
                              totalLeads={totalLeads}
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
                    className="app-btn-muted mt-4 w-full"
                  >
                    View all {groupedData?.length} destinations →
                  </button>
                )}
              </div>
            ) : (
              <AnalyticsEmptyState
                icon={ExternalLink}
                title="No destination data yet"
                description="Track which destination URLs get the most clicks"
              />
            )
          ) : (
            <div className="flex animate-pulse flex-col px-4 py-3">
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="app-row group relative overflow-hidden px-3 py-1.5"
                  >
                    {/* subtle bar background (mimics the real minimal progress) */}
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 bg-neutral-100"
                      style={{ width: `${Math.max(12, 78 - i * 12)}%` }}
                    />

                    {i < 3 ? (
                      <div
                        className={`relative flex h-6 w-6 items-center justify-center rounded-md ${RANK_COLORS[i]} flex-shrink-0`}
                      >
                        <div className="h-3 w-3 rounded bg-white/40" />
                      </div>
                    ) : null}

                    <div
                      className={cn(
                        "relative shrink-0 rounded-md bg-neutral-100",
                        LOGO_SIZE_CLASS_NAME,
                      )}
                    />

                    <div className="relative min-w-0 flex-1">
                      <div className="h-4 w-24 max-w-[70%] rounded bg-neutral-100" />
                      <div className="mt-1 h-3 w-56 max-w-full rounded bg-neutral-50" />
                    </div>

                    <div className="relative flex items-center gap-2.5">
                      <div className="h-4 w-10 rounded bg-neutral-100" />
                      <div className="h-3 w-1 rounded bg-neutral-50" />
                      <div className="h-4 w-10 rounded bg-neutral-100" />
                      <div className="h-3 w-1 rounded bg-neutral-50" />
                      <div className="h-4 w-14 rounded bg-neutral-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AnalyticsCard>
  );
}
