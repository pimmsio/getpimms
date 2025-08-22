"use client";

import { calculateCustomerHotness } from "@/lib/analytics/calculate-hotness";
import {
  editQueryString,
  getBestDomainForLogo,
  getReferrerDisplayName,
} from "@/lib/analytics/utils";
import useCustomersCount from "@/lib/swr/use-customers-count";
import useListIntegrations from "@/lib/swr/use-list-integrations";
import useWorkspace from "@/lib/swr/use-workspace";
import { ClickEvent, LeadEvent, SaleEvent } from "@/lib/types";
import EmptyState from "@/ui/shared/empty-state";
import {
  LinkLogo,
  Table,
  Tooltip,
  usePagination,
  useRouterStuff,
  useTable,
} from "@dub/ui";
import { ArrowTurnRight2, Globe } from "@dub/ui/icons";
import {
  CONTINENTS,
  COUNTRIES,
  REGIONS,
  capitalize,
  cn,
  currencyFormatter,
  fetcher,
  getApexDomain,
  getPrettyUrl,
  timeAgo,
} from "@dub/utils";
import { Cell, ColumnDef } from "@tanstack/react-table";
import { IntegrationsCardsLight } from "app/app.dub.co/(dashboard)/[slug]/settings/integrations/integrations-cards-light";
import { Link2, Target } from "lucide-react";
import Link from "next/link";
import { ReactNode, useContext, useEffect, useMemo } from "react";
import useSWR from "swr";
import { AnalyticsContext } from "../analytics-provider";
import ContinentIcon from "../continent-icon";
import DeviceIcon from "../device-icon";
import EditColumnsButton from "./edit-columns-button";
import { EventsContext } from "./events-provider";
import { EXAMPLE_EVENTS_DATA } from "./example-data";
import FilterButton from "./filter-button";
import { RowMenuButton } from "./row-menu-button";
import { conversionColumns, useColumnVisibility } from "./use-column-visibility";

export type EventDatum = ClickEvent | LeadEvent | SaleEvent;

type ColumnMeta = {
  filterParams?: (
    args: Pick<Cell<EventDatum, any>, "getValue">,
  ) => Record<string, any>;
};

