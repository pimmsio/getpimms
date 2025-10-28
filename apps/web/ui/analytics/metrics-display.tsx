import { nFormatter } from "@dub/utils";
import { cn } from "@dub/utils";

export function MetricsDisplay({
  clicks,
  leads,
  sales,
  saleAmount,
  primaryMetric,
  className,
}: {
  clicks: number;
  leads?: number;
  sales?: number;
  saleAmount?: number;
  primaryMetric: "clicks" | "leads" | "sales";
  className?: string;
}) {
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
        {nFormatter(clicks, { full: true })}
      </span>

      {(leads !== undefined && leads > 0) || (sales !== undefined && sales > 0) ? (
        <>
          <span className="text-neutral-300">|</span>
          <span
            className={cn(
              "font-medium transition-colors",
              primaryMetric === "leads"
                ? "text-yellow-600 font-semibold"
                : "text-neutral-500"
            )}
          >
            {nFormatter(leads || 0, { full: true })}
          </span>
        </>
      ) : null}

      {sales !== undefined && sales > 0 ? (
        <>
          <span className="text-neutral-300">|</span>
          <span
            className={cn(
              "font-medium transition-colors",
              primaryMetric === "sales"
                ? "text-green-600 font-semibold"
                : "text-neutral-500"
            )}
          >
            ${nFormatter((saleAmount || 0) / 100, { full: true })}
          </span>
        </>
      ) : null}
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

