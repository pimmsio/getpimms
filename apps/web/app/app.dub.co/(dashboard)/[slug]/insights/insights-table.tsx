"use client";

import useLinkInsights from "@/lib/swr/use-link-insights";
import EmptyState from "@/ui/shared/empty-state";
import {
  LinksRow,
  LinksRowMetricPills,
  LinksRowSkeleton,
} from "@/ui/shared/links-row";
import { TableHeader } from "@/ui/shared/table-header";
import { TableLinkCellContent, TableUtmCellContent } from "@/ui/shared/table-link-cell";
import { 
  TABLE_HEADER_CLASS,
  TABLE_LINK_HEADER_CLASS,
  TABLE_LINK_CELL_CLASS,
  TABLE_UTM_CELL_CLASS,
  TABLE_CONTAINER_CLASS,
  TABLE_CLASS
} from "@/ui/shared/table-styles";
import { cn, currencyFormatter, nFormatter } from "@dub/utils";
import NumberFlow from "@number-flow/react";
import { endOfDay, format, isAfter, startOfDay } from "date-fns";
import { BarChart } from "lucide-react";
import React, { ReactNode, useMemo } from "react";

export type LinkInsight = {
  link: string;
  domain: string;
  key: string;
  url: string;
  title?: string | null;
  description?: string | null;
  clicks: number;
  leads: number;
  sales: number;
  saleAmount: number;
  comments?: string;
  createdAt: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  tags?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  timeseriesData?: Array<{
    start: string;
    clicks: number;
    leads: number;
    sales: number;
    saleAmount: number;
  }>;
};

