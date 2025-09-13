import { formatDateTooltip } from "@/lib/analytics/format-date-tooltip";
import { EventType } from "@/lib/analytics/types";
import { editQueryString } from "@/lib/analytics/utils";
import useCustomersCount from "@/lib/swr/use-customers-count";
import useListIntegrations from "@/lib/swr/use-list-integrations";

import { EmptyState } from "@dub/ui";
import { Areas, TimeSeriesChart, XAxis, YAxis } from "@dub/ui/charts";
import { cn, currencyFormatter, fetcher, nFormatter } from "@dub/utils";
import { IntegrationsCardsLight } from "app/app.dub.co/(dashboard)/[slug]/settings/integrations/integrations-cards-light";
import { subDays } from "date-fns";
import { Coins, Target } from "lucide-react";
import { Fragment, useContext, useMemo } from "react";
import useSWR from "swr";
import { AnalyticsLoadingSpinner } from "./analytics-loading-spinner";
import { AnalyticsContext } from "./analytics-provider";

const DEMO_DATA = [
  180, 230, 320, 305, 330, 290, 340, 310, 380, 360, 270, 360, 280, 270, 350,
  370, 350, 340, 300,
]
  .reverse()
  .map((value, index) => ({
    date: subDays(new Date(), index),
    values: {
      clicks: value,
      leads: value,
      sales: value,
      saleAmount: value * 19,
    },
  }))
  .reverse();

const RESOURCE_LABELS = {
  clicks: "Clicks",
  leads: "Conversions",
  sales: "Sales",
  saleAmount: "Revenue",
};

export default function AnalyticsAreaChart({
  resource,
  demo: demoFromProps,
}: {
  resource: EventType;
  demo?: boolean;
}) {
  const {
    baseApiPath,
    queryString,
    start,
    end,
    interval,
    saleUnit,
    requiresUpgrade,
    adminPage,
    workspace,
  } = useContext(AnalyticsContext);
  const { createdAt, salesUsage } = workspace || {};

  const { data, isLoading } = useSWR<
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
      })}`,
    fetcher,
    {
      shouldRetryOnError: !requiresUpgrade,
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  const { data: customersCount } = useCustomersCount();
  const dataSales = data?.reduce((acc, curr) => acc + curr.sales, 0);
  const countNoSales = !dataSales || dataSales === 0;
  const dataLeads = data?.reduce((acc, curr) => acc + curr.leads, 0);
  const countNoLeads = !dataLeads || dataLeads === 0;

  // For admin pages, assume there are customers and sales (don't use workspace-specific checks)
  const hasNoCustomer = adminPage ? false : (!customersCount || customersCount === 0);
  const hasNoSales = adminPage ? false : (!salesUsage || salesUsage === 0);

  // For admin pages, don't use workspace-specific empty data detection
  const isDataEmpty =
    !adminPage &&
    !!data &&
    !isLoading &&
    ((resource === "leads" && hasNoCustomer && countNoLeads) ||
      (resource === "sales" && hasNoSales && countNoSales));

  const demo = !!data && !isLoading && (demoFromProps || isDataEmpty);

  const chartData = useMemo(
    () =>
      demo
        ? DEMO_DATA
        : data?.map(({ start, clicks, leads, sales, saleAmount }) => ({
            date: new Date(start),
            values: {
              clicks,
              leads,
              sales,
              saleAmount: (saleAmount ?? 0) / 100,
            },
          })) ?? null,
    [data, demo],
  );

  const series = [
    {
      id: "clicks",
      valueAccessor: (d) => d.values.clicks,
      isActive: resource === "clicks",
      colorClassName: "text-data-clicks",
    },
    {
      id: "leads",
      valueAccessor: (d) => d.values.leads,
      isActive: resource === "leads",
      colorClassName: "text-data-clicks",
    },
    {
      id: "sales",
      valueAccessor: (d) => d.values[saleUnit],
      isActive: resource === "sales",
      colorClassName: "text-data-clicks",
    },
  ];

  const activeSeries = series.find(({ id }) => id === resource);
  const { integrations, loading: integrationsLoading } = useListIntegrations();

  return (
    <>
      <div
        className={cn(
          "relative flex h-96 w-full items-center justify-center",
          isDataEmpty && !integrationsLoading && !!integrations && "h-[300px]",
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
              return (
                <div 
                  className="bg-white rounded shadow-xl border-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="border-b border-neutral-100/80 px-3 py-2 text-sm text-neutral-900 font-medium">
                    {formatDateTooltip(d.date, {
                      interval: demo ? "day" : interval,
                      start,
                      end,
                      dataAvailableFrom: createdAt,
                    })}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-3 py-2 text-sm">
                    <Fragment key={resource}>
                      <div className="flex items-center gap-2">
                        {/* {activeSeries && (
                        <div
                          className={cn(
                            activeSeries.colorClassName,
                            "h-2 w-2 rounded bg-current opacity-50 shadow-[inset_0_0_0_1px_#0003]",
                          )}
                        />
                      )} */}
                        <p className="capitalize text-neutral-600">
                          {RESOURCE_LABELS[resource]}
                        </p>
                      </div>
                      <p className="text-right font-medium text-neutral-900">
                        {resource === "sales" && saleUnit === "saleAmount"
                          ? currencyFormatter(d.values.saleAmount)
                          : nFormatter(d.values[resource], { full: true })}
                      </p>
                    </Fragment>
                  </div>
                </div>
              );
            }}
          >
            <Areas />
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
              tickFormat={
                resource === "sales" && saleUnit === "saleAmount"
                  ? (v) => `$${nFormatter(v)}`
                  : nFormatter
              }
            />
          </TimeSeriesChart>
        ) : (
          <AnalyticsLoadingSpinner />
        )}

        {isDataEmpty && !integrationsLoading && !!integrations && (
          <div className="absolute inset-0 flex touch-pan-y flex-col items-center justify-center gap-4 bg-gradient-to-t from-[#fff_30%] to-[#fff6] pt-12">
            <EmptyState
              icon={resource === "sales" ? Coins : Target}
              title={`No ${resource === "sales" ? "sales" : "conversions"} recorded`}
              description={`${resource === "sales" ? "Sales" : "Conversions"} will appear here when your links convert to ${resource}. To get started, install an integration below or follow a guide.`}
            />
          </div>
        )}
      </div>
      {isDataEmpty && !integrationsLoading && !!integrations && (
        <IntegrationsCardsLight
          integrations={integrations}
          integrationsToShow={
            resource === "leads"
              ? undefined
              : ["stripe", "zapier", "systeme-io", "webflow", "framer"]
          }
        />
      )}
    </>
  );
}
