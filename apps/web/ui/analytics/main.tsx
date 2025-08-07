import { EventType } from "@/lib/analytics/types";
import { editQueryString } from "@/lib/analytics/utils";

import { buttonVariants, useRouterStuff } from "@dub/ui";
import { cn, fetcher } from "@dub/utils";
import { Coins } from "lucide-react";
import Link from "next/link";
import { useContext, useMemo } from "react";
import useSWR from "swr";
import { AnalyticsFunnelChart } from "./analytics-funnel-chart";
import { AnalyticsContext } from "./analytics-provider";

import MixedAnalyticsChart from "./mixed-analytics-chart";

type Tab = {
  id: EventType;
  label: string;
  colorClassName: string;
  conversions: boolean;
};

export default function Main() {
  const {
    totalEvents,
    totalEventsLoading,
    requiresUpgrade,
    showConversions,
    selectedTab,
    view,
    baseApiPath,
    queryString,
    workspace,
  } = useContext(AnalyticsContext);
  const { plan } = workspace || {};
  const { queryParams } = useRouterStuff();

  // Fetch timeseries data to calculate recent visitors
  const { data: timeseriesData } = useSWR<
    {
      start: Date;
      clicks: number;
      leads: number;
      sales: number;
      saleAmount: number;
    }[]
  >(
    totalEvents &&
      `${baseApiPath}?${editQueryString(queryString, {
        groupBy: "timeseries",
      })}`,
    fetcher,
    {
      shouldRetryOnError: !requiresUpgrade,
    },
  );

  const tabs = useMemo(
    () =>
      [
        {
          id: "clicks",
          label: "Clicks",
          colorClassName: "text-[#08272E]/50",
          conversions: false,
        },
        ...(showConversions
          ? [
              {
                id: "leads",
                label: "Conversions",
                colorClassName: "text-[#08272E]/50",
                conversions: true,
              },
              {
                id: "sales",
                label: "Sales",
                colorClassName: "text-[#08272E]/50",
                conversions: true,
              },
            ]
          : []),
      ] as Tab[],
    [showConversions],
  );

  const tab = tabs.find(({ id }) => id === selectedTab) ?? tabs[0];

  const showPaywall =
    (tab.id === "sales" || view === "funnel") && plan === "free";

  const additionalMetrics = useMemo(() => {
    if (!totalEvents) return {};

    const clicks = totalEvents.clicks;
    const leads = totalEvents.leads;
    const sales = totalEvents.sales;
    const revenue = totalEvents.saleAmount / 100;
    const revenuePerClick = clicks > 0 ? revenue / clicks : 0;
    const clickToLeadRate = clicks > 0 ? (leads / clicks) * 100 : 0;
    const leadToSaleRate = leads > 0 ? (sales / leads) * 100 : 0;
    const avgOrderValue = sales > 0 ? revenue / sales : 0;

    // Calculate recent visitors and determine if we should show the metric
    let recentVisitors = 0;
    let showRecentVisitors = false;
    
    if (timeseriesData && timeseriesData.length > 1) {
      // Check if this is 24h data with hourly granularity
      const latestDataPoint = timeseriesData[timeseriesData.length - 1];
      const secondLatest = timeseriesData[timeseriesData.length - 2];
      const timeDiff = new Date(latestDataPoint.start).getTime() - new Date(secondLatest.start).getTime();
      
      // Only show recent visitors for hourly data (24h interval)
      if (timeDiff <= 2 * 60 * 60 * 1000) { // 2 hours or less - hourly data
        showRecentVisitors = true;
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Sum clicks from data points within the last hour
        recentVisitors = timeseriesData
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
      revenue,
      revenuePerClick,
      clickToLeadRate,
      leadToSaleRate,
      avgOrderValue,
      recentVisitors,
      showRecentVisitors,
    };
  }, [totalEvents, timeseriesData]);

  return (
    <div className="w-full overflow-hidden">
      {/* Enhanced metrics section */}
      <div className="relative">
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border border-gray-200/50 bg-white",
            showPaywall &&
              "pointer-events-none [mask-image:linear-gradient(#0006,#0006_25%,transparent_40%)]",
          )}
        >
          {totalEvents && !totalEventsLoading ? (
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 xl:flex xl:grid-cols-8 xl:gap-2 xl:overflow-x-auto m-2">
              <div
                className="group rounded-md bg-gradient-to-br p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0 from-[#EBF1FF] to-[#EFF1FF] border border-[#C2D4FF] hover:border-[#C2D4FF] transition-all duration-200"
              >
                <div
                  className="flex items-center gap-1 text-xs text-[#00237A]"
                >
                  <div
                    className="h-1.5 w-1.5 rounded-full bg-[#3870FF]"
                  ></div>
                  <span>Clicks</span>
                </div>
                <div
                  className="mt-1 text-sm font-semibold text-[#00237A] sm:text-base lg:text-lg"
                >
                  {totalEvents.clicks > 999
                    ? (totalEvents.clicks / 1000).toFixed(1) + "k"
                    : totalEvents.clicks.toString()}
                </div>
              </div>

              <div
                className="group rounded-md bg-gradient-to-br p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0 from-[#FFF6EB] to-[#FFF3EB] border border-[#FFB85C] hover:border-[#FFB85C] transition-all duration-200"
              >
                <div
                  className="flex items-center gap-1 text-xs text-[#522E00]"
                >
                  <div
                    className="h-1.5 w-1.5 rounded-full bg-[#FFD399]"
                  ></div>
                  <span>Leads</span>
                </div>
                <div
                  className="mt-1 text-sm font-semibold text-[#522E00] sm:text-base lg:text-lg"
                >
                  {totalEvents.leads || "0"}
                </div>
              </div>

              <div
                className="group rounded-md bg-gradient-to-br p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0 from-[#EBFFFA] to-[#EBFFFA] border border-[#47FFD1] hover:border-[#47FFD1] transition-all duration-200"
              >
                <div
                  className="flex items-center gap-1 text-xs text-[#002e25]"
                >
                  <div
                    className="h-1.5 w-1.5 rounded-full bg-[#00F5B8]"
                  ></div>
                  <span>Sales</span>
                </div>
                <div
                  className="mt-1 text-sm font-semibold text-[#002e25] sm:text-base lg:text-lg"
                >
                  $
                  {totalEvents.saleAmount
                    ? totalEvents.saleAmount > 99999
                      ? (totalEvents.saleAmount / 100 / 1000).toFixed(1) + "k"
                      : (totalEvents.saleAmount / 100).toFixed(0)
                    : "0"}
                </div>
              </div>

              {/* Only show recent visitors for 24h hourly data */}
              {additionalMetrics.showRecentVisitors && (
                <div
                  className="group rounded-md bg-gradient-to-br p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0 from-slate-50/70 to-gray-100/40 border border-gray-200/50 hover:border-gray-300/60 transition-all duration-200"
                >
                  <div
                    className="flex items-center gap-1 text-xs text-gray-600"
                  >
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400"></div>
                    <span>Recent visits</span>
                  </div>
                  <div
                    className="mt-1 text-sm font-semibold text-gray-900 sm:text-base lg:text-lg"
                  >
                    {additionalMetrics.recentVisitors}
                  </div>
                </div>
              )}

              <div
                className="group rounded-md bg-gradient-to-br p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0 from-slate-50/70 to-gray-100/40 border border-gray-200/50 hover:border-gray-300/60 transition-all duration-200"
              >
                <div className="text-xs text-gray-600">
                  Revenue/click
                </div>
                <div
                  className="mt-1 text-sm font-semibold text-gray-900 sm:text-base lg:text-lg"
                >
                  ${(additionalMetrics.revenuePerClick || 0).toFixed(1)}
                </div>
              </div>

              <div
                className="group rounded-md bg-gradient-to-br p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0 from-slate-50/70 to-gray-100/40 border border-gray-200/50 hover:border-gray-300/60 transition-all duration-200"
              >
                <div className="text-xs text-gray-600">
                  Click → Lead
                </div>
                <div
                  className="mt-1 text-sm font-semibold text-gray-900 sm:text-base lg:text-lg"
                >
                  {Math.round(additionalMetrics.clickToLeadRate || 0)}%
                </div>
              </div>

              <div
                className="group rounded-md bg-gradient-to-br p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0 from-slate-50/70 to-gray-100/40 border border-gray-200/50 hover:border-gray-300/60 transition-all duration-200"
              >
                <div className="text-xs text-gray-600">
                  Lead → Sale
                </div>
                <div
                  className="mt-1 text-sm font-semibold text-gray-900 sm:text-base lg:text-lg"
                >
                  {Math.round(additionalMetrics.leadToSaleRate || 0)}%
                </div>
              </div>

              <div
                className="group rounded-md bg-gradient-to-br p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0 from-slate-50/70 to-gray-100/40 border border-gray-200/50 hover:border-gray-300/60 transition-all duration-200"
              >
                <div className="text-xs text-gray-600">
                  Avg order
                </div>
                <div
                  className="mt-1 text-sm font-semibold text-gray-900 sm:text-base lg:text-lg"
                >
                  ${Math.round(additionalMetrics.avgOrderValue || 0)}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 xl:flex xl:grid-cols-8 xl:gap-2 xl:overflow-x-auto m-2">
              {/* Clicks skeleton */}
              <div className="group rounded-md border border-[#C2D4FF]/30 bg-gradient-to-br from-[#EBF1FF] to-[#EFF1FF] p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
                <div className="flex items-center gap-1 text-xs text-[#00237A]">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3870FF]/50"></div>
                  <div className="h-3 w-8 animate-pulse rounded-md bg-[#3870FF]/50"></div>
                </div>
                <div className="mt-1 h-5 w-6 animate-pulse rounded-md bg-[#3870FF]/50 sm:h-6 lg:h-7"></div>
              </div>

              {/* Conversions skeleton */}
              <div className="group rounded-md border border-[#FFB85C]/30 bg-gradient-to-br from-[#FFF6EB] to-[#FFF3EB] p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
                <div className="flex items-center gap-1 text-xs text-[#522E00]">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FFD399]/70"></div>
                  <div className="h-3 w-6 animate-pulse rounded-md bg-[#FFD399]/70"></div>
                </div>
                <div className="mt-1 h-5 w-4 animate-pulse rounded-md bg-[#FFD399]/70 sm:h-6 lg:h-7"></div>
              </div>

              {/* Revenue skeleton */}
              <div className="group rounded-md border border-[#47FFD1]/30 bg-gradient-to-br from-[#EBFFFA] to-[#EBFFFA] p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
                <div className="flex items-center gap-1 text-xs text-[#002e25]">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00F5B8]/70"></div>
                  <div className="h-3 w-6 animate-pulse rounded-md bg-[#00F5B8]/70"></div>
                </div>
                <div className="mt-1 h-5 w-6 animate-pulse rounded-md bg-[#00F5B8]/70 sm:h-6 lg:h-7"></div>
              </div>

              {/* Recent visitors skeleton */}
              <div className="group rounded-md border border-gray-200/50 bg-gray-50 p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-300"></div>
                  <div className="h-3 w-8 animate-pulse rounded-md bg-gray-300"></div>
                </div>
                <div className="mt-1 h-5 w-3 animate-pulse rounded-md bg-gray-400 sm:h-6 lg:h-7"></div>
              </div>

              {/* Revenue/click skeleton */}
              <div className="group rounded-md border border-gray-200/50 bg-gray-50 p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
                <div className="text-xs text-gray-600">
                  <div className="h-3 w-10 animate-pulse rounded-md bg-gray-300"></div>
                </div>
                <div className="mt-1 h-5 w-8 animate-pulse rounded-md bg-gray-400 sm:h-6 lg:h-7"></div>
              </div>

              {/* Click → Lead rate skeleton */}
              <div className="group rounded-md border border-gray-200/50 bg-gray-50 p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
                <div className="text-xs text-gray-600">
                  <div className="h-3 w-8 animate-pulse rounded-md bg-gray-300"></div>
                </div>
                <div className="mt-1 h-5 w-6 animate-pulse rounded-md bg-gray-400 sm:h-6 lg:h-7"></div>
              </div>

              {/* Lead → Sale rate skeleton */}
              <div className="group rounded-md border border-gray-200/50 bg-gray-50 p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
                <div className="text-xs text-gray-600">
                  <div className="h-3 w-8 animate-pulse rounded-md bg-gray-300"></div>
                </div>
                <div className="mt-1 h-5 w-6 animate-pulse rounded-md bg-gray-400 sm:h-6 lg:h-7"></div>
              </div>

              {/* Avg order value skeleton */}
              <div className="group rounded-md border border-gray-200/50 bg-gray-50 p-1.5 sm:p-2 lg:min-w-[90px] lg:flex-shrink-0">
                <div className="text-xs text-gray-600">
                  <div className="h-3 w-10 animate-pulse rounded-md bg-gray-300"></div>
                </div>
                <div className="mt-1 h-5 w-8 animate-pulse rounded-md bg-gray-400 sm:h-6 lg:h-7"></div>
              </div>
            </div>
          )}

          {view === "timeseries" && (
            <MixedAnalyticsChart demo={showPaywall} />
          )}
          {view === "funnel" && <AnalyticsFunnelChart demo={showPaywall} />}
        </div>
        {showPaywall && <ConversionTrackingPaywall />}
      </div>
    </div>
  );
}

function ConversionTrackingPaywall() {
  const { workspace } = useContext(AnalyticsContext);
  const { slug } = workspace || {};

  return (
    <div className="animate-slide-up-fade pointer-events-none absolute inset-0 flex items-center justify-center pt-24">
      <div className="pointer-events-auto flex flex-col items-center">
        <div className="flex size-16 items-center justify-center rounded-full border-[6px] border-neutral-100 bg-neutral-50">
          <Coins className="size-6 text-neutral-800" />
        </div>
        <h2 className="mt-7 text-base font-semibold text-neutral-700">
          Real-time Sales tracking
        </h2>
        <p className="mt-4 max-w-sm text-center text-sm text-neutral-500">
          Want to see your sales in realtime ?{" "}
          <a
            href="https://pimms.io/guides/how-to-track-conversions-on-vibe-coding-ai-no-code-sites"
            target="_blank"
            className="font-medium underline underline-offset-4 hover:text-black"
          >
            Learn more
          </a>
        </p>
        <Link
          href={`/${slug}/upgrade`}
          className={cn(
            buttonVariants({ variant: "primary" }),
            "mt-4 flex h-9 items-center justify-center rounded-md border px-4 text-sm",
          )}
        >
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}
