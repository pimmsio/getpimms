"use client";

import useLinkInsights from "@/lib/swr/use-link-insights";
import { AnalyticsContext } from "@/ui/analytics/analytics-provider";
import EmptyState from "@/ui/shared/empty-state";
import { LinkCell } from "@/ui/shared/link-cell";
import { nFormatter } from "@dub/utils";
import NumberFlow from "@number-flow/react";
import { endOfDay, format, isAfter, startOfDay } from "date-fns";
import { BarChart } from "lucide-react";
import React, { ReactNode, useContext, useMemo } from "react";

export type LinkInsight = {
  link: string;
  domain: string;
  key: string;
  url: string;
  clicks: number;
  leads: number;
  sales: number;
  saleAmount: number;
  comments?: string;
  createdAt: string;
  timeseriesData?: Array<{
    start: string;
    clicks: number;
    leads: number;
    sales: number;
    saleAmount: number;
  }>;
};

type ColumnMeta = {
  filterParams?: (args: Pick<any, "getValue">) => Record<string, any>;
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

    console.log(
      "🔍 Frontend - combinedData.links:",
      combinedData.links.length,
      "links",
    );

    // Collect all unique dates from all links
    const allDates = new Set<string>();
    combinedData.links.forEach((link) => {
      link.timeseriesData?.forEach((ts) => {
        allDates.add(ts.start);
      });
    });

    console.log("🔍 Frontend - All unique dates:", allDates.size, "dates");
    console.log(
      "🔍 Frontend - Sample dates:",
      Array.from(allDates).slice(0, 3),
    );

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
          clicks: item.clicks || 0,
          leads: item.leads || 0,
          sales: item.sales || 0,
          saleAmount: item.saleAmount || 0,
          comments: item.comments,
          createdAt: item.createdAt,
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
      ctr:
        totalClicks > 0 ? ((totalLeads / totalClicks) * 100).toFixed(1) : "0.0",
      leadToSale:
        totalLeads > 0 ? ((totalSales / totalLeads) * 100).toFixed(1) : "0.0",
      aov: totalSales > 0 ? (totalAmount / 100 / totalSales).toFixed(0) : "0",
      rpc:
        totalClicks > 0 ? (totalAmount / 100 / totalClicks).toFixed(2) : "0.00",
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

  // Empty state handling
  if (!transformedData || transformedData.length === 0) {
    if (isLoading) {
      return (
        <div className="flex h-[400px] w-full items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      );
    }

    return (
      <EmptyState
        icon={BarChart}
        title="No links with activity found"
        description="Links with clicks will appear here once you start getting traffic"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      {/* <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <LinkInsightsExportButton />
        </div>
      </div> */}

      <div className="relative">
        <style jsx global>{`
          @media (min-width: 768px) {
            .insights-table td:first-child {
              position: sticky !important;
              left: 0 !important;
              z-index: 20 !important;
              background: white !important;
              border-right: 2px solid #e5e7eb !important;
              box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05) !important;
            }
            .insights-table th:first-child {
              z-index: 21 !important;
            }

            /* Totals row sticky */
            .insights-table tr.totals-row td:first-child {
              background: #f3f4f6 !important;
              border-right: 2px solid #d1d5db !important;
              z-index: 22 !important;
            }
          }

          @media (max-width: 767px) {
            .insights-table th:first-child,
            .insights-table td:first-child {
              position: static !important;
              border-right: none !important;
              box-shadow: none !important;
            }
          }

          /* Totals row styling */
          .insights-table tr.totals-row {
            position: sticky !important;
            bottom: 0 !important;
            z-index: 15 !important;
            box-shadow: 0 -4px 8px rgba(0, 0, 0, 0.1) !important;
          }
        `}</style>

        {/* Custom table with merged headers */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="insights-table min-w-full divide-y divide-gray-200">
            {/* Double header row */}
            <thead className="bg-gray-50">
              {/* First header row - Period labels */}
              <tr>
                <th
                  rowSpan={2}
                  className="bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:sticky md:left-0 md:z-10"
                >
                  Link
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Clics
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Leads
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Ventes
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  RPC
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  CVR
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Closed
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  AOV
                </th>

                {/* Period headers - merged across 3 columns each */}
                {periodColumns.map((period, index) => (
                  <th
                    key={index}
                    colSpan={3}
                    className="border-l-2 border-blue-200 bg-blue-50 px-2 py-2 text-center text-xs font-semibold text-blue-700"
                  >
                    {period.label}
                  </th>
                ))}
              </tr>

              {/* Second header row - sub-headers for each period */}
              <tr>
                {/* Sub-headers for each period */}
                {periodColumns.map((period, index) => (
                  <React.Fragment key={index}>
                    <th className="border-l-2 border-blue-200 bg-blue-50 px-2 py-2 text-center text-xs font-medium text-gray-600">
                      Clics
                    </th>
                    <th className="bg-blue-50 px-2 py-2 text-center text-xs font-medium text-gray-600">
                      Leads
                    </th>
                    <th className="bg-blue-50 px-2 py-2 text-center text-xs font-medium text-gray-600">
                      Ventes
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            {/* Table body */}
            <tbody className="divide-y divide-gray-200 bg-white">
              {transformedData.map((link, linkIndex) => (
                <tr
                  key={`${link.domain}-${link.key}`}
                  className="hover:bg-gray-50"
                >
                  {/* Link column */}
                  <td className="whitespace-nowrap bg-white px-4 py-3 md:sticky md:left-0 md:z-10">
                    <LinkCell
                      link={link}
                      variant="table"
                      showCopyButton={false}
                      maxWidth="320px"
                    />
                  </td>

                  {/* Metric columns */}
                  <td className="px-2 py-3 text-center">
                    <div
                      className={`text-sm font-medium ${link.clicks === 0 ? "text-gray-400" : ""}`}
                    >
                      {nFormatter(link.clicks)}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div
                      className={`text-sm font-medium ${link.leads === 0 ? "text-gray-400" : ""}`}
                    >
                      {nFormatter(link.leads)}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div
                      className={`text-sm font-medium ${(link.saleAmount || 0) === 0 ? "text-gray-400" : ""}`}
                    >
                      €{nFormatter(link.saleAmount / 100)}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div
                      className={`text-sm font-medium ${link.clicks === 0 || (link.saleAmount || 0) === 0 ? "text-gray-400" : ""}`}
                    >
                      €
                      {link.clicks > 0
                        ? (link.saleAmount / 100 / link.clicks).toFixed(1)
                        : "0.0"}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div
                      className={`text-sm font-medium ${link.clicks === 0 || link.leads === 0 ? "text-gray-400" : ""}`}
                    >
                      {link.clicks > 0
                        ? ((link.leads / link.clicks) * 100).toFixed(0)
                        : "0"}
                      %
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div
                      className={`text-sm font-medium ${link.leads === 0 || link.sales === 0 ? "text-gray-400" : ""}`}
                    >
                      {link.leads > 0
                        ? ((link.sales / link.leads) * 100).toFixed(0)
                        : "0"}
                      %
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div
                      className={`text-sm font-medium ${link.sales === 0 || (link.saleAmount || 0) === 0 ? "text-gray-400" : ""}`}
                    >
                      €
                      {link.sales > 0
                        ? (link.saleAmount / 100 / link.sales).toFixed(0)
                        : "0"}
                    </div>
                  </td>

                  {/* Period columns - 3 separate columns per period */}
                  {periodColumns.map((period, periodIndex) => {
                    // Find the period data for this link - exact match with API data
                    const periodData = link.timeseriesData?.find(
                      (ts) => ts.start === period.data.start,
                    );

                    // Debug log for first link and first period
                    if (linkIndex === 0 && periodIndex === 0) {
                      console.log("🔍 Frontend - Matching period data:");
                      console.log("  period.data.start:", period.data.start);
                      console.log(
                        "  link.timeseriesData:",
                        link.timeseriesData?.slice(0, 3),
                      );
                      console.log("  periodData found:", periodData);
                    }

                    const isGrayedOut = isAfter(
                      startOfDay(new Date(link.createdAt)),
                      endOfDay(period.date),
                    );

                    return (
                      <React.Fragment key={periodIndex}>
                        {/* Clicks column */}
                        <td
                          className={`border-l-2 border-blue-200 px-2 py-3 text-center ${isGrayedOut ? "opacity-30" : ""}`}
                        >
                          {isGrayedOut ? (
                            <span className="text-gray-300">-</span>
                          ) : (
                            <NumberFlow
                              value={periodData?.clicks || 0}
                              className={`text-sm font-medium tabular-nums ${(periodData?.clicks || 0) === 0 ? "text-gray-400" : ""}`}
                              format={{ notation: "compact" }}
                            />
                          )}
                        </td>

                        {/* Leads column */}
                        <td
                          className={`px-2 py-3 text-center ${isGrayedOut ? "opacity-30" : ""}`}
                        >
                          {isGrayedOut ? (
                            <span className="text-gray-300">-</span>
                          ) : (
                            <NumberFlow
                              value={periodData?.leads || 0}
                              className={`text-sm font-medium tabular-nums ${(periodData?.leads || 0) === 0 ? "text-gray-400" : ""}`}
                              format={{ notation: "compact" }}
                            />
                          )}
                        </td>

                        {/* Sales column */}
                        <td
                          className={`px-2 py-3 text-center ${isGrayedOut ? "opacity-30" : ""}`}
                        >
                          {isGrayedOut ? (
                            <span className="text-gray-300">-</span>
                          ) : (
                            <span
                              className={`text-sm font-medium tabular-nums ${(periodData?.saleAmount || 0) === 0 ? "text-gray-400" : ""}`}
                            >
                              €
                              {nFormatter(
                                periodData?.saleAmount
                                  ? periodData.saleAmount / 100
                                  : 0,
                              )}
                            </span>
                          )}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}

              {/* Totals row */}
              {totals && (
                <tr className="totals-row border-t-2 border-gray-400 bg-gray-100 font-semibold">
                  {/* Link column total */}
                  <td className="border-r-2 border-gray-300 bg-gray-100 px-4 py-3 text-left md:sticky md:left-0 md:z-10">
                    <div className="text-sm font-semibold text-gray-900">
                      Total ({transformedData.length} links)
                    </div>
                  </td>

                  {/* Metric totals */}
                  <td className="bg-gray-100 px-2 py-3 text-center">
                    <div
                      className={`text-sm font-semibold ${totals.clicks === 0 ? "text-gray-400" : ""}`}
                    >
                      {nFormatter(totals.clicks)}
                    </div>
                  </td>
                  <td className="bg-gray-100 px-2 py-3 text-center">
                    <div
                      className={`text-sm font-semibold ${totals.leads === 0 ? "text-gray-400" : ""}`}
                    >
                      {nFormatter(totals.leads)}
                    </div>
                  </td>
                  <td className="bg-gray-100 px-2 py-3 text-center">
                    <div
                      className={`text-sm font-semibold ${totals.revenue === 0 ? "text-gray-400" : ""}`}
                    >
                      €{nFormatter(totals.revenue)}
                    </div>
                  </td>
                  <td className="bg-gray-100 px-2 py-3 text-center">
                    <div
                      className={`text-sm font-semibold ${totals.rpc === "0.0" ? "text-gray-400" : ""}`}
                    >
                      €{totals.rpc}
                    </div>
                  </td>
                  <td className="bg-gray-100 px-2 py-3 text-center">
                    <div
                      className={`text-sm font-semibold ${totals.ctr === "0" ? "text-gray-400" : ""}`}
                    >
                      {totals.ctr}%
                    </div>
                  </td>
                  <td className="bg-gray-100 px-2 py-3 text-center">
                    <div
                      className={`text-sm font-semibold ${totals.leadToSale === "0" ? "text-gray-400" : ""}`}
                    >
                      {totals.leadToSale}%
                    </div>
                  </td>
                  <td className="bg-gray-100 px-2 py-3 text-center">
                    <div
                      className={`text-sm font-semibold ${totals.aov === "0" ? "text-gray-400" : ""}`}
                    >
                      €{totals.aov}
                    </div>
                  </td>

                  {/* Period totals - 3 columns per period */}
                  {totals.periodTotals.map((periodTotal, index) => (
                    <React.Fragment key={index}>
                      <td className="border-l-2 border-blue-300 bg-gray-100 px-2 py-3 text-center">
                        <div
                          className={`text-sm font-semibold ${periodTotal.clicks === 0 ? "text-gray-400" : ""}`}
                        >
                          {nFormatter(periodTotal.clicks)}
                        </div>
                      </td>
                      <td className="bg-gray-100 px-2 py-3 text-center">
                        <div
                          className={`text-sm font-semibold ${periodTotal.leads === 0 ? "text-gray-400" : ""}`}
                        >
                          {nFormatter(periodTotal.leads)}
                        </div>
                      </td>
                      <td className="bg-gray-100 px-2 py-3 text-center">
                        <div
                          className={`text-sm font-semibold ${periodTotal.saleAmount === 0 ? "text-gray-400" : ""}`}
                        >
                          €{nFormatter(periodTotal.saleAmount / 100)}
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
    </div>
  );
}