export default function EventsTable({
  requiresUpgrade,
  upgradeOverlay,
}: {
  requiresUpgrade?: boolean;
  upgradeOverlay?: ReactNode;
}) {
  const { slug, salesUsage } = useWorkspace();
  const { searchParams, queryParams } = useRouterStuff();
  const { setExportQueryString } = useContext(EventsContext);
  const {
    queryString: originalQueryString,
    eventsApiPath,
    totalEvents,
  } = useContext(AnalyticsContext);

  const tab = "leads"; // Always use leads to get both leads and sales

  const { columnVisibility, setColumnVisibility } = useColumnVisibility();

  const sortBy = searchParams.get("sortBy") || "timestamp";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const columns = useMemo<ColumnDef<EventDatum, any>[]>(
    () =>
      [
        // Hot level (first column)
        {
          id: "hot",
          header: "Hot",
          size: 80,
          minSize: 80,
          maxSize: 100,
          enableHiding: false,
          cell: ({ row }) => {
            const customer = row.original.customer;
            const totalClicks = customer.totalClicks || 0;
            const lastEventAt = customer.lastEventAt || row.original.timestamp;
            const heat = calculateCustomerHotness(totalClicks, lastEventAt); // 0-3

            const label = ["Cold", "Warm", "Hot", "Very hot"][heat] as string;
            const fillPct = (heat / 3) * 100; // proportional fill

            return (
              <div className="flex items-center justify-center" title={label}>
                <div className="h-2 w-10 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className={cn("h-full", heat === 0 ? "w-0" : "")}
                    style={{
                      width: `${fillPct}%`,
                      // Elegant gradient: emerald → amber → rose
                      background:
                        "linear-gradient(to right, #34d399, #f59e0b, #ef4444)",
                    }}
                  />
                </div>
              </div>
            );
          },
        },
        // Customer (second column)
        {
          id: "customer",
          header: "Contact",
          accessorKey: "customer",
          enableHiding: false,
          minSize: 200,
          size: 200,
          maxSize: 300,
          cell: ({ getValue }) => {
            const customer = getValue();
            const display = customer.name || customer.email || "Anonymous";
            const { slug } = useWorkspace();
            return (
              <Link
                href={`/${slug}/customers/${customer.id}`}
                className="flex w-full items-center gap-3 px-4 py-2 transition-colors hover:bg-neutral-50"
              >
                <img
                  alt={display}
                  src={
                    customer.avatar ||
                    `https://api.dicebear.com/7.x/micah/svg?seed=${customer.id}`
                  }
                  className="size-6 shrink-0 rounded-full border border-neutral-200"
                />
                <div className="min-w-0">
                  <div
                    className="truncate text-sm font-medium text-neutral-900"
                    title={display}
                  >
                    {customer.name || "Anonymous"}
                  </div>
                  {customer.email && customer.name && (
                    <div
                      className="truncate text-xs text-neutral-500"
                      title={customer.email}
                    >
                      {customer.email}
                    </div>
                  )}
                </div>
              </Link>
            );
          },
        },
        // Last conversion (merged event + date)
        {
          id: "lastEvent",
          header: "Last event",
          enableHiding: false,
          minSize: 140,
          size: 140,
          maxSize: 180,
          cell: ({ row }) => {
            const eventName = row.original.eventName || "Conversion";
            const timestamp = row.original.timestamp;
            return (
              <div className="flex flex-col gap-0.5">
                <div
                  className="truncate text-sm font-medium text-neutral-900"
                  title={eventName}
                >
                  {eventName}
                </div>
                <div className="text-xs text-neutral-500">
                  {timeAgo(new Date(timestamp))} ago
                </div>
              </div>
            );
          },
        },
        // Triggered link (with destination)
        {
          id: "triggeredLink",
          header: "Triggered by",
          accessorKey: "link",
          minSize: 280,
          size: 280,
          maxSize: 400,
          meta: {
            filterParams: ({ getValue }) => ({
              domain: getValue().domain,
              key: getValue().key,
            }),
          },
          cell: ({ getValue }) => {
            const link = getValue();
            return (
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-100 bg-gradient-to-t from-neutral-100">
                  <LinkLogo
                    apexDomain={getApexDomain(link.shortLink)}
                    className="!size-6 !rounded-full object-cover"
                    imageProps={{
                      style: { borderRadius: "50%" },
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={link.shortLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm font-semibold text-neutral-800 hover:text-black hover:underline"
                      title={link.shortLink}
                    >
                      {getPrettyUrl(link.shortLink)}
                    </a>
                  </div>
                  {link.url && (
                    <div className="mt-0.5 flex items-center gap-1">
                      <ArrowTurnRight2 className="h-3 w-3 shrink-0 text-neutral-400" />
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-xs text-neutral-500 hover:text-neutral-700 hover:underline hover:underline-offset-2"
                        title={link.url}
                      >
                        {getPrettyUrl(link.url)}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          },
        },
        {
          id: "country",
          header: "Country",
          accessorKey: "click.country",
          meta: {
            filterParams: ({ getValue }) => ({ country: getValue() }),
          },
          cell: ({ getValue }) => (
            <div
              className="flex items-center gap-3"
              title={COUNTRIES[getValue()] ?? getValue()}
            >
              {getValue() === "Unknown" ? (
                <Globe className="size-4 shrink-0" />
              ) : (
                <img
                  alt={getValue()}
                  src={`https://hatscripts.github.io/circle-flags/flags/${getValue().toLowerCase()}.svg`}
                  className="size-4 shrink-0"
                />
              )}
              <span className="truncate">
                {COUNTRIES[getValue()] ?? getValue()}
              </span>
            </div>
          ),
        },
        {
          id: "city",
          header: "City",
          accessorKey: "click.city",
          meta: {
            filterParams: ({ getValue }) => ({ city: getValue() }),
          },
          minSize: 160,
          cell: ({ getValue, row }) => (
            <div className="flex items-center gap-3" title={getValue()}>
              {!row.original.country || row.original.country === "Unknown" ? (
                <Globe className="size-4 shrink-0" />
              ) : (
                <img
                  alt={row.original.country}
                  src={`https://hatscripts.github.io/circle-flags/flags/${row.original.country.toLowerCase()}.svg`}
                  className="size-4 shrink-0"
                />
              )}
              <span className="truncate">{getValue()}</span>
            </div>
          ),
        },
        {
          id: "region",
          header: "Region",
          accessorKey: "click.region",
          meta: {
            filterParams: ({ getValue }) => ({ region: getValue() }),
          },
          minSize: 160,
          cell: ({ getValue, row }) => (
            <div className="flex items-center gap-3" title={getValue()}>
              {!row.original.country || row.original.country === "Unknown" ? (
                <Globe className="size-4 shrink-0" />
              ) : (
                <img
                  alt={row.original.country}
                  src={`https://hatscripts.github.io/circle-flags/flags/${row.original.country.toLowerCase()}.svg`}
                  className="size-4 shrink-0"
                />
              )}
              <span className="truncate">
                {REGIONS[getValue()] || getValue().split("-")[1]}
              </span>
            </div>
          ),
        },
        {
          id: "continent",
          header: "Continent",
          accessorKey: "click.continent",
          meta: {
            filterParams: ({ getValue }) => ({ continent: getValue() }),
          },
          cell: ({ getValue }) => (
            <div
              className="flex items-center gap-3"
              title={CONTINENTS[getValue()] ?? "Unknown"}
            >
              <ContinentIcon display={getValue()} className="size-4 shrink-0" />
              <span className="truncate">
                {CONTINENTS[getValue()] ?? "Unknown"}
              </span>
            </div>
          ),
        },
        {
          id: "device",
          header: "Device",
          accessorKey: "click.device",
          meta: {
            filterParams: ({ getValue }) => ({ device: getValue() }),
          },
          cell: ({ getValue }) => (
            <div className="flex items-center gap-3" title={getValue()}>
              <DeviceIcon
                display={capitalize(getValue()) ?? getValue()}
                tab="devices"
                className="size-4 shrink-0"
              />
              <span className="truncate">{getValue()}</span>
            </div>
          ),
        },
        {
          id: "browser",
          header: "Browser",
          accessorKey: "click.browser",
          cell: ({ getValue }) => (
            <div className="flex items-center gap-3" title={getValue()}>
              <DeviceIcon
                display={capitalize(getValue()) ?? getValue()}
                tab="browsers"
                className="size-4 shrink-0 rounded-full"
              />
              <span className="truncate">{getValue()}</span>
            </div>
          ),
        },
        {
          id: "os",
          header: "OS",
          accessorKey: "click.os",
          cell: ({ getValue }) => (
            <div className="flex items-center gap-3" title={getValue()}>
              <DeviceIcon
                display={capitalize(getValue()) ?? getValue()}
                tab="os"
                className="size-4 shrink-0"
              />
              <span className="truncate">{getValue()}</span>
            </div>
          ),
        },
        {
          id: "referer",
          header: "Referer",
          accessorKey: "click.referer",
          meta: {
            filterParams: ({ getValue }) => ({ referer: getValue() }),
          },
          cell: ({ getValue }) => (
            <div className="flex items-center gap-3" title={getValue()}>
              {getValue() === "(direct)" ? (
                <Link2 className="h-4 w-4" />
              ) : (
                <LinkLogo
                  apexDomain={getBestDomainForLogo(
                    getReferrerDisplayName(getValue()),
                  )}
                  className="size-4 shrink-0 sm:size-4"
                />
              )}
              <span className="truncate">
                {getReferrerDisplayName(getValue())}
              </span>
            </div>
          ),
        },
        // {
        //   id: "refererUrl",
        //   header: "Referrer URL",
        //   accessorKey: "click.refererUrl",
        //   meta: {
        //     filterParams: ({ getValue }) => ({ refererUrl: getValue() }),
        //   },
        //   cell: ({ getValue }) => (
        //     <div className="flex items-center gap-3">
        //       {getValue() === "(direct)" ? (
        //         <Link2 className="h-4 w-4" />
        //       ) : (
        //         <LinkLogo
        //           apexDomain={getApexDomain(getValue())}
        //           className="size-4 shrink-0 sm:size-4"
        //         />
        //       )}
        //       <CopyText
        //         value={getValue()}
        //         successMessage="Copied referrer URL to clipboard!"
        //       >
        //         <span className="truncate" title={getValue()}>
        //           {getPrettyUrl(getValue())}
        //         </span>
        //       </CopyText>
        //     </div>
        //   ),
        // },
        // {
        //   id: "ip",
        //   header: "IP Address",
        //   accessorKey: "click.ip",
        //   cell: ({ getValue }) =>
        //     getValue() ? (
        //       <span className="truncate" title={getValue()}>
        //         {getValue()}
        //       </span>
        //     ) : (
        //       <Tooltip content={<div onClick={(e) => e.stopPropagation()}>We do not record IP addresses for EU users.</div>}>
        //         <span className="cursor-default truncate underline decoration-dotted">
        //           Unknown
        //         </span>
        //       </Tooltip>
        //     ),
        // },
        // Sale Amount (event + total customer)
        {
          id: "saleAmount",
          header: "Sale Amount",
          minSize: 120,
          size: 120,
          maxSize: 140,
          cell: ({ row }) => {
            const event = row.original;
            const eventAmount = event.sale?.amount || 0;
            const totalCustomerSales = 0; // TODO: Get actual total customer sales

            return (
              <div className="text-right">
                <div
                  className={cn(
                    "text-sm font-medium",
                    eventAmount > 0 ? "text-green-700" : "text-neutral-500",
                  )}
                >
                  {currencyFormatter(eventAmount / 100, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-xs text-neutral-400">
                  Total:{" "}
                  {currencyFormatter(totalCustomerSales / 100, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            );
          },
        },
        // Sale invoice ID
        {
          id: "invoiceId",
          header: "Invoice ID",
          accessorKey: "sale.invoiceId",
          maxSize: 200,
          cell: ({ getValue }) =>
            getValue() ? (
              <span className="truncate" title={getValue()}>
                {getValue()}
              </span>
            ) : (
              <span className="text-neutral-400">-</span>
            ),
        },
        // Date
        {
          id: "timestamp",
          header: "Date",
          accessorFn: (d: { timestamp: string }) => new Date(d.timestamp),
          enableHiding: false,
          minSize: 100,
          cell: ({ getValue }) => (
            <Tooltip
              content={
                <div onClick={(e) => e.stopPropagation()}>
                  {getValue().toLocaleTimeString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                    second: "numeric",
                    hour12: true,
                  })}
                </div>
              }
            >
              <div className="w-full truncate">
                {getValue().toLocaleTimeString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                })}
              </div>
            </Tooltip>
          ),
        },
        // Menu
        {
          id: "menu",
          enableHiding: false,
          minSize: 43,
          size: 43,
          maxSize: 43,
          header: ({ table }) => <EditColumnsButton table={table} />,
          cell: ({ row }) => <RowMenuButton row={row} />,
        },
      ]
        .filter(
          (c) =>
            c.id === "menu" ||
            (conversionColumns.all as readonly string[]).includes(c.id),
        )
        .map((col) => ({
          ...col,
          enableResizing: true,
          size: col.size || Math.max(200, col.minSize || 100),
          minSize: col.minSize || 100,
          maxSize: col.maxSize || 1000,
        })),
    [tab],
  );

  const { pagination, setPagination } = usePagination();

  const queryString = useMemo(
    () =>
      editQueryString(originalQueryString, {
        event: tab,
        page: pagination.pageIndex.toString(),
        sortBy,
        sortOrder,
      }).toString(),
    [originalQueryString, tab, pagination, sortBy, sortOrder],
  );

  // Update export query string
  useEffect(
    () =>
      setExportQueryString?.(
        editQueryString(
          queryString,
          {
            columns: Object.entries(columnVisibility)
              .filter(([, visible]) => visible)
              .map(([id]) => id)
              .join(","),
          },
          ["page"],
        ),
      ),
    [setExportQueryString, queryString, columnVisibility, tab],
  );

  const { data, isLoading, error } = useSWR<EventDatum[]>(
    !requiresUpgrade && `${eventsApiPath || "/api/events"}?${queryString}`,
    fetcher,
    {
      keepPreviousData: true,
    },
  );

  const { integrations, loading: integrationsLoading } = useListIntegrations();

  const { data: customersCount } = useCustomersCount();
  const hasNoCustomer = !customersCount || customersCount === 0;
  const hasNoSales = !salesUsage || salesUsage === 0;

  const isEmptyData = !data || data.length === 0;

  const demo = isEmptyData && hasNoCustomer;

  const showEmptyState = isEmptyData && !isLoading && !integrationsLoading;
  const showDemo = demo && !isLoading && !integrationsLoading;

  const { table, ...tableProps } = useTable({
    data: (showDemo
      ? EXAMPLE_EVENTS_DATA[tab]
      : showEmptyState || !data
        ? []
        : data) as EventDatum[],
    loading: isLoading,
    error: error && !requiresUpgrade ? "Failed to fetch events." : undefined,
    columns,
    enableColumnResizing: true,
    pagination,
    onPaginationChange: setPagination,
    rowCount: requiresUpgrade ? 0 : totalEvents?.[tab] ?? 0,
    columnVisibility: columnVisibility,
    onColumnVisibilityChange: (args) => setColumnVisibility(args),
    sortableColumns: ["timestamp"],
    sortBy,
    sortOrder,
    onSortChange: ({ sortBy, sortOrder }) =>
      queryParams({
        set: {
          ...(sortBy && { sortBy }),
          ...(sortOrder && { sortOrder }),
        },
      }),
    columnPinning: { right: ["menu"] },
    cellRight: (cell) => {
      const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
      return (
        meta?.filterParams && <FilterButton set={meta.filterParams(cell)} />
      );
    },
    tdClassName: (columnId) =>
      cn(
        columnId === "customer" ? "p-0" : "px-4 py-2",
        columnId === "saleAmount" ? "text-right" : "",
        columnId === "hot" ? "text-center" : "",
      ),
    emptyState: (
      <EmptyState
        icon={Target}
        title="No conversions recorded"
        description="Conversions will appear here when your links convert"
      />
    ),
    resourceName: (plural) => `event${plural ? "s" : ""}`,
  });

  return (
    <>
      <Table
        {...tableProps}
        table={table}
        scrollWrapperClassName={
          requiresUpgrade || showDemo ? "overflow-x-hidden" : undefined
        }
      >
        {showDemo && !isLoading && !integrationsLoading && !requiresUpgrade && (
          <>
            <div className="absolute inset-0 flex touch-pan-y flex-col items-center justify-center gap-6 bg-gradient-to-t from-[#fff_70%] to-[#fff6]">
              <EmptyState
                icon={Target}
                title="No events recorded"
                description="Leads and sales will appear here when your links convert. To get started, install an integration below or follow a guide."
              />
            </div>
          </>
        )}
        {requiresUpgrade && (
          <>
            <div className="absolute inset-0 flex touch-pan-y items-center justify-center bg-gradient-to-t from-[#fff_70%] to-[#fff6]">
              {upgradeOverlay}
            </div>
            <div className="h-[400px]" />
          </>
        )}
      </Table>
      {showDemo &&
        !isLoading &&
        !integrationsLoading &&
        !requiresUpgrade &&
        integrations && (
          <div className="mt-4 rounded border border-neutral-100 py-4">
            <IntegrationsCardsLight
              integrations={integrations}
              integrationsToShow={undefined}
            />
          </div>
        )}
    </>
  );
}
