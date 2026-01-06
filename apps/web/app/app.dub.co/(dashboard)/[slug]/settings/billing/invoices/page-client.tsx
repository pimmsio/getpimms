"use client";

import { InvoiceProps } from "@/lib/types";
import useWorkspace from "@/lib/swr/use-workspace";
import { AnimatedEmptyState } from "@/ui/shared/animated-empty-state";
import { AppButton } from "@/ui/components/controls/app-button";
import { text } from "@/ui/design/tokens";
import {
  InvoiceDollar,
  Receipt2,
  StatusBadge,
  useRouterStuff,
} from "@dub/ui";
import { cn, currencyFormatter, fetcher } from "@dub/utils";
import { useParams } from "next/navigation";
import useSWR from "swr";

const invoiceStatusBadge = (status: string | null | undefined) => {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return { label: "Pending", variant: "pending" as const };
    case "processing":
      return { label: "Processing", variant: "new" as const };
    case "paid":
    case "completed":
      return { label: "Paid", variant: "success" as const };
    case "failed":
      return { label: "Failed", variant: "error" as const };
    case "canceled":
    case "cancelled":
      return { label: "Canceled", variant: "neutral" as const };
    default:
      return { label: status || "Unknown", variant: "neutral" as const };
  }
};

export default function WorkspaceInvoicesClient() {
  const { currency } = useWorkspace();
  const { slug } = useParams();
  const { searchParams } = useRouterStuff();

  const invoiceType = searchParams.get("type") || "subscription";

  const { data: invoices } = useSWR<InvoiceProps[]>(
    `/api/workspaces/${slug}/billing/invoices?type=${invoiceType}`,
    fetcher,
  );

  return (
    <div className="overflow-hidden rounded-lg bg-neutral-50/60">
      <div className="flex flex-col items-start gap-1 px-4 py-3">
        <div>
          <h2 className={cn(text.pageTitle, "text-xl")}>Invoices</h2>
          <p className={cn(text.pageDescription, "text-sm")}>
            A history of all your PIMMS invoices
          </p>
        </div>
      </div>
      <div className="grid divide-y divide-neutral-100 rounded-md bg-white p-1">
        {invoices ? (
          invoices.length > 0 ? (
            invoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                currency={
                  ((currency || "EUR").toUpperCase() as "EUR" | "USD") ?? "EUR"
                }
              />
            ))
          ) : (
            <AnimatedEmptyState
              title="No invoices found"
              description="You don't have any invoices yet"
              cardContent={() => (
                <>
                  <Receipt2 className="size-4 text-neutral-700" />
                  <div className="h-2.5 w-24 min-w-0 rounded bg-neutral-200" />
                </>
              )}
              className="border-none"
            />
          )
        ) : (
          <>
            <InvoiceCardSkeleton />
            <InvoiceCardSkeleton />
            <InvoiceCardSkeleton />
          </>
        )}
      </div>
    </div>
  );
}

const InvoiceCard = ({
  invoice,
  currency,
}: {
  invoice: InvoiceProps;
  currency: "EUR" | "USD";
}) => {
  return (
    <div className="grid grid-cols-3 gap-4 px-6 py-4 sm:px-12">
      <div className="text-sm">
        <div className="font-medium">{invoice.description}</div>
        <div className="text-neutral-500">
          {new Date(invoice.createdAt).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
            day: "numeric",
          })}
        </div>
      </div>

      <div className="text-left text-sm">
        <div className="font-medium">Total</div>
        <div className="flex items-center gap-1.5 text-neutral-500">
          <span className="text-sm">
            {currencyFormatter(invoice.total / 100, {
              currency,
              maximumFractionDigits: 2,
            })}
          </span>
          {invoice.status &&
            (() => {
              const badge = invoiceStatusBadge(invoice.status);
              return (
                <StatusBadge
                  icon={null}
                  variant={badge.variant}
                  className="rounded-full py-0.5"
                >
                  {badge.label}
                </StatusBadge>
              );
            })()}
        </div>
      </div>

      <div className="flex items-center justify-end">
        {invoice.pdfUrl ? (
          <a
            href={invoice.pdfUrl}
            target="_blank"
            className="app-btn-secondary-sm flex size-8 items-center justify-center sm:size-auto sm:h-9 sm:px-3"
          >
            <p className="hidden sm:block">View invoice</p>
            <InvoiceDollar className="size-4 sm:hidden" />
          </a>
        ) : (
          <AppButton
            type="button"
            variant="secondary"
            size="sm"
            className="w-fit"
            disabled
            title={
              invoice.failedReason ||
              "Invoice not available. Contact support if you need assistance."
            }
          >
            View invoice
          </AppButton>
        )}
      </div>
    </div>
  );
};

const InvoiceCardSkeleton = () => {
  return (
    <div className="flex items-center justify-between px-6 py-4 sm:px-12">
      <div className="flex flex-col gap-1 text-sm">
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
      </div>
      <div className="h-8 w-16 animate-pulse rounded bg-neutral-200" />
    </div>
  );
};
