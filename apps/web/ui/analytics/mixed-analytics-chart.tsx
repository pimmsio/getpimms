import { formatDateTooltip } from "@/lib/analytics/format-date-tooltip";
import { editQueryString } from "@/lib/analytics/utils";

import { groupTimeseriesData } from "@/lib/analytics/utils/group-timeseries-data";
import { TimeSeriesChart, XAxis, YAxis } from "@dub/ui/charts";
import { fetcher, nFormatter } from "@dub/utils";
import { useContext, useMemo } from "react";
import useSWR from "swr";
import { AnalyticsLoadingSpinner } from "./analytics-loading-spinner";
import { AnalyticsContext } from "./analytics-provider";
import { MixedAreasAndBars } from "./mixed-areas-bars";

export default function MixedAnalyticsChart({
  demo: demoFromProps,
}: {
  demo?: boolean;
}) {
  const {
    baseApiPath,
    queryString,
    start,
    end,
    interval,
    requiresUpgrade,
    workspace,
  } = useContext(AnalyticsContext);
  const { createdAt } = workspace || {};

  const { data } = useSWR<
    {
      start: Date;
      clicks: number;
      leads: number;
      sales: number;
      saleAmount: number;
    }[]
  >(
    !demoFromProps &&
      `${baseApiPath}?${editQueryString(queryString, {
        groupBy: "timeseries",
        event: "composite",
      })}`,
    fetcher,
    {
      shouldRetryOnError: !requiresUpgrade,
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  const chartData = useMemo(() => {
    if (!data) return null;

    // Create a map to merge data from all three endpoints
    const dataMap = new Map();

    // Add clicks data
    data.forEach(({ start, clicks, leads, sales, saleAmount }) => {
      const dateKey = start.toString();
      dataMap.set(dateKey, {
        date: new Date(start),
        values: {
          clicks: clicks || 0,
          leads: leads || 0,
          sales: sales || 0,
          saleAmount: (saleAmount ?? 0) / 100,
        },
      });
    });

    // Merge leads data
    data?.forEach(({ start, leads }) => {
      const dateKey = start.toString();
      const existing = dataMap.get(dateKey);
      if (existing) {
        existing.values.leads = leads || 0;
      }
    });

    // Merge sales data
    data?.forEach(({ start, sales, saleAmount }) => {
      const dateKey = start.toString();
      const existing = dataMap.get(dateKey);
      if (existing) {
        existing.values.sales = sales || 0;
        existing.values.saleAmount = (saleAmount ?? 0) / 100;
      }
    });

    const mergedData = Array.from(dataMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    // Apply grouping for weekly/biweekly intervals
    if (interval === "90d" || interval === "qtd") {
      return groupTimeseriesData(mergedData, "week");
    } else if (interval === "6m" || interval === "all") {
      return groupTimeseriesData(mergedData, "biweekly");
    }

    return mergedData;
  }, [data, interval]);

  // Mixed series: clicks as line, leads and sales as absolute values for bars
  const series = [
    {
      id: "clicks",
      valueAccessor: (d) => d.values.clicks,
      isActive: true,
      colorClassName: "text-[#3870FF]",
      type: "line" as const,
      showHoverCircle: true, // Show hover circle for line
    },
    {
      id: "leads",
      valueAccessor: (d) => d.values.leads,
      isActive: true,
      colorClassName: "text-[#FFD399]",
      type: "bar" as const,
      showHoverCircle: false, // Hide hover circle for bars
      excludeFromYScale: true, // Exclude from Y-scale to not affect line chart scaling
    },
    {
      id: "sales",
      valueAccessor: (d) => d.values.saleAmount, // Use revenue amount, not sales count
      isActive: true,
      colorClassName: "text-[#00F5B8]",
      type: "bar" as const,
      showHoverCircle: false, // Hide hover circle for bars
      excludeFromYScale: true, // Exclude from Y-scale to not affect line chart scaling
    },
  ];

  const additionalMetrics = useMemo(() => {
    const clicks = data?.map((d) => d.clicks).reduce((a, b) => a + b, 0) ?? 0;
    const leads = data?.map((d) => d.leads).reduce((a, b) => a + b, 0) ?? 0;
    const sales = data?.map((d) => d.sales).reduce((a, b) => a + b, 0) ?? 0;
    const saleAmountInCents =
      data?.map((d) => d.saleAmount).reduce((a, b) => a + b, 0) ?? 0;
    const saleAmount = saleAmountInCents / 100;

    const revenuePerClick = clicks > 0 ? saleAmount / clicks : 0;
    const clickToLeadRate = clicks > 0 ? (leads / clicks) * 100 : 0;
    const leadToSaleRate = leads > 0 ? (sales / leads) * 100 : 0;
    const avgOrderValue = sales > 0 ? saleAmount / sales : 0;

    // Calculate recent visitors and determine if we should show the metric
    let recentVisitors = 0;
    let showRecentVisitors = false;

    if (data && data.length > 1) {
      // Check if this is 24h data with hourly granularity
      const latestDataPoint = data[data.length - 1];
      const secondLatest = data[data.length - 2];
      const timeDiff =
        new Date(latestDataPoint.start).getTime() -
        new Date(secondLatest.start).getTime();

      // Only show recent visitors for hourly data (24h interval)
      if (timeDiff <= 2 * 60 * 60 * 1000) {
        // 2 hours or less - hourly data
        showRecentVisitors = true;
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Sum clicks from data points within the last hour
        recentVisitors = data
          .filter((dataPoint) => {
            const pointDate = new Date(dataPoint.start);
            return pointDate >= oneHourAgo;
          })
          .reduce((total, dataPoint) => total + dataPoint.clicks, 0);
      }
      // For all other intervals (daily, weekly, etc.), don't show the metric at all
    }

    return {
      clicks,
      leads,
      sales,
      saleAmount,
      revenuePerClick,
      clickToLeadRate,
      leadToSaleRate,
      avgOrderValue,
      recentVisitors,
      showRecentVisitors,
    };
  }, [data]);

  return (
    <>
      {data ? (
        <div className="m-2 grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 xl:flex xl:grid-cols-8 xl:gap-2 xl:overflow-x-auto">
          <div className="group rounded border border-[#C2D4FF] bg-gradient-to-br from-[#EBF1FF] to-[#EFF1FF] p-1.5 transition-all duration-200 hover:border-[#C2D4FF] sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-[#00237A]">
              <div className="h-1.5 w-1.5 rounded-full bg-[#3870FF]"></div>
              <span>Clicks</span>
            </div>
            <div className="mt-1 text-sm font-semibold text-[#00237A] sm:text-base lg:text-lg">
              {additionalMetrics.clicks > 999
                ? (additionalMetrics.clicks / 1000).toFixed(1) + "k"
                : additionalMetrics.clicks.toString()}
            </div>
          </div>

          <div className="group rounded border border-[#FFB85C] bg-gradient-to-br from-[#FFF6EB] to-[#FFF3EB] p-1.5 transition-all duration-200 hover:border-[#FFB85C] sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-[#522E00]">
              <div className="h-1.5 w-1.5 rounded-full bg-[#FFD399]"></div>
              <span>Leads</span>
            </div>
            <div className="mt-1 text-sm font-semibold text-[#522E00] sm:text-base lg:text-lg">
              {additionalMetrics.leads || "0"}
            </div>
          </div>

          <div className="group rounded border border-[#47FFD1] bg-gradient-to-br from-[#EBFFFA] to-[#EBFFFA] p-1.5 transition-all duration-200 hover:border-[#47FFD1] sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-[#002e25]">
              <div className="h-1.5 w-1.5 rounded-full bg-[#00F5B8]"></div>
              <span>Sales</span>
            </div>
            <div className="mt-1 text-sm font-semibold text-[#002e25] sm:text-base lg:text-lg">
              {additionalMetrics.saleAmount > 999
                ? (additionalMetrics.saleAmount / 1000).toFixed(1) + "k"
                : additionalMetrics.saleAmount.toFixed(0)}
              €
            </div>
          </div>

          {/* Only show recent visitors for 24h hourly data */}
          {additionalMetrics.showRecentVisitors && (
            <div className="group rounded border border-gray-200/50 bg-gradient-to-br from-slate-50/70 to-gray-100/40 p-1.5 transition-all duration-200 hover:border-gray-300/60 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400"></div>
                <span>Recent visits</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900 sm:text-base lg:text-lg">
                {additionalMetrics.recentVisitors}
              </div>
            </div>
          )}

          <div className="group rounded border border-gray-200/50 bg-gradient-to-br from-slate-50/70 to-gray-100/40 p-1.5 transition-all duration-200 hover:border-gray-300/60 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="text-xs text-gray-600">Revenue/click</div>
            <div className="mt-1 text-sm font-semibold text-gray-900 sm:text-base lg:text-lg">
              ${(additionalMetrics.revenuePerClick || 0).toFixed(1)}
            </div>
          </div>

          <div className="group rounded border border-gray-200/50 bg-gradient-to-br from-slate-50/70 to-gray-100/40 p-1.5 transition-all duration-200 hover:border-gray-300/60 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="text-xs text-gray-600">Click → Lead</div>
            <div className="mt-1 text-sm font-semibold text-gray-900 sm:text-base lg:text-lg">
              {Math.round(additionalMetrics.clickToLeadRate || 0)}%
            </div>
          </div>

          <div className="group rounded border border-gray-200/50 bg-gradient-to-br from-slate-50/70 to-gray-100/40 p-1.5 transition-all duration-200 hover:border-gray-300/60 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="text-xs text-gray-600">Lead → Sale</div>
            <div className="mt-1 text-sm font-semibold text-gray-900 sm:text-base lg:text-lg">
              {Math.round(additionalMetrics.leadToSaleRate || 0)}%
            </div>
          </div>

          <div className="group rounded border border-gray-200/50 bg-gradient-to-br from-slate-50/70 to-gray-100/40 p-1.5 transition-all duration-200 hover:border-gray-300/60 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="text-xs text-gray-600">Avg order</div>
            <div className="mt-1 text-sm font-semibold text-gray-900 sm:text-base lg:text-lg">
              {Math.round(additionalMetrics.avgOrderValue || 0)}€
            </div>
          </div>
        </div>
      ) : (
        <div className="m-2 grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 xl:flex xl:grid-cols-8 xl:gap-2 xl:overflow-x-auto">
          {/* Clicks skeleton */}
          <div className="group rounded border border-[#C2D4FF]/30 bg-gradient-to-br from-[#EBF1FF] to-[#EFF1FF] p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-[#00237A]">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3870FF]/50"></div>
              <div className="h-3 w-8 animate-pulse rounded bg-[#3870FF]/50"></div>
            </div>
            <div className="mt-1 h-5 w-6 animate-pulse rounded bg-[#3870FF]/50 sm:h-6 lg:h-7"></div>
          </div>

          {/* Conversions skeleton */}
          <div className="group rounded border border-[#FFB85C]/30 bg-gradient-to-br from-[#FFF6EB] to-[#FFF3EB] p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-[#522E00]">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FFD399]/70"></div>
              <div className="h-3 w-6 animate-pulse rounded bg-[#FFD399]/70"></div>
            </div>
            <div className="mt-1 h-5 w-4 animate-pulse rounded bg-[#FFD399]/70 sm:h-6 lg:h-7"></div>
          </div>

          {/* Revenue skeleton */}
          <div className="group rounded border border-[#47FFD1]/30 bg-gradient-to-br from-[#EBFFFA] to-[#EBFFFA] p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-[#002e25]">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00F5B8]/70"></div>
              <div className="h-3 w-6 animate-pulse rounded bg-[#00F5B8]/70"></div>
            </div>
            <div className="mt-1 h-5 w-6 animate-pulse rounded bg-[#00F5B8]/70 sm:h-6 lg:h-7"></div>
          </div>

          {/* Recent visitors skeleton */}
          <div className="group rounded border border-gray-200/50 bg-gray-50 p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-300"></div>
              <div className="h-3 w-8 animate-pulse rounded bg-gray-300"></div>
            </div>
            <div className="mt-1 h-5 w-3 animate-pulse rounded bg-gray-400 sm:h-6 lg:h-7"></div>
          </div>

          {/* Revenue/click skeleton */}
          <div className="group rounded border border-gray-200/50 bg-gray-50 p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="text-xs text-gray-600">
              <div className="h-3 w-10 animate-pulse rounded bg-gray-300"></div>
            </div>
            <div className="mt-1 h-5 w-8 animate-pulse rounded bg-gray-400 sm:h-6 lg:h-7"></div>
          </div>

          {/* Click → Lead rate skeleton */}
          <div className="group rounded border border-gray-200/50 bg-gray-50 p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="text-xs text-gray-600">
              <div className="h-3 w-8 animate-pulse rounded bg-gray-300"></div>
            </div>
            <div className="mt-1 h-5 w-6 animate-pulse rounded bg-gray-400 sm:h-6 lg:h-7"></div>
          </div>

          {/* Lead → Sale rate skeleton */}
          <div className="group rounded border border-gray-200/50 bg-gray-50 p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="text-xs text-gray-600">
              <div className="h-3 w-8 animate-pulse rounded bg-gray-300"></div>
            </div>
            <div className="mt-1 h-5 w-6 animate-pulse rounded bg-gray-400 sm:h-6 lg:h-7"></div>
          </div>

          {/* Avg order value skeleton */}
          <div className="group rounded border border-gray-200/50 bg-gray-50 p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="text-xs text-gray-600">
              <div className="h-3 w-10 animate-pulse rounded bg-gray-300"></div>
            </div>
            <div className="mt-1 h-5 w-8 animate-pulse rounded bg-gray-400 sm:h-6 lg:h-7"></div>
          </div>
        </div>
      )}
      <div className="relative flex h-64 w-full items-center justify-center sm:h-80 lg:h-96">
        {chartData ? (
          <TimeSeriesChart
            key={queryString}
            data={chartData}
            series={series}
            tooltipClassName="p-0"
            tooltipContent={(d) => {
              const clicks = d.values.clicks;
              const leads = d.values.leads;
              const salesCount = d.values.sales;
              const revenue = d.values.saleAmount || 0;
              const conversionRate = clicks > 0 ? (leads / clicks) * 100 : 0;
              const salesRate = leads > 0 ? (salesCount / leads) * 100 : 0;

              return (
                <div
                  className="min-w-[180px] rounded border-0 bg-white px-3 py-2.5 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="mb-2 text-sm font-medium text-neutral-900">
                    {formatDateTooltip(d.date, {
                      interval,
                      start,
                      end,
                      dataAvailableFrom: createdAt,
                    })}
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#3870FF]"></div>
                        <span className="text-xs text-neutral-600">Clicks</span>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">
                        {nFormatter(clicks, { full: true })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-orange-300"></div>
                        <span className="text-xs text-neutral-600">Leads</span>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">
                        {leads}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#00F5B8]"></div>
                        <span className="text-xs text-neutral-600">
                          Revenue
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">
                        ${Math.round(revenue)}
                      </span>
                    </div>

                    <div className="mt-1.5 border-t border-neutral-100/80 pt-1.5">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs text-neutral-600">
                          Sales count
                        </span>
                        <span className="text-xs font-medium text-neutral-700">
                          {salesCount}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500">
                            Click → Lead rate
                          </span>
                          <span className="font-medium text-neutral-700">
                            {Math.round(conversionRate)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500">
                            Lead → Sale rate
                          </span>
                          <span className="font-medium text-neutral-700">
                            {Math.round(salesRate)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
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
