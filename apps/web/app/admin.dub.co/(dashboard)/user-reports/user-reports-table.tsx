"use client";

import EmptyState from "@/ui/shared/empty-state";
import {
  Avatar,
  Copy,
  Filter,
  Table,
  Tick,
  useCopyToClipboard,
  usePagination,
  useRouterStuff,
  useTable,
} from "@dub/ui";
import { fetcher, formatDate, nFormatter } from "@dub/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Users } from "lucide-react";
import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { useWorkspaceFilters } from "./use-workspace-filters";

export type WorkspaceReport = {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  plan: string;
  createdAt: Date;
  daysSinceBillingStart: number;
  totalLinks: number;
  thisMonthLinks: number;
  totalClicks: number;
  thisMonthClicks: number;
  activityScore: number | null;
  activityEmoji: string | null;
  ownerId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerImage: string | null;
  ownerEmailVerified: Date | null;
  ownerCreatedAt: Date | null;
};

export type WorkspaceReportsResponse = {
  workspaces: WorkspaceReport[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function UserReportsTable() {
  const { searchParams, queryParams } = useRouterStuff();

  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
  const search = searchParams.get("search") || "";
  const plan = searchParams.get("plan") || "";

  const { pagination, setPagination } = usePagination();
  const { filters, activeFilters, onSelect, onRemove, onRemoveAll } = useWorkspaceFilters();

  

  const columns = useMemo<ColumnDef<WorkspaceReport, any>[]>(
    () => [
      {
        id: "workspace",
        header: "Workspace + Owner",
        minSize: 300,
        size: 300,
        enableHiding: false,
        cell: ({ row }) => {
          const workspace = row.original;
          
          // Create a unique key that changes when search results change
          const avatarKey = `avatar-${workspace.workspaceId}-${workspace.ownerId}-${workspace.ownerEmail}`;

          return (
            <div className="flex items-center gap-3 py-1">
              <Avatar
                key={avatarKey} // Unique key for proper re-rendering
                user={{
                  id: workspace.ownerId || workspace.workspaceId,
                  name: workspace.ownerName,
                  email: workspace.ownerEmail,
                  image: workspace.ownerImage,
                }}
                className="size-8"
              />
              <div className="flex min-w-0 flex-col">
                <div className="truncate font-semibold text-neutral-900">
                  {workspace.workspaceSlug}
                </div>
                <div className="truncate text-sm text-neutral-500">
                  {workspace.ownerEmail || "No owner"}
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span className="text-blue-600">{workspace.plan}</span>
                  {workspace.ownerEmailVerified ? (
                    <span className="text-green-600">✓ Verified</span>
                  ) : (
                    <span className="text-amber-600">Unverified</span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "totalLinks",
        header: "Links",
        size: 140,
        accessorKey: "totalLinks",
        cell: ({ row }) => {
          const workspace = row.original;
          return (
            <div className="flex flex-col">
              <div className="text-sm font-medium text-neutral-900">
                {nFormatter(workspace.totalLinks)} total
              </div>
              <div className="text-xs text-blue-600">
                {nFormatter(workspace.thisMonthLinks)} this month
              </div>
            </div>
          );
        },
      },
      {
        id: "totalClicks",
        header: "Clicks",
        size: 140,
        accessorKey: "totalClicks",
        cell: ({ row }) => {
          const workspace = row.original;
          return (
            <div className="flex flex-col">
              <div className="text-sm font-medium text-neutral-900">
                {nFormatter(workspace.totalClicks)} total
              </div>
              <div className="text-xs text-blue-600">
                {nFormatter(workspace.thisMonthClicks)} this month
              </div>
            </div>
          );
        },
      },
      {
        id: "activityScore",
        header: "Activity Score",
        size: 130,
        cell: ({ row }) => {
          const workspace = row.original;
          if (workspace.plan !== "free" || workspace.activityScore === null) {
            return <span className="text-sm text-neutral-400">N/A</span>;
          }

          return (
            <div className="flex items-center gap-2">
              <span className="text-lg">{workspace.activityEmoji}</span>
              <div className="flex flex-col">
                <div className="text-sm font-medium">
                  {workspace.activityScore}/10
                </div>
                <div className="text-xs text-neutral-500">
                  {workspace.activityScore >= 7
                    ? "Active"
                    : workspace.activityScore >= 4
                      ? "Moderate"
                      : "Low"}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "createdAt",
        header: "Created",
        size: 150,
        cell: ({ row }) => {
          const workspace = row.original;
          return (
            <div className="flex flex-col">
              <div className="text-sm text-neutral-900">
                {formatDate(workspace.createdAt)}
              </div>
              <div className="text-xs text-neutral-500">
                {workspace.daysSinceBillingStart} days since reset
              </div>
            </div>
          );
        },
      },
      {
        id: "impersonate",
        header: "Actions",
        size: 80,
        cell: ({ row }) => {
          const workspace = row.original;
          if (!workspace.ownerEmail) {
            return <span className="text-neutral-400 text-xs">No owner</span>;
          }
          
          return <ImpersonateButton email={workspace.ownerEmail} />;
        },
      },
    ],
    [],
  );

  // Fetch user reports data
  const {
    data: workspaceReportsResponse,
    isLoading,
    error,
  } = useSWR<WorkspaceReportsResponse>(
    `/api/admin/user-reports?${new URLSearchParams({
      ...(search && { search }),
      ...(plan && { plan }),
      sortBy,
      sortOrder,
      page: (pagination.pageIndex + 1).toString(),
      limit: pagination.pageSize.toString(),
    }).toString()}`,
    fetcher,
    {
      keepPreviousData: false, // Don't keep previous data to avoid avatar cache issues
      revalidateOnFocus: false,
    },
  );

  const workspaceReports = workspaceReportsResponse?.workspaces || [];
  const totalCount = workspaceReportsResponse?.totalCount || 0;

  // TS can hit "excessive stack depth" on complex generic inference here.
  // Assigning to `any` first keeps build-time types fast/stable while preserving runtime behavior.
  const tableConfig: any = {
    data: workspaceReports,
    loading: isLoading,
    error: error ? "Failed to fetch workspace reports." : undefined,
    columns,
    enableColumnResizing: true,
    pagination,
    onPaginationChange: setPagination,
    rowCount: totalCount,
    sortableColumns: [
      "totalClicks",
      "totalLinks",
      "thisMonthClicks",
      "thisMonthLinks",
      "activityScore",
      "createdAt",
      "workspaceName",
      "workspaceSlug",
      "plan",
    ],
    sortBy,
    sortOrder,
    onSortChange: ({ sortBy, sortOrder }: any) =>
      queryParams({
        set: {
          ...(sortBy && { sortBy }),
          ...(sortOrder && { sortOrder }),
        },
      }),
    emptyState: (
      <EmptyState
        icon={Users}
        title="No workspaces found"
        description="Workspaces will appear here once they are created"
      />
    ),
    resourceName: (plural: boolean) => `workspace${plural ? "s" : ""}`,
  };

  const { table, ...tableProps } = useTable<WorkspaceReport>(tableConfig);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 lg:flex-nowrap">
        <div className="flex grow gap-x-4 max-md:w-full">
          <div className="w-full md:w-56 lg:w-64">
            <input
              type="text"
              placeholder="Search by workspace slug..."
              className="h-10 w-full rounded-lg border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={search}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  queryParams({ set: { search: value }, del: "page" });
                } else {
                  queryParams({ del: ["search", "page"] });
                }
              }}
            />
          </div>
        </div>
        <div className="flex w-full gap-2 md:w-auto">
          <div className="grow basis-0 md:grow-0">
            <Filter.Select
              filters={filters}
              activeFilters={activeFilters}
              onSelect={onSelect}
              onRemove={onRemove}
              className="w-full"
            />
          </div>
          <div className="text-sm text-neutral-500 flex items-center">
            {totalCount} workspaces total
          </div>
        </div>
      </div>

      {/* Active Filters List - always show when plan filter is applied */}
      <Filter.List
        filters={filters}
        activeFilters={activeFilters}
        onRemove={onRemove}
        onRemoveAll={onRemoveAll}
      />

      <Table {...tableProps} table={table} className="border-0" />
    </div>
  );
}

// Component to generate and copy impersonation URL
function ImpersonateButton({ email }: { email: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard();
  const [loading, setLoading] = useState(false);

  const handleImpersonate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate impersonation URL");
      }

      const data = await response.json();
      
      // Copy the app impersonation URL
      await copyToClipboard(data.impersonateUrl.app);
      toast.success("Impersonation URL copied to clipboard");
    } catch (error) {
      console.error("Error generating impersonation URL:", error);
      toast.error("Failed to generate impersonation URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleImpersonate}
      disabled={loading}
      className="rounded border border-neutral-300 p-2 hover:bg-neutral-50 disabled:opacity-50"
      title="Copy impersonation URL"
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border border-neutral-300 border-t-neutral-600" />
      ) : copied ? (
        <Tick className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4 text-neutral-500" />
      )}
    </button>
  );
}
