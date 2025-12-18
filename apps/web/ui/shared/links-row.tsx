"use client";

import { LinkUtmColumns } from "@/ui/links/link-utm-columns";
import { LinkCell } from "@/ui/shared/link-cell";
import { cn, currencyFormatter, nFormatter } from "@dub/utils";

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
  showUtmRow = true,
  showMetrics = true,
  className,
}: {
  showUtmRow?: boolean;
  showMetrics?: boolean;
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
        {/* Mimic LinkCell (variant: links-page) layout: logo + 2-line content */}
        <div className="flex items-center gap-3 py-1">
          <div className="group relative flex h-9 w-9 shrink-0 items-center justify-center outline-none sm:h-10 sm:w-10">
            <div className="absolute inset-1 shrink-0 rounded-full border border-transparent bg-transparent" />
            <div className="relative">
              <div className="size-6 shrink-0 animate-pulse rounded-full bg-neutral-200 sm:size-7" />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm leading-tight">
            {/* Line 1 */}
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              <div className="h-4 w-40 max-w-[70%] shrink-0 animate-pulse rounded bg-neutral-200" />
              <div className="hidden shrink-0 animate-pulse rounded bg-neutral-200/80 sm:block h-3 w-3" />
              <div className="hidden min-w-0 max-w-[40%] shrink animate-pulse rounded bg-neutral-200 sm:block h-4 w-24" />
            </div>
            {/* Line 2 */}
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              <div className="h-3 w-3 shrink-0 animate-pulse rounded bg-neutral-200" />
              <div className="h-3.5 w-56 max-w-[80%] shrink-0 animate-pulse rounded bg-neutral-200" />
              <div className="hidden shrink-0 animate-pulse rounded bg-neutral-200/80 sm:block h-3 w-3" />
              <div className="hidden min-w-0 max-w-[40%] shrink animate-pulse rounded bg-neutral-200 sm:block h-3.5 w-20" />
            </div>
          </div>
        </div>

        {showUtmRow && (
          <div className="mt-2 w-full overflow-x-auto">
            <div className="flex min-w-max">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={idx}
                  className={cn(
                    "min-w-0 shrink-0 pr-2",
                    "w-[60px] sm:w-[70px] lg:w-[76px] xl:w-[82px] 2xl:w-[96px]",
                    idx !== 0 && "border-l border-neutral-200/70 pl-2",
                  )}
                >
                  <div className="h-2.5 w-10 animate-pulse rounded bg-neutral-200" />
                  <div className="mt-1 h-3 w-14 animate-pulse rounded bg-neutral-200" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {showMetrics && (
        <div className="shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-[46px] animate-pulse rounded bg-neutral-200" />
            <div className="h-6 w-px bg-neutral-200/70" />
            <div className="h-8 w-[46px] animate-pulse rounded bg-neutral-200" />
            <div className="h-6 w-px bg-neutral-200/70" />
            <div className="h-8 w-[46px] animate-pulse rounded bg-neutral-200" />
          </div>
        </div>
      )}
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
  const { clicks, leads, revenue } = metrics;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Metric label="CLK" value={nFormatter(clicks)} tone="clicks" active={clicks > 0} />
      <div className="h-6 w-px bg-neutral-200/70" />
      <Metric label="LEAD" value={nFormatter(leads)} tone="leads" active={leads > 0} />
      <div className="h-6 w-px bg-neutral-200/70" />
      <Metric
        label="REV"
        value={currencyFormatter(revenue, { maximumFractionDigits: 0 })}
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

