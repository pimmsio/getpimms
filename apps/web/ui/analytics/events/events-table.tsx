"use client";

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
import { LinksRow, LinksRowSkeleton } from "@/ui/shared/links-row";
import {
  LinkLogo,
  Table,
  Tooltip,
  usePagination,
  useRouterStuff,
  useTable,
} from "@dub/ui";
import { Globe } from "@dub/ui/icons";
import {
  capitalize,
  cn,
  CONTINENTS,
  COUNTRIES,
  currencyFormatter,
  fetcher,
  formatDate,
  OG_AVATAR_URL,
  REGIONS,
  timeAgo,
} from "@dub/utils";
import { Cell, ColumnDef } from "@tanstack/react-table";
import { IntegrationsCardsLight } from "app/app.dub.co/(dashboard)/[slug]/settings/integrations/integrations-cards-light";
import { ChevronRight, Link2, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useContext, useEffect, useMemo } from "react";
import useSWR from "swr";
import { AnalyticsContext } from "../analytics-provider";
import ContinentIcon from "../continent-icon";
import DeviceIcon from "../device-icon";
import EditColumnsButton from "./edit-columns-button";
import { EventsContext } from "./events-provider";
import { EXAMPLE_EVENTS_DATA } from "./example-data";
import FilterButton from "./filter-button";
import { getHotScoreLabel, SingleFlameIcon } from "./hot-score-icons";
import { RowMenuButton } from "./row-menu-button";
import {
  conversionColumns,
  useColumnVisibility,
} from "./use-column-visibility";

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
  const { searchParams, queryParams } = useRouterStuff();
  const { setExportQueryString } = useContext(EventsContext);
  const { queryString: originalQueryString, eventsApiPath } =
    useContext(AnalyticsContext);
  const { slug } = useWorkspace();
  const router = useRouter();

  // Get hotScore filter from URL params
  const hotScoreFilter = searchParams.get("hotScore")?.split(",").filter(Boolean) ?? [];

  const { columnVisibility, setColumnVisibility } = useColumnVisibility();

  const sortBy = searchParams.get("sortBy") || "timestamp";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const skeletonRows = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, idx) => ({
        __skeleton: true as const,
        event: "lead",
        timestamp: new Date().toISOString(),
        eventName: "Lead",
        customer: {
          __skeleton: true as const,
          id: `s-${idx}`,
          name: null,
          email: null,
          avatar: null,
          hotScore: 0,
          lastHotScoreAt: null,
        },
        click: {
          country: "US",
          city: "—",
          region: "—",
          continent: "NA",
          device: "Desktop",
          browser: "Chrome",
          os: "macOS",
          referer: "(direct)",
          refererUrl: "(direct)",
        },
        link: {
          __skeleton: true as const,
          domain: "pim.ms",
          key: "—",
          url: "https://example.com",
          tags: [],
        },
        sale: { amount: 0, invoiceId: "" },
      })) as any[],
    [],
  );

  const columns = useMemo<ColumnDef<EventDatum, any>[]>(
    () =>
      [
        // Hot Score (first column)
        {
          id: "hotScore",
          header: () => (
            <Tooltip
              content={
                <div className="max-w-xs px-2 py-1 text-left text-sm text-neutral-600">
                  <div className="font-semibold text-neutral-800 mb-1">Hot Score</div>
                  <div className="text-xs">
                    Lead hotness score (0-100) based on click engagement, velocity, activity streaks, and conversions.
                  </div>
                  <div className="text-xs mt-2">
                    <div>Cold (0-33): Low engagement</div>
                    <div>Warm (34-66): Moderate engagement</div>
                    <div>Hot (67-100): High engagement</div>
                  </div>
                </div>
              }
            >
              <span>Score</span>
            </Tooltip>
          ),
          accessorKey: "customer",
          enableHiding: false,
          minSize: 90,
          size: 90,
          maxSize: 120,
          cell: ({ getValue }) => {
            const customer = getValue();
            if ((customer as any)?.__skeleton) {
              return (
                <div className="flex w-full items-center justify-center">
                  <div className="h-6 w-14 animate-pulse rounded bg-neutral-200" />
                </div>
              );
            }
            const hotScore = customer.hotScore ?? 0;
            const lastUpdated = customer.lastHotScoreAt;
            const scoreLabel = getHotScoreLabel(hotScore);
            const scoreLabelLower = scoreLabel.toLowerCase();

            // Get absolutely fresh filter state on each render - use hook directly
            const { searchParams: freshSearchParams } = useRouterStuff();
            const currentHotScoreFilter = freshSearchParams.get("hotScore")?.split(",").filter(Boolean) ?? [];

            const handleScoreClick = (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              
              const isSelected = currentHotScoreFilter.includes(scoreLabelLower);
              
              if (isSelected) {
                // Remove the filter if it's already selected
                const newFilters = currentHotScoreFilter.filter(f => f !== scoreLabelLower);
                if (newFilters.length > 0) {
                  queryParams({
                    set: { hotScore: newFilters.join(",") },
                  });
                } else {
                  queryParams({
                    del: ["hotScore"],
                  });
                }
              } else {
                // Add the filter
                const newFilters = [...currentHotScoreFilter, scoreLabelLower];
                queryParams({
                  set: { hotScore: newFilters.join(",") },
                });
              }
            };

            const isSelected = currentHotScoreFilter.includes(scoreLabelLower);

            return (
              <Tooltip
                content={
                  <div className="max-w-xs px-4 py-2 text-left text-sm text-neutral-600">
                    <div className="mt-1">
                      <div className="text-sm text-neutral-800">
                        {scoreLabel} ({hotScore}/100)
                      </div>
                      <div className="text-xs text-neutral-400">
                        {lastUpdated
                          ? `Updated ${timeAgo(new Date(lastUpdated), { withAgo: true })}`
                          : "Not computed yet"}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Click to {isSelected ? "remove" : "add"} filter
                      </div>
                    </div>
                  </div>
                }
              >
                <div 
                  className={cn(
                    "flex w-full justify-center cursor-pointer rounded-lg p-2 transition-all",
                    "hover:bg-neutral-100",
                    isSelected && "bg-blue-50 ring-1 ring-blue-200"
                  )}
                  onClick={handleScoreClick}
                >
                  <div className="flex items-center gap-1.5">
                    <SingleFlameIcon className="w-5 h-5" score={hotScore} />
                    <span className="text-sm font-bold tabular-nums text-neutral-900">
                      {hotScore}
                    </span>
                  </div>
                </div>
              </Tooltip>
            );
          },
        },

        // Customer (second column)
        {
          id: "customer",
          header: "Contact",
          accessorKey: "customer",
          enableHiding: false,
          minSize: 250,
          size: 280,
          maxSize: 400,
          cell: ({ getValue }) => {
            const customer = getValue();
            if ((customer as any)?.__skeleton) {
              return (
                <div className="px-4 py-3">
                  <div className="flex w-full items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="size-9 shrink-0 animate-pulse rounded-full bg-neutral-200" />
                      <div className="min-w-0 flex-1">
                        <div className="h-4 w-36 animate-pulse rounded bg-neutral-200" />
                        <div className="mt-1 h-3 w-44 animate-pulse rounded bg-neutral-200/70" />
                      </div>
                    </div>
                    <div className="size-4 shrink-0 animate-pulse rounded bg-neutral-200/70" />
                  </div>
                </div>
              );
            }
            const display = customer.name || customer.email || "Anonymous";
            return (
              <div className="flex w-full items-center justify-between gap-4 px-4 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <img
                    alt={display}
                    src={
                      customer.avatar ||
                      `${OG_AVATAR_URL}${customer.id}&name=${encodeURIComponent(customer.name || customer.email || "")}`
                    }
                    className="size-9 shrink-0 rounded-full bg-neutral-50"
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-sm font-semibold text-neutral-900"
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
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs font-medium text-neutral-400 transition-colors group-hover:text-blue-600">
                  <ChevronRight className="size-4" />
                </div>
              </div>
            );
          },
        },
        // Last conversion (merged event + date)
        {
          id: "lastEvent",
          header: () => (
            <Tooltip
              content={
                <div className="max-w-xs px-2 py-1 text-left text-sm text-neutral-600">
                  Most recent conversion event (lead or sale) from this customer
                </div>
              }
            >
              <span>Last event</span>
            </Tooltip>
          ),
          enableHiding: false,
          minSize: 80,
          size: 90,
          maxSize: 120,
          cell: ({ row }) => {
            if ((row.original as any).__skeleton) {
              return (
                <div className="flex flex-col gap-1">
                  <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
                  <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
                </div>
              );
            }
            const eventName = row.original.eventName || "Conversion";
            const timestamp = row.original.timestamp;
            return (
              <div className="flex flex-col gap-1">
                <div
                  className="truncate text-sm font-semibold text-neutral-900"
                  title={eventName}
                >
                  {eventName}
                </div>
                <div className="text-xs text-neutral-500">
                  {timeAgo(new Date(timestamp), { withAgo: true })}
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
            if ((link as any)?.__skeleton) {
              return (
                <div className="px-4 py-3">
                  <LinksRowSkeleton showMetrics={false} />
                </div>
              );
            }
            return (
              <div className="px-4 py-3">
                <LinksRow
                  link={{
                    domain: link.domain,
                    key: link.key,
                    url: link.url,
                    utm_source: link.utm_source,
                    utm_medium: link.utm_medium,
                    utm_campaign: link.utm_campaign,
                    utm_term: link.utm_term,
                    utm_content: link.utm_content,
                  }}
                  tags={link.tags}
                />
              </div>
            );
          },
        },
        {
          id: "touchpoints",
          header: () => (
            <Tooltip
              content={
                <div className="max-w-xs px-2 py-1 text-left text-sm text-neutral-600">
                  Total number of times this customer has clicked on your links
                </div>
              }
            >
              <span>Touchpoints</span>
            </Tooltip>
          ),
          accessorKey: "customer",
          enableHiding: true,
          minSize: 120,
          size: 140,
          maxSize: 160,
          cell: ({ getValue, row }) => {
            const customer = getValue();
            if ((customer as any)?.__skeleton) {
              return (
                <div className="h-4 w-12 animate-pulse rounded bg-neutral-200" />
              );
            }
            // Only show if we have the data
            const touchpoints = (customer as any)?.totalClicks;
            const customerId = customer?.id;
            if (touchpoints === undefined || touchpoints === null) {
              return <span className="text-neutral-400">-</span>;
            }
            return (
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-neutral-700">
                  {touchpoints}
                </div>
                {customerId && (row.original as any).event !== "click" && (
                  <Link
                    href={`/${slug}/customers/${customerId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex shrink-0 items-center gap-1.5 pr-1 text-sm font-medium text-blue-600 transition-transform group-hover:translate-x-1 whitespace-nowrap"
                  >
                    <span>See timeline</span>
                    <ChevronRight className="size-4" />
                  </Link>
                )}
              </div>
            );
          },
        },
        {
          id: "customerCountry",
          header: "Country",
          accessorKey: "customer",
          enableHiding: true,
          minSize: 100,
          size: 100,
          maxSize: 120,
          meta: {
            filterParams: ({ getValue }) => {
              const customer = getValue();
              const country = (customer as any)?.country;
              return country ? { country } : {};
            },
          },
          cell: ({ getValue }) => {
            const customer = getValue();
            if ((customer as any)?.__skeleton) {
              return (
                <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
              );
            }
            const country = (customer as any)?.country;
            if (!country || country === "Unknown") {
              return (
                <div className="flex items-center gap-3">
                  <Globe className="size-4 shrink-0" />
                  <span className="truncate text-neutral-400">-</span>
                </div>
              );
            }
            return (
              <div
                className="flex items-center gap-3"
                title={COUNTRIES[country] ?? country}
              >
                <img
                  alt={country}
                  src={`https://hatscripts.github.io/circle-flags/flags/${country.toLowerCase()}.svg`}
                  className="size-4 shrink-0"
                />
                <span className="truncate text-xs">
                  {COUNTRIES[country] ?? country}
                </span>
              </div>
            );
          },
        },
        {
          id: "created",
          header: "Created",
          accessorKey: "customer",
          enableHiding: true,
          minSize: 120,
          size: 120,
          maxSize: 150,
          cell: ({ getValue }) => {
            const customer = getValue();
            if ((customer as any)?.__skeleton) {
              return (
                <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
              );
            }
            // Try to get createdAt from customer, fallback to event timestamp
            const createdAt = (customer as any)?.createdAt;
            if (!createdAt) {
              // Fallback to event timestamp if customer createdAt not available
              return <span className="text-neutral-400">-</span>;
            }
            return (
              <div className="text-sm text-neutral-700">
                {formatDate(createdAt, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            );
          },
        },
        {
          id: "country",
          header: "Country",
          accessorKey: "click.country",
          minSize: 100,
          size: 100,
          maxSize: 120,
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
              <span className="truncate text-xs">
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
          minSize: 100,
          size: 100,
          maxSize: 120,
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
              <span className="truncate text-xs">
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
            if ((row.original as any).__skeleton) {
              return (
                <div className="flex justify-end">
                  <div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />
                </div>
              );
            }
            const event = row.original;
            const eventAmount = event.sale?.amount || 0;

            return (
              <div className="text-right">
                <div
                  className={cn(
                    "text-sm font-semibold",
                    eventAmount > 0 ? "text-green-700" : "text-neutral-400",
                  )}
                >
                  {eventAmount > 0
                    ? currencyFormatter(eventAmount / 100, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "-"}
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
          header: "Time",
          accessorFn: (d: { timestamp: string }) => new Date(d.timestamp),
          enableHiding: true,
          minSize: 100,
          cell: ({ row, getValue }) =>
            (row.original as any).__skeleton ? (
              <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
            ) : (
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
          cell: ({ row }) =>
            (row.original as any).__skeleton ? (
              <div className="h-8 w-8 animate-pulse rounded bg-neutral-200" />
            ) : (
              <RowMenuButton row={row} />
            ),
        },
      ]
        .filter(
          (c) => {
            return c.id === "menu" || (conversionColumns.all as readonly string[]).includes(c.id);
          },
        )
        .map((col) => {
          const finalSize = col.size || Math.max(200, col.minSize || 100);
          return {
            ...col,
            enableResizing: true,
            size: finalSize,
            minSize: col.minSize || 100,
            maxSize: col.maxSize || 1000,
          };
        }),
    [],
  );

  const { pagination, setPagination } = usePagination();

  const queryString = useMemo(
    () =>
      editQueryString(originalQueryString, {
        event: "leads",
        page: pagination.pageIndex.toString(),
        sortBy,
        sortOrder,
      }).toString(),
    [originalQueryString, pagination, sortBy, sortOrder],
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
    [setExportQueryString, queryString, columnVisibility],
  );

  const { data, isLoading, error } = useSWR<EventDatum[]>(
    !requiresUpgrade && `${eventsApiPath || "/api/events"}?${queryString}`,
    fetcher,
    {
      keepPreviousData: true,
    },
  );

  const { integrations, loading: integrationsLoading } = useListIntegrations();

  const { data: customersCount, isLoading: isCustomersLoading } =
    useCustomersCount();
  const hasNoCustomer = !customersCount || customersCount === 0;

  const isEmptyData = !data || data.length === 0;

  const demo = isEmptyData && hasNoCustomer && !isCustomersLoading;

  const showEmptyState = isEmptyData && !isLoading && !integrationsLoading;
  const showDemo = demo && !isLoading && !integrationsLoading;
  const showSkeleton = !requiresUpgrade && isLoading && (!data || data.length === 0);

  // Filter data based on hot score
  const filteredData = useMemo(() => {
    if (!data || hotScoreFilter.length === 0) {
      return data;
    }

    return data.filter((event) => {
      // ClickEvent doesn't have customer property, only LeadEvent and SaleEvent do
      if (event.event === "click") {
        return true; // Don't filter click events since they don't have customer data
      }
      
      const customer = (event as any).customer;
      const hotScore = customer?.hotScore ?? 0;
      const scoreLabel = getHotScoreLabel(hotScore).toLowerCase();
      return hotScoreFilter.includes(scoreLabel);
    });
  }, [data, hotScoreFilter]);

  const { table, ...tableProps } = useTable({
    data: (showSkeleton
      ? (skeletonRows as any)
      : showDemo
        ? EXAMPLE_EVENTS_DATA["leads"]
        : showEmptyState || !filteredData
          ? []
          : filteredData) as EventDatum[],
    loading: false,
    error: error && !requiresUpgrade ? "Failed to fetch events." : undefined,
    columns,
    enableColumnResizing: true,
    pagination,
    onPaginationChange: setPagination,
    rowCount: showSkeleton ? skeletonRows.length : requiresUpgrade ? 0 : filteredData?.length ?? 0,
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
    onRowClick: (row) => {
      if ((row.original as any).__skeleton) return;
      const event = row.original;
      if (event.event !== "click" && event.customer) {
        router.push(`/${slug}/customers/${event.customer.id}`);
      }
    },
    cellRight: (cell) => {
      const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
      return (
        meta?.filterParams && <FilterButton set={meta.filterParams(cell)} />
      );
    },
    tdClassName: (columnId) =>
      cn(
        "cursor-pointer transition-colors",
        columnId === "customer" ? "p-0" : "px-4 py-3",
        columnId === "saleAmount" || columnId === "created" ? "text-right" : "",
        columnId === "hotScore" ? "text-center" : "",
        "group-hover:bg-neutral-50/50",
      ),
    emptyState: (
      <EmptyState
        icon={Target}
        title="No leads recorded"
        description="Leads will appear here when your links convert"
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
            <div className="absolute inset-0 flex touch-pan-y flex-col items-center justify-center gap-6 bg-white/95">
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
            <div className="absolute inset-0 flex touch-pan-y items-center justify-center bg-white/95">
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
