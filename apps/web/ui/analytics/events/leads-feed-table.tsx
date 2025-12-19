"use client";

import { editQueryString, getReferrerDisplayName } from "@/lib/analytics/utils";
import useWorkspace from "@/lib/swr/use-workspace";
import { TableHeader } from "@/ui/shared/table-header";
import { 
  TABLE_HEADER_CLASS,
  TABLE_CONTAINER_CLASS,
  TABLE_CLASS,
} from "@/ui/shared/table-styles";
import { AppButton, AppButtonLink } from "@/ui/components/controls/app-button";
import {
  Table,
  Tooltip,
  usePagination,
  useRouterStuff,
  useTable,
} from "@dub/ui";
import { Globe } from "@dub/ui/icons";
import { cn, COUNTRIES, fetcher, formatDate, OG_AVATAR_URL, timeAgo } from "@dub/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, ClipboardCopy, Download, Flame } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { AnalyticsContext } from "../analytics-provider";
import { getHotScoreLabel, SingleFlameIcon } from "./hot-score-icons";
import {
  copyLeadsForGoogleSheets,
  downloadLeadsAsCSV,
} from "./leads-export";
import { LinksRowSkeleton } from "@/ui/shared/links-row";
import { AnonymousVisitorsTeaser } from "@/ui/conversions/anonymous-visitors-teaser";


type LeadLink = {
  id: string;
  domain: string;
  key: string;
  url: string;
  shortLink: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  tags: { id: string; name: string; color: string }[];
};

type LeadsFeedCustomer = {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  hotScore: number;
  lastHotScoreAt: string | null;
  lastEventAt: string | null;
  lastActivityType: "click" | "lead" | "sale" | null;
  totalClicks: number;
  createdAt: string | null;
  link: LeadLink | null;
  lastActivityLink?: LeadLink | null;
  country?: string | null;
  referer?: string | null;
  __skeleton?: true;
};

type LeadsFeedResponse = {
  total: number;
  customers: LeadsFeedCustomer[];
};

