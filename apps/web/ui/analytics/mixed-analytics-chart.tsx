import { formatDateTooltip } from "@/lib/analytics/format-date-tooltip";
import { editQueryString } from "@/lib/analytics/utils";

import { groupTimeseriesData } from "@/lib/analytics/utils/group-timeseries-data";
import { InfoTooltip } from "@dub/ui";
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

  // Fetch hot/cold lead counts
  // const { data: leadCounts } = useSWR<{
  //   hotLeadCount: number;
  //   coldLeadCount: number;
  //   totalLeadCount: number;
  // }>(
  //   !demoFromProps &&
  //     `${baseApiPath}/leads/counts?${editQueryString(queryString, {})}`,
  //   fetcher,
  //   {
  //     shouldRetryOnError: !requiresUpgrade,
  //     dedupingInterval: 60000,
  //     revalidateOnFocus: false,
  //     keepPreviousData: true,
  //   },
  // );

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
        <div className="mx-4 mt-4 mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2 xl:flex xl:grid-cols-8 xl:gap-2 xl:overflow-x-auto">
          {/* Clicks Card */}
          <div className="rounded-xl bg-brand-primary-light py-3 px-4 border border-brand-primary/10 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
              <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
              <span>Clics</span>
            </div>
            <div className="text-xl font-bold text-gray-800">
              {additionalMetrics.clicks > 999
                ? (additionalMetrics.clicks / 1000).toFixed(1) + "k"
                : additionalMetrics.clicks.toLocaleString()}
            </div>
          </div>

          {/* Leads Card */}
          <div className="rounded-xl bg-data-leads/15 py-3 px-4 border border-data-leads/20 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
              <div className="w-2 h-2 bg-data-leads rounded-full"></div>
              <span>Leads</span>
            </div>
            <div className="text-xl font-bold text-gray-800">
              {additionalMetrics.leads > 999
                ? (additionalMetrics.leads / 1000).toFixed(1) + "k"
                : additionalMetrics.leads.toLocaleString()}
            </div>
          </div>

          {/* Hot Leads */}
          {/* <div className="group rounded border border-[#FF6B6B] bg-gradient-to-br from-[#FFF0F0] to-[#FFEBEB] p-1.5 transition-all duration-200 hover:border-[#FF6B6B] sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-text-primary">
              <div className="h-1.5 w-1.5 rounded-full bg-[#FF6B6B]"></div>
              <span>🔥 Hot Leads</span>
            </div>
            <div className="mt-1 text-sm font-semibold text-text-primary sm:text-base lg:text-lg">
              {leadCounts?.hotLeadCount || "0"}
            </div>
          </div>

          <div className="group rounded border border-[#6BB6FF] bg-gradient-to-br from-[#F0F8FF] to-[#EBF4FF] p-1.5 transition-all duration-200 hover:border-[#6BB6FF] sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-text-primary">
              <div className="h-1.5 w-1.5 rounded-full bg-[#6BB6FF]"></div>
              <span>❄️ Cold Leads</span>
            </div>
            <div className="mt-1 text-sm font-semibold text-text-primary sm:text-base lg:text-lg">
              {leadCounts?.coldLeadCount || "0"}
            </div>
          </div> */}

          {/* Sales Card */}
          <div className="rounded-xl bg-data-sales/15 py-3 px-4 border border-data-sales/20 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
              <div className="w-2 h-2 bg-data-sales rounded-full"></div>
              <span>Ventes</span>
            </div>
            <div className="text-xl font-bold text-gray-800">
              €{additionalMetrics.saleAmount > 999
                ? (additionalMetrics.saleAmount / 1000).toFixed(1) + "k"
                : additionalMetrics.saleAmount.toLocaleString()}
            </div>
          </div>

          {/* Only show recent visitors for 24h hourly data */}
          {additionalMetrics.showRecentVisitors && (
            <div className="rounded-xl bg-gray-50 py-3 px-4 border border-gray-200/50 lg:min-w-[90px] lg:flex-shrink-0">
              <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                <div className="w-2 h-2 animate-pulse rounded-full bg-gray-400"></div>
                <span>Recent visits</span>
              </div>
              <div className="text-xl font-bold text-gray-800">
                {additionalMetrics.recentVisitors}
              </div>
            </div>
          )}

          <div className="rounded-xl bg-gray-50 py-3 px-4 border border-gray-200/50 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-1.5 text-sm text-neutral-600 mb-2">
              <span>RPC</span>
              <InfoTooltip content="Revenue Per Click - Average revenue generated per click on your links" />
            </div>
            <div className="text-xl font-bold text-gray-800">
              ${(additionalMetrics.revenuePerClick || 0).toFixed(1)}
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 py-3 px-4 border border-gray-200/50 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-1.5 text-sm text-neutral-600 mb-2">
              <span>CVR</span>
              <InfoTooltip content="Conversion Rate - Percentage of visitors who become qualified leads" />
            </div>
            <div className="text-xl font-bold text-gray-800">
              {Math.round(additionalMetrics.clickToLeadRate || 0)}%
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 py-3 px-4 border border-gray-200/50 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-1.5 text-sm text-neutral-600 mb-2">
              <span>Close Rate</span>
              <InfoTooltip content="Close Rate - Percentage of leads that convert to sales" />
            </div>
            <div className="text-xl font-bold text-gray-800">
              {Math.round(additionalMetrics.leadToSaleRate || 0)}%
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 py-3 px-4 border border-gray-200/50 lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-1.5 text-sm text-neutral-600 mb-2">
              <span>AOV</span>
              <InfoTooltip content="Average Order Value - Average value of each order generated" />
            </div>
            <div className="text-xl font-bold text-gray-800">
              {Math.round(additionalMetrics.avgOrderValue || 0)}€
            </div>
          </div>

        </div>
      ) : (
        <div className="mx-4 mt-4 mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2 xl:flex xl:grid-cols-8 xl:gap-2 xl:overflow-x-auto">
          {/* Clicks skeleton */}
          <div className="rounded-xl bg-brand-primary-light py-3 px-4 border border-brand-primary/10 animate-pulse lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
              <div className="w-2 h-2 bg-brand-primary/50 rounded-full"></div>
              <div className="h-3 w-8 bg-neutral-300/50 rounded"></div>
            </div>
            <div className="h-6 w-12 bg-neutral-300/50 rounded"></div>
          </div>

          {/* Leads skeleton */}
          <div className="rounded-xl bg-data-leads/15 py-3 px-4 border border-data-leads/20 animate-pulse lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
              <div className="w-2 h-2 bg-data-leads/50 rounded-full"></div>
              <div className="h-3 w-8 bg-neutral-300/50 rounded"></div>
            </div>
            <div className="h-6 w-8 bg-neutral-300/50 rounded"></div>
          </div>

          {/* Sales skeleton */}
          <div className="rounded-xl bg-data-sales/15 py-3 px-4 border border-data-sales/20 animate-pulse lg:min-w-[90px] lg:flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
              <div className="w-2 h-2 bg-data-sales/50 rounded-full"></div>
              <div className="h-3 w-8 bg-neutral-300/50 rounded"></div>
            </div>
            <div className="h-6 w-12 bg-neutral-300/50 rounded"></div>
          </div>

          {/* Additional metrics skeletons */}
          <div className="rounded-xl bg-gray-50 py-3 px-4 border border-gray-200/50 animate-pulse lg:min-w-[90px] lg:flex-shrink-0">
            <div className="h-3 w-12 bg-neutral-300/50 rounded mb-2"></div>
            <div className="h-6 w-8 bg-neutral-300/50 rounded"></div>
          </div>

          <div className="rounded-xl bg-gray-50 py-3 px-4 border border-gray-200/50 animate-pulse lg:min-w-[90px] lg:flex-shrink-0">
            <div className="h-3 w-14 bg-neutral-300/50 rounded mb-2"></div>
            <div className="h-6 w-6 bg-neutral-300/50 rounded"></div>
          </div>

          <div className="rounded-xl bg-gray-50 py-3 px-4 border border-gray-200/50 animate-pulse lg:min-w-[90px] lg:flex-shrink-0">
            <div className="h-3 w-16 bg-neutral-300/50 rounded mb-2"></div>
            <div className="h-6 w-6 bg-neutral-300/50 rounded"></div>
          </div>

          <div className="rounded-xl bg-gray-50 py-3 px-4 border border-gray-200/50 animate-pulse lg:min-w-[90px] lg:flex-shrink-0">
            <div className="h-3 w-10 bg-neutral-300/50 rounded mb-2"></div>
            <div className="h-6 w-6 bg-neutral-300/50 rounded"></div>
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
                        <div className="h-2.5 w-2.5 rounded-full bg-brand-primary"></div>
                        <span className="text-xs text-neutral-600">Clicks</span>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">
                        {nFormatter(clicks, { full: true })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-data-leads"></div>
                        <span className="text-xs text-neutral-600">Leads</span>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">
                        {leads}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-data-sales"></div>
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
