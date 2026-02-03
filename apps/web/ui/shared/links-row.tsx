"use client";

import { LinkUtmColumns } from "@/ui/links/link-utm-columns";
import { LinkCell } from "@/ui/shared/link-cell";
import { cn, currencyFormatter, nFormatter } from "@dub/utils";
import useWorkspace from "@/lib/swr/use-workspace";

type UtmKey = "utm_source" | "utm_medium" | "utm_campaign" | "utm_term" | "utm_content";

export type LinksRowLink = {
  id?: string;
  domain: string;
  key: string;
  url: string;
  title?: string | null;
  description?: string | null;
  createdAt?: string | Date | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
};

export type LinksRowMetrics = {
  clicks: number;
  leads: number;
  revenue: number; // major unit (e.g. dollars/euros)
};

export function LinksRowSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 overflow-hidden",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="h-3.5 w-44 animate-pulse rounded bg-neutral-200" />
      </div>
      <div className="hidden sm:block">
        <div className="h-3.5 w-16 animate-pulse rounded bg-neutral-200" />
      </div>
    </div>
  );
}

export function LinksRowMetricPills({
  metrics,
  className,
}: {
  metrics: LinksRowMetrics;
  className?: string;
}) {
  const { currency } = useWorkspace();
  const { clicks, leads, revenue } = metrics;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Metric label="CLK" value={nFormatter(clicks)} tone="clicks" active={clicks > 0} />
      <div className="h-6 w-px bg-neutral-200/70" />
      <Metric label="CTT" value={nFormatter(leads)} tone="leads" active={leads > 0} />
      <div className="h-6 w-px bg-neutral-200/70" />
      <Metric
        label="SAL"
        value={currencyFormatter(revenue, {
          currency: currency ?? "EUR",
          maximumFractionDigits: 0,
        })}
        tone="revenue"
        active={revenue > 0}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
  active,
}: {
  label: string;
  value: string;
  tone: "clicks" | "leads" | "revenue";
  active?: boolean;
}) {
  const toneClassName =
    tone === "clicks"
      ? "bg-blue-50 text-blue-800"
      : tone === "revenue"
        ? "bg-emerald-50 text-emerald-800"
        : "bg-amber-50 text-amber-900";

  return (
    <div
      className={cn(
        "flex w-[46px] flex-col rounded px-1.5 py-1",
        active ? toneClassName : "bg-transparent",
      )}
    >
      <span className="text-[7px] font-medium uppercase tracking-wide text-neutral-400">
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums font-mono text-[12px] leading-4",
          active ? "text-neutral-800" : "text-neutral-300",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function LinksRow({
  link,
  tags,
  visibleUtmKeys,
  showTagsColumn,
  metrics,
  showUtmRow = true,
  className,
}: {
  link: LinksRowLink;
  tags?: { id: string; name: string; color: string }[];
  visibleUtmKeys?: UtmKey[];
  showTagsColumn?: boolean;
  metrics?: LinksRowMetrics;
  showUtmRow?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 overflow-hidden",
        className,
      )}
    >
      <div className="min-w-0 overflow-hidden">
        <LinkCell
          link={link}
          variant="links-page"
          showCopyButton={false}
          showBadges={false}
          className="min-w-0 max-w-full"
        />
        {showUtmRow && (
          <div className="mt-2 w-full overflow-x-auto">
            <LinkUtmColumns
              link={link}
              tags={tags || []}
              visibleUtmKeys={visibleUtmKeys}
              showTagsColumn={showTagsColumn}
            />
          </div>
        )}
      </div>
      {metrics && (
        <div className="shrink-0">
          <LinksRowMetricPills metrics={metrics} />
        </div>
      )}
    </div>
  );
}

