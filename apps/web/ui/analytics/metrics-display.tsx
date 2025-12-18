import { nFormatter } from "@dub/utils";
import { cn } from "@dub/utils";

export function MetricsDisplay({
  clicks,
  leads,
  sales,
  saleAmount,
  totalClicks,
  totalLeads,
  primaryMetric,
  className,
}: {
  clicks: number;
  leads?: number;
  sales?: number;
  saleAmount?: number;
  totalClicks?: number;
  totalLeads?: number;
  primaryMetric: "clicks" | "leads" | "sales";
  className?: string;
}) {
  const canShowClicksPct = typeof totalClicks === "number" && totalClicks > 0;
  const canShowLeadsPct = typeof totalLeads === "number" && totalLeads > 0;

  return (
    <div className={cn("flex items-center gap-2.5 text-sm", className)}>
      <span
        className={cn(
          "font-medium transition-colors",
          primaryMetric === "clicks"
            ? "text-blue-600 font-semibold"
            : "text-neutral-500"
        )}
      >
        <span className={canShowClicksPct ? "group-hover:hidden" : undefined}>
          {nFormatter(clicks, { full: true })}
        </span>
        {canShowClicksPct && (
          <span className="hidden group-hover:inline">
            {((clicks / totalClicks) * 100).toFixed(1)}%
          </span>
        )}
      </span>

      <span className="text-neutral-300">|</span>
      <span
        className={cn(
          "font-medium transition-colors",
          primaryMetric === "leads"
            ? "text-yellow-600 font-semibold"
            : "text-neutral-500",
        )}
      >
        <span className={canShowLeadsPct ? "group-hover:hidden" : undefined}>
          {nFormatter(leads ?? 0, { full: true })}
        </span>
        {canShowLeadsPct && (
          <span className="hidden group-hover:inline">
            {(((leads ?? 0) / totalLeads) * 100).toFixed(1)}%
          </span>
        )}
      </span>

      <span className="text-neutral-300">|</span>
      <span
        className={cn(
          "font-medium transition-colors",
          primaryMetric === "sales"
            ? "text-green-600 font-semibold"
            : "text-neutral-500",
        )}
      >
        ${nFormatter((saleAmount ?? 0) / 100, { full: true })}
      </span>
    </div>
  );
}

export function MetricsLabels({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5 text-xs text-neutral-400 font-medium", className)}>
      <span>Clicks</span>
      <span>|</span>
      <span>Leads</span>
      <span>|</span>
      <span>Sales</span>
    </div>
  );
}