export default function LeadsFeedTable() {
  const { searchParams } = useRouterStuff();
  const { queryString: originalQueryString } = useContext(AnalyticsContext);
  const { slug, id: workspaceId } = useWorkspace();
  const router = useRouter();

  const hotOnly = searchParams.get("hotOnly") === "1";
  const selectedHotScores = useMemo(
    () => searchParams.get("hotScore")?.split(",")?.filter(Boolean) ?? [],
    [searchParams.get("hotScore")],
  );
  // Check if filtering for warm + hot
  const hasWarmHotFilter = hotOnly || 
    (selectedHotScores.includes("warm") && selectedHotScores.includes("hot"));

  const { pagination, setPagination } = usePagination();

  const queryString = useMemo(
    () =>
      editQueryString(originalQueryString, {
        // keep pagination in sync with existing events behavior
        ...(workspaceId && { workspaceId }),
        page: pagination.pageIndex.toString(),
        limit: hasWarmHotFilter ? "100" : "50",
        hotOnly: hotOnly ? "1" : "0",
        ...(selectedHotScores.length > 0 && { hotScore: selectedHotScores.join(",") }),
      }).toString(),
    [originalQueryString, workspaceId, pagination.pageIndex, hotOnly, selectedHotScores, hasWarmHotFilter],
  );

  const { data, isLoading, error } = useSWR<LeadsFeedResponse>(
    `/api/customers/leads-feed?${queryString}`,
    fetcher,
    { keepPreviousData: true },
  );

  const customers = data?.customers ?? [];
  const skeletonRows = useMemo<LeadsFeedCustomer[]>(
    () =>
      Array.from({ length: 8 }).map((_, idx) => ({
        id: `skeleton-${idx}`,
        name: null,
        email: null,
        avatar: null,
        hotScore: 0,
        lastHotScoreAt: null,
        lastEventAt: null,
        lastActivityType: null,
        totalClicks: 0,
        createdAt: null,
        link: null,
        lastActivityLink: null,
        __skeleton: true as const,
      })),
    [],
  );
  const showSkeleton = isLoading && customers.length === 0;
  const rows = showSkeleton ? skeletonRows : customers;

  const [copying, setCopying] = useState(false);

  const columns = useMemo<ColumnDef<LeadsFeedCustomer, unknown>[]>(
    () => [
      {
        id: "hotScore",
        header: () => <TableHeader>Score</TableHeader>,
        accessorKey: "hotScore",
        enableHiding: false,
        minSize: 60,
        size: 60,
        maxSize: 80,
        cell: ({ row }) => {
          if (row.original.__skeleton) {
            return (
              <div className="flex w-full items-center justify-center">
                <div className="h-6 w-14 animate-pulse rounded bg-neutral-200" />
              </div>
            );
          }
          const score = row.original.hotScore ?? 0;
          const lastUpdated = row.original.lastHotScoreAt;
          const label = getHotScoreLabel(score);
          return (
            <Tooltip
              content={
                <div className="max-w-xs px-4 py-2 text-left text-sm text-neutral-600">
                  <div className="text-sm text-neutral-800">
                    {label} ({score}/100)
                  </div>
                  <div className="text-xs text-neutral-400">
                    {lastUpdated
                      ? `Updated ${timeAgo(new Date(lastUpdated), { withAgo: true })}`
                      : "Not computed yet"}
                  </div>
                </div>
              }
            >
              <div className="flex w-full items-center justify-center gap-2">
                <SingleFlameIcon className="h-5 w-5" score={score} />
                <span className="text-xs font-semibold tabular-nums text-neutral-900">
                  {score}
                </span>
              </div>
            </Tooltip>
          );
        },
      },
      {
        id: "customer",
        header: () => <TableHeader>Contact</TableHeader>,
        enableHiding: false,
        minSize: 260,
        size: 300,
        cell: ({ row }) => {
          if (row.original.__skeleton) {
            return (
              <div className="px-2 py-1.5 sm:px-5 sm:py-3">
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="size-10 shrink-0 animate-pulse rounded-full bg-neutral-200" />
                    <div className="min-w-0 flex-1">
                      <div className="h-4 w-36 animate-pulse rounded bg-neutral-200" />
                      <div className="mt-1 h-3 w-44 animate-pulse rounded bg-neutral-200/70" />
                    </div>
                  </div>
                  <div className="h-4 w-12 shrink-0 animate-pulse rounded bg-neutral-200/70" />
                </div>
              </div>
            );
          }
          const c = row.original;
          const display = c.name || c.email || "Anonymous";
          return (
            <div className="flex w-full items-center justify-between gap-4 px-2 py-1.5 sm:px-5 sm:py-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <img
                  alt={display}
                  src={
                    c.avatar ||
                    `${OG_AVATAR_URL}${c.id}&name=${encodeURIComponent(c.name || c.email || "")}`
                  }
                  className="size-10 shrink-0 rounded-full"
                />
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-sm font-medium text-neutral-900"
                    title={display}
                  >
                    {c.name || "Anonymous"}
                  </div>
                  {c.email && c.name && (
                    <div className="truncate text-xs text-neutral-500" title={c.email}>
                      {c.email}
                    </div>
                  )}
                </div>
              </div>
              <Link
                href={`/${slug}/customers/${c.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex shrink-0 items-center gap-1 pr-1 text-xs font-medium text-blue-600 transition-transform group-hover:translate-x-1 whitespace-nowrap"
              >
                <span>View</span>
                <ChevronRight className="size-3" />
              </Link>
            </div>
          );
        },
      },
      {
        id: "lastActivity",
        header: () => <TableHeader>Last Activity</TableHeader>,
        enableHiding: false,
        minSize: 120,
        size: 140,
        maxSize: 160,
        cell: ({ row }) => {
          if (row.original.__skeleton) {
            return (
              <div className="flex flex-col gap-1">
                <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
                <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
              </div>
            );
          }
          const kind = row.original.lastActivityType;
          const ts = row.original.lastEventAt;

          const label =
            kind === "click" ? "Click" : kind === "lead" ? "Opt-in" : kind === "sale" ? "Sale" : null;

          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                {label ? (
                  <span className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-700">
                    {label}
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-neutral-500">
                {ts ? timeAgo(new Date(ts), { withAgo: true }) : "-"}
              </div>
            </div>
          );
        },
      },
      {
        id: "touchpoints",
        header: () => <TableHeader>Touchpoints</TableHeader>,
        accessorKey: "totalClicks",
        enableHiding: true,
        minSize: 120,
        size: 120,
        cell: ({ row }) => {
          if (row.original.__skeleton) {
            return (
              <div className="h-4 w-12 animate-pulse rounded bg-neutral-200" />
            );
          }
          const touchpoints = row.original.totalClicks;
          const customerId = row.original.id;
          // Only show if we have the data
          if (touchpoints === undefined || touchpoints === null) {
            return <span className="text-neutral-400">-</span>;
          }
          return (
            <div className="flex items-center justify-end gap-2">
              <div className="text-xs font-medium text-neutral-700">
                {touchpoints}
              </div>
              <Link
                href={`/${slug}/customers/${customerId}`}
                onClick={(e) => e.stopPropagation()}
                className="flex shrink-0 items-center gap-1 pr-1 text-xs font-medium text-blue-600 transition-transform group-hover:translate-x-1 whitespace-nowrap"
              >
                <span>See timeline</span>
                <ChevronRight className="size-3" />
              </Link>
            </div>
          );
        },
      },
      {
        id: "country",
        header: () => <TableHeader>Country</TableHeader>,
        enableHiding: true,
        minSize: 100,
        size: 100,
        maxSize: 120,
        cell: ({ row }) => {
          if (row.original.__skeleton) {
            return (
              <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
            );
          }
          const country = row.original.country;
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
        id: "referer",
        header: () => <TableHeader>Referer</TableHeader>,
        enableHiding: true,
        minSize: 100,
        size: 100,
        maxSize: 120,
        cell: ({ row }) => {
          if (row.original.__skeleton) {
            return (
              <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
            );
          }
          const referer = row.original.referer;
          if (!referer) {
            return <span className="text-neutral-400">-</span>;
          }
          return (
            <div className="text-xs text-neutral-700 truncate" title={referer}>
              {getReferrerDisplayName(referer) || referer}
            </div>
          );
        },
      },
      {
        id: "created",
        header: () => <TableHeader>Created</TableHeader>,
        accessorKey: "createdAt",
        enableHiding: true,
        minSize: 80,
        size: 80,
        maxSize: 100,
        cell: ({ row }) => {
          if (row.original.__skeleton) {
            return (
              <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
            );
          }
          const createdAt = row.original.createdAt;
          // Only show if we have the data
          if (!createdAt) {
            return <span className="text-xs text-neutral-400">-</span>;
          }
          return (
            <div className="text-xs text-neutral-700">
              {formatDate(createdAt, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          );
        },
      },
    ],
    [],
  );

  const { table, ...tableProps } = useTable({
    data: rows,
    loading: false,
    error: error ? "Failed to fetch leads feed." : undefined,
    columns,
    enableColumnResizing: true,
    pagination: hasWarmHotFilter ? undefined : pagination,
    onPaginationChange: hasWarmHotFilter ? undefined : setPagination,
    rowCount: hasWarmHotFilter ? customers.length : data?.total ?? customers.length,
    onRowClick: (row) => {
      if (row.original.__skeleton) return;
      router.push(`/${slug}/customers/${row.original.id}`);
    },
    containerClassName: TABLE_CONTAINER_CLASS,
    scrollWrapperClassName: TABLE_CONTAINER_CLASS,
    className: TABLE_CLASS,
    thClassName: () => cn(TABLE_HEADER_CLASS, "border-b-0"),
    tdClassName: (columnId) =>
      cn(
        "bg-white transition-colors hover:bg-neutral-50/50 border-b border-neutral-100",
        !showSkeleton && "cursor-pointer",
        columnId === "customer" ? "p-0" : "px-3 py-1.5",
      ),
    emptyState: (
      <div className="px-4 py-6 sm:px-6">
        <div className="max-w-2xl text-left">
          <div className="text-sm font-semibold text-neutral-900">
            {hasWarmHotFilter ? "No warm/hot leads yet" : "No leads yet"}
          </div>
          <div className="mt-1 text-sm text-neutral-600">
            Without conversion tracking, visitors stay anonymous. Set it up to turn clicks into leads and sales.
          </div>
          <AppButtonLink
            href={`/${slug}/conversions?ctSetup=1`}
            variant="primary"
            size="sm"
            className="mt-3 w-fit"
          >
            Reveal leads
          </AppButtonLink>
          <AnonymousVisitorsTeaser variant="plain" className="mt-3" />
        </div>
      </div>
    ),
    resourceName: (plural) => `lead${plural ? "s" : ""}`,
  });

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div />
        </div>

        <div className="flex items-center gap-2">
          <AppButton
            type="button"
            variant="secondary"
            size="sm"
            className="w-auto"
            disabled={customers.length === 0 || copying}
            onClick={async () => {
              try {
                setCopying(true);
                await copyLeadsForGoogleSheets(customers);
                toast.success("Copied — paste into Google Sheets");
              } catch {
                toast.error("Copy failed. Please try again.");
              } finally {
                setCopying(false);
              }
            }}
          >
            <ClipboardCopy className="mr-2 h-4 w-4 text-neutral-500" />
            Copy (Sheets)
          </AppButton>
          <AppButton
            type="button"
            variant="secondary"
            size="sm"
            className="w-auto"
            disabled={customers.length === 0}
            onClick={() => downloadLeadsAsCSV(customers)}
          >
            <Download className="mr-2 h-4 w-4 text-neutral-500" />
            Download CSV
          </AppButton>
        </div>
      </div>

      <Table {...tableProps} table={table} />
    </>
  );
}

