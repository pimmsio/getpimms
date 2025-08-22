"use client";

import useCustomer from "@/lib/swr/use-customer";
import useWorkspace from "@/lib/swr/use-workspace";
import {
  CommissionResponse,
  CustomerActivityResponse,
  CustomerEnriched,
  SaleEvent,
} from "@/lib/types";
import { ActivityHeatmap } from "@/ui/customers/activity-heatmap";
import { ClickHistoryList } from "@/ui/customers/click-history-list";
import { CustomerActivityList } from "@/ui/customers/customer-activity-list";
import { CustomerDetailsColumn } from "@/ui/customers/customer-details-column";
import { CustomerPartnerEarningsTable } from "@/ui/customers/customer-partner-earnings-table";
import { CustomerSalesTable } from "@/ui/customers/customer-sales-table";
import { UnifiedActivityList } from "@/ui/customers/unified-activity-list";
import { calculateCustomerHotness } from "@/lib/analytics/calculate-hotness";
import { BackLink } from "@/ui/shared/back-link";
import { ArrowUpRight, CopyButton } from "@dub/ui";
import { OG_AVATAR_URL, fetcher } from "@dub/utils";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { memo } from "react";
import useSWR from "swr";

export function CustomerPageClient() {
  const { customerId } = useParams<{ customerId: string }>();

  const { id: workspaceId, slug } = useWorkspace();
  const {
    data: customer,
    isLoading,
    error,
  } = useCustomer<CustomerEnriched>({
    customerId,
    query: { includeExpandedFields: true },
  });

  const { data: customerActivity, isLoading: isCustomerActivityLoading } =
    useSWR<CustomerActivityResponse>(
      customer &&
        `/api/customers/${customer.id}/activity?workspaceId=${workspaceId}`,
      fetcher,
    );

  const { data: clickHistory, isLoading: isClickHistoryLoading } = useSWR<{
    customer: { id: string; name: string };
    anonymousId: string | null;
    totalClicks: number;
    clickHistory: any[];
  }>(
    customer &&
      `/api/customers/${customer.id}/click-history?workspaceId=${workspaceId}&limit=50`,
    fetcher,
  );

  if (!customer && !isLoading && !error) notFound();

  return (
    <div className="mb-10 mt-2">
      <BackLink href={`/${slug}/conversions`}>Conversions</BackLink>
      <div className="mt-4 flex items-center gap-3">
        {customer ? (
          <div className="relative">
            <img
              src={customer.avatar || `${OG_AVATAR_URL}${customer.name}`}
              alt={customer.name}
              className="size-14 rounded-full border border-neutral-200"
            />
            {/* Hot indicator (heat bar) */}
            <div className="absolute -top-1 -right-1 rounded-full bg-white p-1 shadow-lg">
              {(() => {
                const totalClicks = customer.totalClicks || 0;
                const lastEventAt = customer.lastEventAt || customer.createdAt;
                const heat = calculateCustomerHotness(totalClicks, lastEventAt); // 0-3
                const label = ["Cold", "Warm", "Hot", "Very hot"][heat] as string;
                const fillPct = (heat / 3) * 100;
                return (
                  <div className="flex items-center justify-center" title={label}>
                    <div className="h-2 w-10 overflow-hidden rounded-full bg-neutral-200">
                      <div
                        className="h-full"
                        style={{
                          width: `${fillPct}%`,
                          // Elegant gradient: emerald → amber → rose
                          background: "linear-gradient(to right, #34d399, #f59e0b, #ef4444)",
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="size-16 animate-pulse rounded-full bg-neutral-200" />
        )}
        <div className="flex flex-col gap-1">
          {customer ? (
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold leading-tight text-neutral-900">
                {customer.name}
              </h1>
            </div>
          ) : (
            <div className="h-6 w-32 animate-pulse rounded bg-neutral-200" />
          )}

          {customer ? (
            customer.email && (
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-neutral-500">
                  {customer.email}
                </span>
                <CopyButton
                  value={customer.email}
                  variant="neutral"
                  className="p-1 [&>*]:h-4"
                  successMessage="Copied email to clipboard!"
                />
              </div>
            )
          ) : (
            <div className="h-5 w-24 animate-pulse rounded bg-neutral-200" />
          )}
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 items-start gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_240px]">
        {/* Main content */}
        <div className="flex flex-col gap-8">
          <section className="flex flex-col">
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <ActivityHeatmap 
                customerId={customerId} 
                customerActivity={customerActivity}
                clickHistory={clickHistory}
              />
            </div>
          </section>

          <section className="flex flex-col">
            <div className="flex items-center justify-between py-2">
              <h2 className="text-lg font-semibold text-neutral-900">
                All events
              </h2>
              <Link
                href={`/${slug}/conversions?customerId=${customerId}`}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all →
              </Link>
            </div>
            
            <UnifiedActivityList
              customerActivity={customerActivity}
              clickHistory={clickHistory}
              isLoading={!customer || isCustomerActivityLoading || isClickHistoryLoading}
            />
          </section>

          {customer?.programId && customer.partner && (
            <section className="flex flex-col">
              <h2 className="py-3 text-lg font-semibold text-neutral-900">
                Partner Earnings
              </h2>
              <div className="flex flex-col gap-4">
                <Link
                  href={`/${slug}/programs/${customer.programId}/partners?partnerId=${customer.partner.id}`}
                  target="_blank"
                  className="border-border-subtle group flex items-center justify-between overflow-hidden rounded border bg-neutral-100 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={
                        customer.partner.image ||
                        `${OG_AVATAR_URL}${customer.partner.name}`
                      }
                      alt={customer.partner.name}
                      className="size-8 rounded-full"
                    />
                    <div className="min-w-0">
                      <span className="block truncate text-xs font-semibold leading-tight text-neutral-900">
                        {customer.partner.name}
                      </span>
                      {customer?.partner.email && (
                        <span className="block min-w-0 truncate text-xs font-medium leading-tight text-neutral-500">
                          {customer.partner.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowUpRight className="size-3 shrink-0 -translate-x-0.5 translate-y-0.5 opacity-0 transition-[transform,opacity] group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                </Link>
                <PartnerEarningsTable
                  programId={customer.programId}
                  customerId={customerId}
                />
              </div>
            </section>
          )}
        </div>

        {/* Right side details */}
        <div className="-order-1 lg:order-1">
          <CustomerDetailsColumn
            customer={customer}
            customerActivity={customerActivity}
            isCustomerActivityLoading={!customer || isCustomerActivityLoading}
          />
        </div>
      </div>
    </div>
  );
}

const SalesTable = memo(({ customerId }: { customerId: string }) => {
  const { id: workspaceId, slug } = useWorkspace();

  const { data: salesData, isLoading: isSalesLoading } = useSWR<SaleEvent[]>(
    `/api/events?event=sales&interval=all&limit=8&customerId=${customerId}&workspaceId=${workspaceId}`,
    fetcher,
    {
      keepPreviousData: true,
    },
  );

  const { data: totalSales, isLoading: isTotalSalesLoading } = useSWR<{
    sales: number;
  }>(
    `/api/analytics?event=sales&interval=all&groupBy=count&customerId=${customerId}&workspaceId=${workspaceId}`,
    fetcher,
    {
      keepPreviousData: true,
    },
  );

  return (
    <CustomerSalesTable
      sales={salesData}
      totalSales={totalSales?.sales}
      viewAllHref={`/${slug}/conversions?event=sales&interval=all&customerId=${customerId}`}
      isLoading={isSalesLoading || isTotalSalesLoading}
    />
  );
});

const PartnerEarningsTable = memo(
  ({ programId, customerId }: { programId: string; customerId: string }) => {
    const { id: workspaceId, slug } = useWorkspace();

    const { data: commissions, isLoading: isComissionsLoading } = useSWR<
      CommissionResponse[]
    >(
      `/api/programs/${programId}/commissions?customerId=${customerId}&workspaceId=${workspaceId}&pageSize=8`,
      fetcher,
    );

    const { data: totalCommissions, isLoading: isTotalCommissionsLoading } =
      useSWR<{ all: { count: number } }>(
        `/api/programs/${programId}/commissions/count?customerId=${customerId}&workspaceId=${workspaceId}`,
        fetcher,
      );

    return (
      <CustomerPartnerEarningsTable
        commissions={commissions}
        totalCommissions={totalCommissions?.all?.count}
        viewAllHref={`/${slug}/programs/${programId}/commissions?customerId=${customerId}`}
        isLoading={isComissionsLoading || isTotalCommissionsLoading}
      />
    );
  },
);
