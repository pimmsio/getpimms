import { formatDateTooltip } from "@/lib/analytics/format-date-tooltip";
import useWorkspace from "@/lib/swr/use-workspace";
import { InfoTooltip, useRouterStuff } from "@dub/ui";
import { TimeSeriesChart, XAxis, YAxis } from "@dub/ui/charts";
import { nFormatter } from "@dub/utils";
import { useMemo } from "react";
import { AnalyticsLoadingSpinner } from "./analytics-loading-spinner";
import { MixedAreasAndBars } from "./mixed-areas-bars";
import {
  UnifiedAnalyticsTooltip,
  createBaseMetrics,
  createKeyMetrics,
  type TooltipSection,
} from "./unified-analytics-tooltip";
import { useTimeseriesData, useAnalyticsState, useAnalyticsWorkspace } from "./hooks";
import { aggregateMetrics, calculateDerivedMetrics } from "./lib";
import { useAnalyticsFilterOption } from "./utils";
import useSWR from "swr";
import { fetcher } from "@dub/utils";

export default function MixedAnalyticsChart({
  demo: demoFromProps,
}: {
  demo?: boolean;
}) {
  const { start, end, interval } = useAnalyticsState();
  const { workspace } = useAnalyticsWorkspace();

  const { searchParams } = useRouterStuff();
  const { slug } = useWorkspace();
  const { createdAt } = workspace || {};

  // Create the hot leads URL without causing re-renders
  const hotLeadsUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('hotScore', 'warm,hot');
    return `/${slug}/conversions?${params.toString()}`;
  }, [slug, searchParams]);

  // Use the new timeseries hook - handles fetching, formatting, and grouping
  const { data: chartData, rawData } = useTimeseriesData({ demo: demoFromProps });

  // Clicks saved = Mobile + Tablet clicks (based on device breakdown)
  const { data: devicesData } = useAnalyticsFilterOption("devices");
  const clicksSaved = useMemo(() => {
    return (
      devicesData?.reduce((sum, d: any) => {
        const device = d.device;
        if (device === "Mobile" || device === "Tablet") return sum + (d.clicks || 0);
        return sum;
      }, 0) ?? 0
    );
  }, [devicesData]);


  // Mixed series: clicks as line, leads and sales as absolute values for bars
  const series = [
    {
      id: "clicks",
      valueAccessor: (d) => d.values.clicks,
      isActive: true,
      colorClassName: "text-data-clicks",
      type: "line" as const,
      showHoverCircle: true, // Show hover circle for line
    },
    {
      id: "leads",
      valueAccessor: (d) => d.values.leads,
      isActive: true,
      colorClassName: "text-data-leads",
      type: "bar" as const,
      showHoverCircle: false, // Hide hover circle for bars
      excludeFromYScale: true, // Exclude from Y-scale to not affect line chart scaling
    },
    {
      id: "sales",
      valueAccessor: (d) => d.values.saleAmount, // Use revenue amount, not sales count
      isActive: true,
      colorClassName: "text-data-sales",
      type: "bar" as const,
      showHoverCircle: false, // Hide hover circle for bars
      excludeFromYScale: true, // Exclude from Y-scale to not affect line chart scaling
    },
  ];

  const additionalMetrics = useMemo(() => {
    if (!rawData) {
      return {
        clicks: 0,
        leads: 0,
        sales: 0,
        saleAmount: 0,
        revenuePerClick: 0,
        clickToLeadRate: 0,
        leadToSaleRate: 0,
        avgOrderValue: 0,
        recentVisitors: 0,
        showRecentVisitors: false,
      };
    }

    // Aggregate metrics using utility
    const aggregated = aggregateMetrics(rawData);
    const saleAmount = aggregated.saleAmount / 100;

    // Calculate derived metrics using utility
    const derived = calculateDerivedMetrics({
      ...aggregated,
      saleAmount,
    });

    // Calculate recent visitors and determine if we should show the metric
    let recentVisitors = 0;
    let showRecentVisitors = false;

    if (rawData.length > 1) {
      // Check if this is 24h data with hourly granularity
      const latestDataPoint = rawData[rawData.length - 1];
      const secondLatest = rawData[rawData.length - 2];
      const timeDiff =
        new Date(latestDataPoint.start).getTime() -
        new Date(secondLatest.start).getTime();

      // Only show recent visitors for hourly data (24h interval)
      if (timeDiff <= 2 * 60 * 60 * 1000) {
        showRecentVisitors = true;
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        recentVisitors = rawData
          .filter((dataPoint) => {
            const pointDate = new Date(dataPoint.start);
            return pointDate >= oneHourAgo;
          })
          .reduce((total, dataPoint) => total + dataPoint.clicks, 0);
      }
    }

    return {
      ...aggregated,
      saleAmount,
      ...derived,
      recentVisitors,
      showRecentVisitors,
    };
  }, [rawData]);

  return (
    <>
      {chartData ? (
        <div className="mx-4 mb-4 mt-4 grid grid-cols-3 gap-1 sm:grid-cols-4 sm:gap-2 xl:flex xl:grid-cols-8 xl:gap-2 xl:overflow-x-auto">
          {/* Clicks saved (deeplink) */}
          {clicksSaved > 0 ? (
            <div className="rounded-lg border border-gray-200/50 bg-gray-50 px-2 py-2 sm:rounded-xl sm:px-4 sm:py-3 lg:min-w-[90px] lg:flex-shrink-0">
              <div className="mb-1 flex items-center gap-1 text-xs text-neutral-600 sm:mb-2 sm:gap-1.5 sm:text-sm">
                <span>Clicks saved</span>
                <InfoTooltip content="Mobile + tablet clicks." />
              </div>
              <div className="text-sm font-bold text-gray-800 sm:text-xl">
                {clicksSaved > 999
                  ? (clicksSaved / 1000).toFixed(1) + "k"
                  : clicksSaved.toLocaleString()}
              </div>
            </div>
          ) : null}


          {/* Clicks Card - Always show */}
          <div className="bg-brand-primary-light border-brand-primary/10 rounded-lg border px-2 py-2 sm:rounded-xl sm:px-4 sm:py-3 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="mb-1 flex items-center gap-1 text-xs text-neutral-600 sm:mb-2 sm:gap-2 sm:text-sm">
              <div className="bg-brand-primary h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2"></div>
              <span>Clics</span>
            </div>
            <div className="text-sm font-bold text-gray-800 sm:text-xl">
              {additionalMetrics.clicks > 999
                ? (additionalMetrics.clicks / 1000).toFixed(1) + "k"
                : additionalMetrics.clicks.toLocaleString()}
            </div>
          </div>

          {/* Leads Card - Only show if > 0 */}
          {additionalMetrics.leads > 0 && (
            <div className="bg-data-leads/15 border-data-leads/20 rounded-lg border px-2 py-2 sm:rounded-xl sm:px-4 sm:py-3 lg:min-w-[90px] lg:flex-shrink-0">
              <div className="mb-1 flex items-center gap-1 text-xs text-neutral-600 sm:mb-2 sm:gap-2 sm:text-sm">
                <div className="bg-data-leads h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2"></div>
                <span>Leads</span>
              </div>
              <div className="text-sm font-bold text-gray-800 sm:text-xl">
                {additionalMetrics.leads > 999
                  ? (additionalMetrics.leads / 1000).toFixed(1) + "k"
                  : additionalMetrics.leads.toLocaleString()}
              </div>
            </div>
          )}

          {/* Sales Card - Only show if > 0 */}
          {additionalMetrics.saleAmount > 0 && (
            <div className="bg-data-sales/15 border-data-sales/20 rounded-lg border px-2 py-2 sm:rounded-xl sm:px-4 sm:py-3 lg:min-w-[90px] lg:flex-shrink-0">
              <div className="mb-1 flex items-center gap-1 text-xs text-neutral-600 sm:mb-2 sm:gap-2 sm:text-sm">
                <div className="bg-data-sales h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2"></div>
                <span>Ventes</span>
              </div>
              <div className="text-sm font-bold text-gray-800 sm:text-xl">
                €
                {additionalMetrics.saleAmount > 999
                  ? (additionalMetrics.saleAmount / 1000).toFixed(1) + "k"
                  : additionalMetrics.saleAmount.toLocaleString()}
              </div>
            </div>
          )}

          {/* Only show recent visitors for 24h hourly data */}
          {additionalMetrics.showRecentVisitors && additionalMetrics.recentVisitors > 0 && (
            <div className="rounded-lg border border-gray-200/50 bg-gray-50 px-2 py-2 sm:rounded-xl sm:px-4 sm:py-3 lg:min-w-[90px] lg:flex-shrink-0">
              <div className="mb-1 flex items-center gap-1 text-xs text-neutral-600 sm:mb-2 sm:gap-2 sm:text-sm">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400 sm:h-2 sm:w-2"></div>
                <span>Recent</span>
                <InfoTooltip content="Visitors in the last 2 hours." />
              </div>
              <div className="text-sm font-bold text-gray-800 sm:text-xl">
                {additionalMetrics.recentVisitors}
              </div>
            </div>
          )}

          {/* RPC - Only show if > 0 */}
          {additionalMetrics.revenuePerClick > 0 && (
            <div className="rounded-lg border border-gray-200/50 bg-gray-50 px-2 py-2 sm:rounded-xl sm:px-4 sm:py-3 lg:min-w-[90px] lg:flex-shrink-0">
              <div className="mb-1 flex items-center gap-1 text-xs text-neutral-600 sm:mb-2 sm:gap-1.5 sm:text-sm">
                <span>RPC</span>
                <InfoTooltip content="Revenue Per Click - Average revenue generated per click on your links" />
              </div>
              <div className="text-sm font-bold text-gray-800 sm:text-xl">
                ${(additionalMetrics.revenuePerClick || 0).toFixed(1)}
              </div>
            </div>
          )}

          {/* CVR - Only show if > 0 */}
          {additionalMetrics.clickToLeadRate > 0 && (
            <div className="rounded-lg border border-gray-200/50 bg-gray-50 px-2 py-2 sm:rounded-xl sm:px-4 sm:py-3 lg:min-w-[90px] lg:flex-shrink-0">
              <div className="mb-1 flex items-center gap-1 text-xs text-neutral-600 sm:mb-2 sm:gap-1.5 sm:text-sm">
                <span>CVR</span>
                <InfoTooltip content="Conversion Rate - Percentage of visitors who become qualified leads" />
              </div>
              <div className="text-sm font-bold text-gray-800 sm:text-xl">
                {Math.round(additionalMetrics.clickToLeadRate || 0)}%
              </div>
            </div>
          )}

          {/* Close Rate - Only show if > 0 */}
          {additionalMetrics.leadToSaleRate > 0 && (
            <div className="rounded-lg border border-gray-200/50 bg-gray-50 px-2 py-2 sm:rounded-xl sm:px-4 sm:py-3 lg:min-w-[90px] lg:flex-shrink-0">
              <div className="mb-1 flex items-center gap-1 text-xs text-neutral-600 sm:mb-2 sm:gap-1.5 sm:text-sm">
                <span>Close Rate</span>
                <InfoTooltip content="Close Rate - Percentage of leads that convert to sales" />
              </div>
              <div className="text-sm font-bold text-gray-800 sm:text-xl">
                {Math.round(additionalMetrics.leadToSaleRate || 0)}%
              </div>
            </div>
          )}

          {/* AOV - Only show if > 0 */}
          {additionalMetrics.avgOrderValue > 0 && (
            <div className="rounded-lg border border-gray-200/50 bg-gray-50 px-2 py-2 sm:rounded-xl sm:px-4 sm:py-3 lg:min-w-[90px] lg:flex-shrink-0">
              <div className="mb-1 flex items-center gap-1 text-xs text-neutral-600 sm:mb-2 sm:gap-1.5 sm:text-sm">
                <span>AOV</span>
                <InfoTooltip content="Average Order Value - Average value of each order generated" />
              </div>
              <div className="text-sm font-bold text-gray-800 sm:text-xl">
                {Math.round(additionalMetrics.avgOrderValue || 0)}€
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mx-4 mb-4 mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2 xl:flex xl:grid-cols-8 xl:gap-2 xl:overflow-x-auto">
          {/* Clicks skeleton */}
          <div className="bg-brand-primary-light border-brand-primary/10 animate-pulse rounded-xl border px-4 py-3 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="mb-2 flex items-center gap-2 text-sm text-neutral-600">
              <div className="bg-brand-primary/50 h-2 w-2 rounded-full"></div>
              <div className="h-3 w-8 rounded bg-neutral-300/50"></div>
            </div>
            <div className="h-6 w-12 rounded bg-neutral-300/50"></div>
          </div>

          {/* Leads skeleton */}
          <div className="bg-data-leads/15 border-data-leads/20 animate-pulse rounded-xl border px-4 py-3 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="mb-2 flex items-center gap-2 text-sm text-neutral-600">
              <div className="bg-data-leads/50 h-2 w-2 rounded-full"></div>
              <div className="h-3 w-8 rounded bg-neutral-300/50"></div>
            </div>
            <div className="h-6 w-8 rounded bg-neutral-300/50"></div>
          </div>

          {/* Sales skeleton */}
          <div className="bg-data-sales/15 border-data-sales/20 animate-pulse rounded-xl border px-4 py-3 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="mb-2 flex items-center gap-2 text-sm text-neutral-600">
              <div className="bg-data-sales/50 h-2 w-2 rounded-full"></div>
              <div className="h-3 w-8 rounded bg-neutral-300/50"></div>
            </div>
            <div className="h-6 w-12 rounded bg-neutral-300/50"></div>
          </div>

          {/* Additional metrics skeletons */}
          <div className="animate-pulse rounded-xl border border-gray-200/50 bg-gray-50 px-4 py-3 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="mb-2 h-3 w-12 rounded bg-neutral-300/50"></div>
            <div className="h-6 w-8 rounded bg-neutral-300/50"></div>
          </div>

          <div className="animate-pulse rounded-xl border border-gray-200/50 bg-gray-50 px-4 py-3 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="mb-2 h-3 w-14 rounded bg-neutral-300/50"></div>
            <div className="h-6 w-6 rounded bg-neutral-300/50"></div>
          </div>

          <div className="animate-pulse rounded-xl border border-gray-200/50 bg-gray-50 px-4 py-3 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="mb-2 h-3 w-16 rounded bg-neutral-300/50"></div>
            <div className="h-6 w-6 rounded bg-neutral-300/50"></div>
          </div>

          <div className="animate-pulse rounded-xl border border-gray-200/50 bg-gray-50 px-4 py-3 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="mb-2 h-3 w-10 rounded bg-neutral-300/50"></div>
            <div className="h-6 w-6 rounded bg-neutral-300/50"></div>
          </div>
        </div>
      )}
      <div className="relative flex h-64 w-full items-center justify-center sm:h-80 lg:h-96">
        {chartData ? (
          <TimeSeriesChart
            key={interval}
            data={chartData}
            series={series}
            tooltipClassName="p-0"
            tooltipContent={(d) => {
              const clicks = d.values.clicks;
              const leads = d.values.leads;
              const salesCount = d.values.sales;
              const revenue = d.values.saleAmount || 0;

              const sections: TooltipSection[] = [
                {
                  type: "header",
                  title: formatDateTooltip(d.date, {
                    interval,
                    start,
                    end,
                    dataAvailableFrom: createdAt,
                  }),
                },
                createBaseMetrics({
                  clicks,
                  leads,
                  sales: salesCount,
                  saleAmount: revenue * 100,
                }),
                createKeyMetrics({
                  clicks,
                  leads,
                  sales: salesCount,
                  saleAmount: revenue * 100,
                }),
              ];

              return (
                <div className="min-w-[180px]">
                  <UnifiedAnalyticsTooltip
                    sections={sections}
                    position={{ x: 0, y: 0 }} // Not used when disablePositioning is true
                    disablePositioning={true} // Let chart library handle positioning
                  />
                </div>
              );
            }}
          >
            <MixedAreasAndBars />
            <XAxis
              tickFormat={(d) =>
                formatDateTooltip(d, {
                  interval,
                  start,
                  end,
                  dataAvailableFrom: createdAt,
                })
              }
            />
            <YAxis showGridLines tickFormat={nFormatter} />
          </TimeSeriesChart>
        ) : (
          <AnalyticsLoadingSpinner />
        )}
      </div>
    </>
  );
}
