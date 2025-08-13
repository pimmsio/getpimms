"use client";

import { editQueryString } from "@/lib/analytics/utils";
import EmptyState from "@/ui/shared/empty-state";
import {
  ArrowTurnRight2,
  LinkLogo,
  Table,
  usePagination,
  useRouterStuff,
  useTable,
} from "@dub/ui";
import {
  fetcher,
  getApexDomain,
  getPrettyUrl,
  nFormatter,
} from "@dub/utils";
import { ColumnDef } from "@tanstack/react-table";
import { BarChart } from "lucide-react";
import { ReactNode, useContext, useMemo } from "react";
import useSWR from "swr";
import { AnalyticsContext } from "@/ui/analytics/analytics-provider";
import FilterButton from "@/ui/analytics/events/filter-button";

export type LinkInsight = {
  link: string;
  domain: string;
  key: string;
  url: string;
  clicks: number;
  leads: number;
  sales: number;
  saleAmount: number;
  // Additional metrics
  uniqueClicks?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
};

type ColumnMeta = {
  filterParams?: (
    args: Pick<any, "getValue">,
  ) => Record<string, any>;
};

export default function InsightsTable({
  requiresUpgrade,
  upgradeOverlay,
}: {
  requiresUpgrade?: boolean;
  upgradeOverlay?: ReactNode;
} = {}) {
  const { searchParams, queryParams } = useRouterStuff();
  const {
    baseApiPath,
    queryString: originalQueryString,
    totalEvents,
  } = useContext(AnalyticsContext);

  const sortBy = searchParams.get("sortBy") || "clicks";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const columns = useMemo<ColumnDef<LinkInsight, any>[]>(
    () => [
      {
        id: "link",
        header: "Link",
        accessorKey: "link",
        minSize: 350,
        size: 350,
        enableHiding: false,
        meta: {
          filterParams: ({ getValue }) => ({
            domain: getValue().split('/')[0],
            key: getValue().split('/')[1] || "_root",
          }),
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-3 py-1">
            {/* Rounded logo exactly like SimpleLinkCard */}
            <div className="relative flex-none rounded-full border border-neutral-100 bg-gradient-to-t from-neutral-100 sm:p-1.5">
              <LinkLogo
                apexDomain={getApexDomain(row.original.url)}
                className="size-4 shrink-0 sm:size-5"
              />
            </div>
            {/* Link info exactly like SimpleLinkCard */}
            <div className="flex min-w-0 flex-col text-sm leading-tight">
              <span className="truncate text-sm font-semibold text-neutral-800" title={row.original.link}>
                {getPrettyUrl(row.original.link)}
              </span>
              <div className="flex items-center gap-1">
                <ArrowTurnRight2 className="h-3 w-3 shrink-0 text-neutral-400" />
                {row.original.url ? (
                  <span title={row.original.url} className="truncate text-neutral-500">
                    {getPrettyUrl(row.original.url)}
                  </span>
                ) : (
                  <span className="truncate text-neutral-400">No URL configured</span>
                )}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "clicks",
        header: "Clicks",
        accessorKey: "clicks",
        size: 90,
        cell: ({ getValue }) => (
          <div className="font-medium text-blue-600">
            {nFormatter(getValue())}
          </div>
        ),
      },
      {
        id: "leads",
        header: "Leads",
        accessorKey: "leads",
        size: 90,
        cell: ({ getValue }) => (
          <div className="font-medium text-orange-600">
            {nFormatter(getValue())}
          </div>
        ),
      },
      {
        id: "revenue",
        header: "Revenue",
        accessorKey: "saleAmount",
        size: 110,
        cell: ({ getValue }) => (
          <div className="font-medium text-green-600">
            ${nFormatter(getValue() / 100)}
          </div>
        ),
      },
      {
        id: "ctr",
        header: "CTR",
        size: 80,
        accessorFn: (row) => 
          row.clicks > 0 ? ((row.leads / row.clicks) * 100).toFixed(1) : "0.0",
        cell: ({ getValue }) => (
          <div className="text-sm font-medium">
            {getValue()}%
          </div>
        ),
      },
      {
        id: "cpc",
        header: "CPC",
        size: 90,
        accessorFn: (row) => 
          row.clicks > 0 ? ((row.saleAmount / 100) / row.clicks).toFixed(2) : "0.00",
        cell: ({ getValue }) => (
          <div className="text-sm font-medium">
            ${getValue()}
          </div>
        ),
      },
      {
        id: "aov",
        header: "AOV",
        size: 90,
        accessorFn: (row) => 
          row.sales > 0 ? ((row.saleAmount / 100) / row.sales).toFixed(0) : "0",
        cell: ({ getValue }) => (
          <div className="text-sm font-medium">
            ${getValue()}
          </div>
        ),
      },
      {
        id: "rpc",
        header: "Rev/Click",
        size: 100,
        accessorFn: (row) => 
          row.clicks > 0 ? ((row.saleAmount / 100) / row.clicks).toFixed(2) : "0.00",
        cell: ({ getValue }) => (
          <div className="text-sm font-medium">
            ${getValue()}
          </div>
        ),
      },
    ],
    [],
  );

  const { pagination, setPagination } = usePagination();

  // Fetch aggregated data for all links with clicks > 0
  const { data: linksData, isLoading, error } = useSWR<any[]>(
    `${baseApiPath}?${editQueryString(originalQueryString, {
      groupBy: "top_links",
      event: "composite", // Get all metrics
    })}`,
    fetcher,
    {
      keepPreviousData: true,
    },
  );

  // Transform the data to our LinkInsight format
  const transformedData = useMemo<LinkInsight[]>(() => {
    if (!linksData) return [];
    
    return linksData
      .filter(item => item.clicks > 0) // Only links with clicks > 0
      .map(item => {
        // Construct the short link properly
        const shortLink = `${item.domain}${item.key === '_root' ? '' : `/${item.key}`}`;
        
        return {
          link: shortLink,
          domain: item.domain,
          key: item.key,
          url: item.url,
          clicks: item.clicks || 0,
          leads: item.leads || 0,
          sales: item.sales || 0,
          saleAmount: item.saleAmount || 0,
        };
      })
      .sort((a, b) => {
        const aValue = a[sortBy as keyof LinkInsight] || 0;
        const bValue = b[sortBy as keyof LinkInsight] || 0;
        
        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return bValue > aValue ? 1 : -1;
        }
      });
  }, [linksData, sortBy, sortOrder]);

  const isEmptyData = !transformedData || transformedData.length === 0;

  const { table, ...tableProps } = useTable({
    data: transformedData,
    loading: isLoading,
    error: error ? "Failed to fetch insights data." : undefined,
    columns,
    enableColumnResizing: true,
    sortableColumns: ["clicks", "leads", "revenue", "ctr", "cpc", "aov", "rpc"],
    sortBy,
    sortOrder,
    onSortChange: ({ sortBy, sortOrder }) =>
      queryParams({
        set: {
          ...(sortBy && { sortBy }),
          ...(sortOrder && { sortOrder }),
        },
      }),
    cellRight: (cell) => {
      const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
      return (
        meta?.filterParams && <FilterButton set={meta.filterParams(cell)} />
      );
    },
    emptyState: (
      <EmptyState
        icon={BarChart}
        title="No links with activity found"
        description="Links with clicks will appear here once you start getting traffic"
      />
    ),
    resourceName: (plural) => `link${plural ? "s" : ""}`,
  });

  return (
    <Table
      {...tableProps}
      table={table}
    />
  );
}
