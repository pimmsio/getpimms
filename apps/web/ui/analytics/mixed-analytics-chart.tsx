import { formatDateTooltip } from "@/lib/analytics/format-date-tooltip";
import { editQueryString } from "@/lib/analytics/utils";
import useCustomersCount from "@/lib/swr/use-customers-count";
import useListIntegrations from "@/lib/swr/use-list-integrations";
import useWorkspace from "@/lib/swr/use-workspace";
import { EmptyState } from "@dub/ui";
import { TimeSeriesChart, XAxis, YAxis } from "@dub/ui/charts";
import { cn, fetcher, nFormatter } from "@dub/utils";
import { IntegrationsCardsLight } from "app/app.dub.co/(dashboard)/[slug]/settings/integrations/integrations-cards-light";
import { subDays } from "date-fns";
import { Target } from "lucide-react";
import { useContext, useMemo } from "react";
import useSWR from "swr";
import { AnalyticsLoadingSpinner } from "./analytics-loading-spinner";
import { AnalyticsContext } from "./analytics-provider";
import { MixedAreasAndBars } from "./mixed-areas-bars";
import { groupTimeseriesData } from "@/lib/analytics/utils/group-timeseries-data";


const DEMO_DATA = [
  { clicks: 150, leads: 38, sales: 6, saleAmount: 114 },
  { clicks: 180, leads: 45, sales: 8, saleAmount: 152 },
  { clicks: 230, leads: 58, sales: 12, saleAmount: 228 },
  { clicks: 320, leads: 80, sales: 18, saleAmount: 342 },
  { clicks: 305, leads: 76, sales: 15, saleAmount: 285 },
  { clicks: 330, leads: 83, sales: 19, saleAmount: 361 },
  { clicks: 290, leads: 73, sales: 16, saleAmount: 304 },
  { clicks: 340, leads: 85, sales: 22, saleAmount: 418 },
  { clicks: 310, leads: 78, sales: 17, saleAmount: 323 },
  { clicks: 380, leads: 95, sales: 24, saleAmount: 456 },
  { clicks: 360, leads: 90, sales: 21, saleAmount: 399 },
  { clicks: 270, leads: 68, sales: 14, saleAmount: 266 },
  { clicks: 360, leads: 90, sales: 20, saleAmount: 380 },
  { clicks: 280, leads: 70, sales: 16, saleAmount: 304 },
  { clicks: 270, leads: 68, sales: 15, saleAmount: 285 },
  { clicks: 350, leads: 88, sales: 19, saleAmount: 361 },
  { clicks: 370, leads: 93, sales: 22, saleAmount: 418 },
  { clicks: 350, leads: 88, sales: 20, saleAmount: 380 },
  { clicks: 340, leads: 85, sales: 19, saleAmount: 361 },
  { clicks: 300, leads: 75, sales: 17, saleAmount: 323 },
]
  .reverse()
  .map((value, index) => ({
    date: subDays(new Date(), index),
    values: {
      clicks: value.clicks,
      leads: value.leads,
      sales: value.sales,
      saleAmount: value.saleAmount * 19,
    },
  }))
  .reverse();

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
  } = useContext(AnalyticsContext);
  
  const { createdAt } = useWorkspace();

  // Fetch clicks data
  const { data: clicksData, isLoading: clicksLoading } = useSWR<
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
        event: "clicks",
      })}`,
    fetcher,
    {
      shouldRetryOnError: !requiresUpgrade,
    },
  );

  // Fetch leads data
  const { data: leadsData } = useSWR<
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
        event: "leads",
      })}`,
    fetcher,
    {
      shouldRetryOnError: !requiresUpgrade,
    },
  );

  // Fetch sales data
  const { data: salesData } = useSWR<
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
        event: "sales",
      })}`,
    fetcher,
    {
      shouldRetryOnError: !requiresUpgrade,
    },
  );

  const isLoading = clicksLoading;
  const data = clicksData;

  const { data: customersCount } = useCustomersCount();
  const dataSales = data?.reduce((acc, curr) => acc + curr.sales, 0);
  const countNoSales = !dataSales || dataSales === 0;
  const dataLeads = data?.reduce((acc, curr) => acc + curr.leads, 0);
  const countNoLeads = !dataLeads || dataLeads === 0;

  const { salesUsage } = useWorkspace();
  const hasNoCustomer = !customersCount || customersCount === 0;
  const hasNoSales = !salesUsage || salesUsage === 0;

  const isDataEmpty =
    !!data &&
    !isLoading &&
    (hasNoCustomer && countNoLeads && hasNoSales && countNoSales);

  const demo = !!data && !isLoading && (demoFromProps || isDataEmpty);

  const chartData = useMemo(() => {
    if (demo) {
      return DEMO_DATA;
    }

    if (!clicksData) return null;

    // Create a map to merge data from all three endpoints
    const dataMap = new Map();

    // Add clicks data
    clicksData.forEach(({ start, clicks, leads, sales, saleAmount }) => {
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
    leadsData?.forEach(({ start, leads }) => {
      const dateKey = start.toString();
      const existing = dataMap.get(dateKey);
      if (existing) {
        existing.values.leads = leads || 0;
      }
    });

    // Merge sales data
    salesData?.forEach(({ start, sales, saleAmount }) => {
      const dateKey = start.toString();
      const existing = dataMap.get(dateKey);
      if (existing) {
        existing.values.sales = sales || 0;
        existing.values.saleAmount = (saleAmount ?? 0) / 100;
      }
    });

    const mergedData = Array.from(dataMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Apply grouping for weekly/biweekly intervals
    if (interval === "90d") {
      return groupTimeseriesData(mergedData, "week");
    } else if (interval === "6m") {
      return groupTimeseriesData(mergedData, "biweekly");
    }

    return mergedData;
  }, [clicksData, leadsData, salesData, demo, interval]);

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

  const { integrations, loading: integrationsLoading } = useListIntegrations();

  return (
    <>
      <div
        className={cn(
          "relative flex h-64 sm:h-80 lg:h-96 w-full items-center justify-center",
          isDataEmpty && !integrationsLoading && !!integrations && "h-[200px] sm:h-[250px] lg:h-[300px]",
        )}
      >
        {chartData ? (
          <TimeSeriesChart
            key={queryString}
            data={chartData}
            series={series}
            defaultTooltipIndex={demo ? DEMO_DATA.length - 2 : undefined}
            tooltipClassName="p-0"
            tooltipContent={(d) => {
              const clicks = d.values.clicks;
              const leads = d.values.leads;
              const salesCount = d.values.sales;
              const revenue = d.values.saleAmount || 0;
              const conversionRate = clicks > 0 ? (leads / clicks) * 100 : 0;
              const salesRate = leads > 0 ? (salesCount / leads) * 100 : 0;

              return (
                <div className="bg-white rounded-lg px-4 py-3 shadow-lg min-w-[200px]">
                  <p className="text-neutral-900 font-medium mb-3 text-sm">
                    {formatDateTooltip(d.date, {
                      interval: demo ? "day" : interval,
                      start,
                      end,
                      dataAvailableFrom: createdAt,
                    })}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#3870FF] rounded-full"></div>
                        <span className="text-neutral-600 text-sm">Clicks</span>
                      </div>
                      <span className="text-neutral-900 font-semibold text-sm">{nFormatter(clicks, { full: true })}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-300 rounded-sm"></div>
                        <span className="text-neutral-600 text-sm">Leads</span>
                      </div>
                      <span className="text-neutral-900 font-semibold text-sm">{leads}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#00F5B8] rounded-sm"></div>
                        <span className="text-neutral-600 text-sm">Revenue</span>
                      </div>
                      <span className="text-neutral-900 font-semibold text-sm">${Math.round(revenue)}</span>
                    </div>
                    
                    <div className="border-t border-neutral-200 pt-2 mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-neutral-600 text-sm">Sales count</span>
                        <span className="text-neutral-700 font-medium text-sm">{salesCount}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500">Click → Lead rate</span>
                          <span className="text-neutral-700 font-medium">{Math.round(conversionRate)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500">Lead → Sale rate</span>
                          <span className="text-neutral-700 font-medium">{Math.round(salesRate)}%</span>
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
            <YAxis
              showGridLines
              tickFormat={nFormatter}
            />

          </TimeSeriesChart>
        ) : (
          <AnalyticsLoadingSpinner />
        )}

        {isDataEmpty && !integrationsLoading && !!integrations && (
          <div className="absolute inset-0 flex touch-pan-y flex-col items-center justify-center gap-4 bg-gradient-to-t from-[#fff_30%] to-[#fff6] pt-12">
            <EmptyState
              icon={Target}
              title="No activity recorded"
              description="Analytics data will appear here when your links generate clicks, leads, and sales."
            />
          </div>
        )}
      </div>
      {isDataEmpty && !integrationsLoading && !!integrations && (
        <IntegrationsCardsLight
          integrations={integrations}
          integrationsToShow={["stripe", "zapier", "systeme-io", "webflow", "framer"]}
        />
      )}
    </>
  );
}