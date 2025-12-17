"use client";

import { editQueryString } from "@/lib/analytics/utils";
import useWorkspace from "@/lib/swr/use-workspace";
import { LinkCell } from "@/ui/shared/link-cell";
import { UtmKey, UtmTagsRow } from "@/ui/shared/utm-tags-row";
import {
  Button,
  EmptyState,
  Table,
  Tooltip,
  usePagination,
  useRouterStuff,
  useTable,
} from "@dub/ui";
import { cn, fetcher, getParamsFromURL, nFormatter, OG_AVATAR_URL, timeAgo } from "@dub/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, ClipboardCopy, Download, Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { AnalyticsContext } from "../analytics-provider";
import { getHotScoreIcon, getHotScoreLabel } from "./hot-score-icons";
import {
  copyLeadsForGoogleSheets,
  downloadLeadsAsCSV,
} from "./leads-export";

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
  link: LeadLink | null;
  lastActivityLink?: LeadLink | null;
};

type LeadsFeedResponse = {
  total: number;
  customers: LeadsFeedCustomer[];
};

export default function LeadsFeedTable() {
  const { searchParams } = useRouterStuff();
  const { queryString: originalQueryString } = useContext(AnalyticsContext);
  const { slug } = useWorkspace();
  const router = useRouter();

  const hotOnly = searchParams.get("hotOnly") === "1";

  const { pagination, setPagination } = usePagination();

  const UTM_KEYS: UtmKey[] = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];

  const queryString = useMemo(
    () =>
      editQueryString(originalQueryString, {
        // keep pagination in sync with existing events behavior
        page: pagination.pageIndex.toString(),
        limit: hotOnly ? "100" : "50",
        hotOnly: hotOnly ? "1" : "0",
      }).toString(),
    [originalQueryString, pagination.pageIndex, hotOnly],
  );

  const { data, isLoading, error } = useSWR<LeadsFeedResponse>(
    `/api/customers/leads-feed?${queryString}`,
    fetcher,
    { keepPreviousData: true },
  );

  const customers = data?.customers ?? [];

  const [copying, setCopying] = useState(false);

  const utmVisibility = useMemo(() => {
    const visible: Record<UtmKey, boolean> = {
      utm_source: false,
      utm_medium: false,
      utm_campaign: false,
      utm_term: false,
      utm_content: false,
    };

    let showTagsColumn = false;

    for (const c of customers) {
      const l = c.lastActivityLink || c.link;
      if (!l) continue;

      if ((l.tags?.length || 0) > 0) showTagsColumn = true;

      const urlParams = l.url ? getParamsFromURL(l.url) : null;
      for (const key of UTM_KEYS) {
        const val = (l as any)?.[key] ?? (urlParams ? (urlParams as any)[key] : null);
        if (val) visible[key] = true;
      }
    }

    const visibleUtmKeys = UTM_KEYS.filter((k) => visible[k]);
    return { visibleUtmKeys, showTagsColumn };
  }, [customers]);

  const columns = useMemo<ColumnDef<LeadsFeedCustomer, unknown>[]>(
    () => [
      {
        id: "hotScore",
        header: "Score",
        accessorKey: "hotScore",
        enableHiding: false,
        minSize: 90,
        size: 90,
        cell: ({ row }) => {
          const score = row.original.hotScore ?? 0;
          const lastUpdated = row.original.lastHotScoreAt;
          const HotScoreIcon = getHotScoreIcon(score);
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
                <HotScoreIcon className="h-6 w-6" />
                <span className="text-sm font-semibold tabular-nums text-neutral-900">
                  {score}
                </span>
              </div>
            </Tooltip>
          );
        },
      },
      {
        id: "customer",
        header: "Contact",
        enableHiding: false,
        minSize: 260,
        size: 300,
        cell: ({ row }) => {
          const c = row.original;
          const display = c.name || c.email || "Anonymous";
          return (
            <div className="flex w-full items-center justify-between gap-4 px-4 py-3">
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
              <div className="flex shrink-0 items-center gap-1.5 pr-1 text-sm font-medium text-blue-600 transition-transform group-hover:translate-x-1">
                <span>View</span>
                <ChevronRight className="size-4" />
              </div>
            </div>
          );
        },
      },
      {
        id: "lastActivity",
        header: "Last activity",
        enableHiding: false,
        minSize: 220,
        size: 260,
        cell: ({ row }) => {
          const kind = row.original.lastActivityType;
          const ts = row.original.lastEventAt;

          const label =
            kind === "click" ? "Click" : kind === "lead" ? "Opt-in" : kind === "sale" ? "Sale" : null;

          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                {label ? (
                  <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
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
        id: "triggeredLink",
        header: "Link",
        minSize: 320,
        size: 420,
        cell: ({ row }) => {
          const link = row.original.lastActivityLink || row.original.link;
          if (!link) return <span className="text-neutral-400">-</span>;

          return (
            <div className="flex min-w-0 flex-col gap-1 px-4 py-2">
              <LinkCell
                link={{
                  domain: link.domain,
                  key: link.key,
                  url: link.url,
                }}
                variant="table"
                showCopyButton={false}
                className="min-w-0 flex-1 max-w-[360px]"
              />
              <UtmTagsRow
                url={link.url}
                utm={{
                  utm_source: link.utm_source,
                  utm_medium: link.utm_medium,
                  utm_campaign: link.utm_campaign,
                  utm_term: link.utm_term,
                  utm_content: link.utm_content,
                }}
                tags={link.tags}
                visibleUtmKeys={utmVisibility.visibleUtmKeys}
                showTagsColumn={utmVisibility.showTagsColumn}
              />
            </div>
          );
        },
      },
      {
        id: "clicks",
        header: "Clicks",
        accessorKey: "totalClicks",
        minSize: 90,
        size: 90,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium tabular-nums text-neutral-800">
            {nFormatter(row.original.totalClicks ?? 0)}
          </div>
        ),
      },
    ],
    [utmVisibility.visibleUtmKeys, utmVisibility.showTagsColumn],
  );

  const { table, ...tableProps } = useTable({
    data: customers,
    loading: isLoading,
    error: error ? "Failed to fetch leads feed." : undefined,
    columns,
    enableColumnResizing: true,
    pagination: hotOnly ? undefined : pagination,
    onPaginationChange: hotOnly ? undefined : setPagination,
    rowCount: hotOnly ? customers.length : data?.total ?? customers.length,
    onRowClick: (row) => router.push(`/${slug}/customers/${row.original.id}`),
    tdClassName: () =>
      cn("cursor-pointer transition-colors group-hover:bg-blue-50/50"),
    emptyState: (
      <EmptyState
        icon={Flame}
        title={hotOnly ? "No hot leads yet" : "No leads yet"}
        description={
          hotOnly
            ? "Hot leads will appear once contacts start interacting with your links."
            : "Leads will appear here as soon as contacts interact and convert."
        }
      />
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
          {hotOnly && (
            <>
              <Button
                variant="secondary"
                className="h-9 w-auto rounded-full px-3"
                icon={<ClipboardCopy className="h-4 w-4 text-neutral-600" />}
                text="Copy (Sheets)"
                loading={copying}
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
              />
              <Button
                variant="secondary"
                className="h-9 w-auto rounded-full px-3"
                icon={<Download className="h-4 w-4 text-neutral-600" />}
                text="Download CSV"
                disabled={customers.length === 0}
                onClick={() => downloadLeadsAsCSV(customers)}
              />
            </>
          )}
        </div>
      </div>

      <Table {...tableProps} table={table} />
    </>
  );
}