export default function InsightsTable({
  requiresUpgrade,
  upgradeOverlay,
}: {
  requiresUpgrade?: boolean;
  upgradeOverlay?: ReactNode;
} = {}) {
  // Fetch links insights data (days only)
  const { data: combinedData, loading: isLoading, effectiveInterval } = useLinkInsights();
  
  // Use the effective interval (forced to max 30d) for display logic
  const interval = effectiveInterval;

  // Generate period columns based on ALL unique dates from ALL links
  const periodColumns = useMemo(() => {
    if (!combinedData?.links) return [];

    // Collect all unique dates from all links
    const allDates = new Set<string>();
    combinedData.links.forEach((link) => {
      link.timeseriesData?.forEach((ts) => {
        allDates.add(ts.start);
      });
    });

    const sortedDates = Array.from(allDates).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );

    // Create period columns from unique dates
    return sortedDates.map((dateStr) => {
      const date = new Date(dateStr);
      let label = "";

      // Format labels for days only
      switch (interval) {
        case "24h":
          label = format(date, "HH:mm");
          break;
        case "7d":
        case "30d":
        case "90d":
          label = format(date, "MMM d");
          break;
        case "1y":
          label = format(date, "MMM yyyy");
          break;
        default:
          label = format(date, "MMM d");
      }

      return {
        date,
        label,
        data: { start: dateStr }, // Use the actual date string for matching
      };
    });
  }, [combinedData?.links, interval]);

  // Transform the data to our LinkInsight format
  const transformedData = useMemo<LinkInsight[]>(() => {
    if (!combinedData?.links) return [];
    
    return combinedData.links
      .map((item) => {
        // Construct the short link properly
        const shortLink = `${item.domain}${item.key === "_root" ? "" : `/${item.key}`}`;

        // Use daily data as-is (weekly grouping disabled for now)
        const processedTimeseriesData = item.timeseriesData || [];
        
        return {
          link: shortLink,
          domain: item.domain,
          key: item.key,
          url: item.url,
          title: item.title,
          description: item.description,
          clicks: item.clicks || 0,
          leads: item.leads || 0,
          sales: item.sales || 0,
          saleAmount: item.saleAmount || 0,
          comments: item.comments,
          createdAt: item.createdAt,
          utmSource: item.utmSource,
          utmMedium: item.utmMedium,
          utmCampaign: item.utmCampaign,
          tags: item.tags || [],
          timeseriesData: processedTimeseriesData,
        };
      })
      .sort((a, b) => {
        // Sort by creation date (oldest first) as requested
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
  }, [combinedData?.links]);

  // Calculate totals for sticky footer
  const totals = useMemo(() => {
    if (!transformedData.length) return null;

    const totalClicks = transformedData.reduce(
      (sum, link) => sum + link.clicks,
      0,
    );
    const totalLeads = transformedData.reduce(
      (sum, link) => sum + link.leads,
      0,
    );
    const totalSales = transformedData.reduce(
      (sum, link) => sum + link.sales,
      0,
    );
    const totalAmount = transformedData.reduce(
      (sum, link) => sum + link.saleAmount,
      0,
    );

    return {
      clicks: totalClicks,
      leads: totalLeads,
      sales: totalSales,
      revenue: totalAmount / 100,
      ctr: totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0,
      leadToSale: totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0,
      aov: totalSales > 0 ? totalAmount / 100 / totalSales : 0,
      rpc: totalClicks > 0 ? totalAmount / 100 / totalClicks : 0,
      periodTotals: periodColumns.map((period) => {
        return transformedData.reduce(
          (acc, link) => {
            // Find the period data for this link - exact match with API data
            const periodData = link.timeseriesData?.find(
              (ts) => ts.start === period.data.start,
            );

            if (
              periodData &&
              !isAfter(
                startOfDay(new Date(link.createdAt)),
                endOfDay(period.date),
              )
            ) {
              acc.clicks += periodData.clicks || 0;
              acc.leads += periodData.leads || 0;
              acc.saleAmount += periodData.saleAmount || 0;
            }

            return acc;
          },
          { clicks: 0, leads: 0, saleAmount: 0 },
        );
      }),
    };
  }, [transformedData, periodColumns]);

  const showEmpty = !isLoading && (!transformedData || transformedData.length === 0);
  if (showEmpty) {
    return (
      <EmptyState
        icon={BarChart}
        title="No links with activity found"
        description="Links with clicks will appear here once you start getting traffic"
      />
    );
  }

  return (
    <GridInsightsTable
      data={transformedData}
      loading={isLoading}
      periodColumns={periodColumns}
      totals={totals}
    />
  );
}

// NOTE: Metrics + skeleton are standardized in `@/ui/shared/links-row`.

function GridInsightsTable({
  data,
  loading,
  periodColumns,
  totals,
}: {
  data: LinkInsight[];
  loading: boolean;
  periodColumns: { date: Date; label: string; data: { start: string } }[];
  totals: null | {
    clicks: number;
    leads: number;
    sales: number;
    revenue: number;
    ctr: number;
    leadToSale: number;
    aov: number;
    rpc: number;
    periodTotals: { clicks: number; leads: number; saleAmount: number }[];
  };
}) {
  const rows = data.length ? data : Array.from({ length: 8 }).map((_, idx) => ({ __skeleton: true, id: `s-${idx}` })) as any[];

  return (
    <div className="relative">
      <style jsx global>{`
        @media (min-width: 768px) {
          .insights-table td:first-child {
            position: sticky !important;
            left: 0 !important;
            z-index: 20 !important;
            background: white !important;
            border-right: 1px solid #f5f5f5 !important;
          }
          .insights-table th:first-child {
            z-index: 21 !important;
          }
          .insights-table tr.totals-row td:first-child {
            background: #f8fafc !important;
            z-index: 22 !important;
          }
        }
        .insights-table tr.totals-row {
          position: sticky !important;
          bottom: 0 !important;
          z-index: 15 !important;
          box-shadow: none !important;
        }
      `}</style>

      <div className={TABLE_CONTAINER_CLASS}>
        <table className={`insights-table ${TABLE_CLASS}`}>
          <thead className="bg-neutral-50">
            <tr>
              <th
                rowSpan={2}
                className={TABLE_LINK_HEADER_CLASS}
              >
                <TableHeader>Link</TableHeader>
              </th>
              <th
                rowSpan={2}
                className={TABLE_HEADER_CLASS}
              >
                <TableHeader>UTM / Tags</TableHeader>
              </th>
              <th
                rowSpan={2}
                className={TABLE_HEADER_CLASS}
              >
                <TableHeader>Metrics</TableHeader>
              </th>

              {periodColumns.map((period, index) => (
                <th
                  key={index}
                  colSpan={3}
                  className="border-l border-neutral-100 bg-neutral-50 px-3 py-2 text-center text-[11px] font-semibold text-neutral-700"
                >
                  {period.label}
                </th>
              ))}
            </tr>
            <tr>
              {periodColumns.map((_, index) => (
                <React.Fragment key={index}>
                  <th className="border-l border-neutral-100 bg-neutral-50 px-3 py-2 text-center text-[10px] font-medium text-neutral-500">
                    CLK
                  </th>
                  <th className="bg-neutral-50 px-3 py-2 text-center text-[10px] font-medium text-neutral-500">
                    LEAD
                  </th>
                  <th className="bg-neutral-50 px-3 py-2 text-center text-[10px] font-medium text-neutral-500">
                    REV
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100 bg-white">
            {rows.map((row: any) => {
              const isSkeleton = !!row.__skeleton;
              const link = row as LinkInsight;

              return (
                <tr key={isSkeleton ? row.id : `${link.domain}-${link.key}`} className="hover:bg-neutral-50/50">
                  <td className={TABLE_LINK_CELL_CLASS}>
                    <TableLinkCellContent
                      link={{
                        domain: link.domain,
                        key: link.key,
                        url: link.url,
                        title: link.title,
                        description: link.description,
                        createdAt: link.createdAt,
                      }}
                      tags={link.tags || []}
                      isSkeleton={isSkeleton}
                    />
                  </td>

                  <td className={TABLE_UTM_CELL_CLASS}>
                    <TableUtmCellContent
                      link={{
                        url: link.url,
                        utm_source: link.utmSource ?? null,
                        utm_medium: link.utmMedium ?? null,
                        utm_campaign: link.utmCampaign ?? null,
                      }}
                      tags={link.tags || []}
                      isSkeleton={isSkeleton}
                    />
                  </td>

                  <td className={TABLE_UTM_CELL_CLASS}>
                    {isSkeleton ? (
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-[46px] animate-pulse rounded bg-neutral-200" />
                        <div className="h-6 w-px bg-neutral-200/70" />
                        <div className="h-8 w-[46px] animate-pulse rounded bg-neutral-200" />
                        <div className="h-6 w-px bg-neutral-200/70" />
                        <div className="h-8 w-[46px] animate-pulse rounded bg-neutral-200" />
                      </div>
                    ) : (
                      <LinksRowMetricPills
                        metrics={{
                          clicks: link.clicks,
                          leads: link.leads,
                          revenue: link.saleAmount / 100,
                        }}
                      />
                    )}
                  </td>

                  {periodColumns.map((period, periodIndex) => {
                    if (isSkeleton) {
                      return (
                        <React.Fragment key={periodIndex}>
                          <td className="border-l border-neutral-100 px-3 py-2 text-center">
                            <div className="mx-auto h-4 w-10 animate-pulse rounded bg-neutral-200" />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="mx-auto h-4 w-10 animate-pulse rounded bg-neutral-200" />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="mx-auto h-4 w-12 animate-pulse rounded bg-neutral-200" />
                          </td>
                        </React.Fragment>
                      );
                    }

                    const periodData = link.timeseriesData?.find((ts) => ts.start === period.data.start);
                    const isGrayedOut = isAfter(startOfDay(new Date(link.createdAt)), endOfDay(period.date));

                    return (
                      <React.Fragment key={periodIndex}>
                        <td className={cn("border-l border-neutral-100 px-3 py-2 text-center", isGrayedOut && "opacity-30")}>
                          {isGrayedOut ? (
                            <span className="text-neutral-300 text-sm">—</span>
                          ) : (
                            <NumberFlow
                              value={periodData?.clicks || 0}
                              className={cn("text-sm font-semibold tabular-nums", (periodData?.clicks || 0) === 0 && "text-neutral-400")}
                              format={{ notation: "compact" }}
                            />
                          )}
                        </td>
                        <td className={cn("px-3 py-2 text-center", isGrayedOut && "opacity-30")}>
                          {isGrayedOut ? (
                            <span className="text-neutral-300 text-sm">—</span>
                          ) : (
                            <NumberFlow
                              value={periodData?.leads || 0}
                              className={cn("text-sm font-semibold tabular-nums", (periodData?.leads || 0) === 0 && "text-neutral-400")}
                              format={{ notation: "compact" }}
                            />
                          )}
                        </td>
                        <td className={cn("px-3 py-2 text-center", isGrayedOut && "opacity-30")}>
                          {isGrayedOut ? (
                            <span className="text-neutral-300 text-sm">—</span>
                          ) : (
                            <span className={cn("text-sm font-semibold tabular-nums", (periodData?.saleAmount || 0) === 0 && "text-neutral-400")}>
                              {currencyFormatter((periodData?.saleAmount || 0) / 100, { maximumFractionDigits: 0 })}
                            </span>
                          )}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              );
            })}

            {!loading && totals && (
              <tr className="totals-row border-t border-neutral-100 bg-neutral-50 font-semibold">
                <td className="bg-neutral-50 px-2 py-2 text-left md:sticky md:left-0 md:z-10 sm:px-5 min-w-[450px] w-[450px]">
                  <div className="text-sm font-semibold text-neutral-900">
                    Total ({data.length} links)
                  </div>
                </td>
                <td className="bg-neutral-50 px-3 py-2"></td>
                <td className="bg-neutral-50 px-3 py-2">
                  <LinksRowMetricPills
                    metrics={{
                      clicks: totals.clicks,
                      leads: totals.leads,
                      revenue: totals.revenue,
                    }}
                  />
                </td>

                {totals.periodTotals.map((pt, idx) => (
                  <React.Fragment key={idx}>
                    <td className="border-l border-neutral-100 bg-neutral-50 px-3 py-2 text-center">
                      <div className={cn("text-sm font-semibold tabular-nums", pt.clicks === 0 && "text-neutral-400")}>
                        {nFormatter(pt.clicks)}
                      </div>
                    </td>
                    <td className="bg-neutral-50 px-3 py-2 text-center">
                      <div className={cn("text-sm font-semibold tabular-nums", pt.leads === 0 && "text-neutral-400")}>
                        {nFormatter(pt.leads)}
                      </div>
                    </td>
                    <td className="bg-neutral-50 px-3 py-2 text-center">
                      <div className={cn("text-sm font-semibold tabular-nums", pt.saleAmount === 0 && "text-neutral-400")}>
                        {currencyFormatter(pt.saleAmount / 100, { maximumFractionDigits: 0 })}
                      </div>
                    </td>
                  </React.Fragment>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

