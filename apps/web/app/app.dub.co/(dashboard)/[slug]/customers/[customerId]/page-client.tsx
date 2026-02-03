"use client";

import useCustomer from "@/lib/swr/use-customer";
import useWorkspace from "@/lib/swr/use-workspace";
import { CustomerActivityResponse, CustomerEnriched } from "@/lib/types";
import { CustomerDetailsColumn } from "@/ui/customers/customer-details-column";
import { LeadScoringDetails } from "@/ui/customers/lead-scoring-details";
import { UnifiedActivityList } from "@/ui/customers/unified-activity-list";
import { text } from "@/ui/design/tokens";
import { BackLink } from "@/ui/shared/back-link";
import { CopyButton } from "@dub/ui";
import { OG_AVATAR_URL, fetcher } from "@dub/utils";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
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
      `/api/customers/${customer.id}/click-history?workspaceId=${workspaceId}&limit=200`,
    fetcher,
    {
      keepPreviousData: true,
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    },
  );

  if (!customer && !isLoading && !error) notFound();

  return (
    <div className="mb-10 mt-2">
      <BackLink href={`/${slug}/conversions`}>Contacts</BackLink>
      <div className="mt-4 flex items-center gap-3">
        {customer ? (
          <div className="relative">
            <img
              src={customer.avatar || `${OG_AVATAR_URL}${customer.name}`}
              alt={customer.name}
              className="size-14 rounded-full"
            />
          </div>
        ) : (
          <div className="size-16 animate-pulse rounded-full bg-neutral-200" />
        )}
        <div className="flex flex-col gap-1">
          {customer ? (
            <div className="flex items-center gap-2.5">
              <h1 className={text.pageTitle}>
                {customer.name}
              </h1>
            </div>
          ) : (
            <div className="h-6 w-32 animate-pulse rounded bg-neutral-200" />
          )}

          {customer ? (
            customer.email && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-neutral-500">
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
            <LeadScoringDetails
              customerActivity={customerActivity}
              clickHistory={clickHistory}
              customerId={customerId}
              isLoading={!customer || isCustomerActivityLoading}
            />
          </section>

          <section className="flex flex-col">
            <div className="flex items-center justify-between py-2">
              <h2 className="text-lg font-semibold text-neutral-900">
                All events
              </h2>
              <Link
                href={`/${slug}/conversions?customerId=${customerId}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View all →
              </Link>
            </div>

            <UnifiedActivityList
              customerActivity={customerActivity}
              clickHistory={clickHistory}
              isLoading={
                !customer || isCustomerActivityLoading || isClickHistoryLoading
              }
            />
          </section>
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
