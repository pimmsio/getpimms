import { cn, getPrettyUrl } from "@dub/utils";
import { ChevronRight } from "lucide-react";

interface LinkGroupHeaderProps {
  groupValue: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  groupType?: string; // 'url' | 'utm_source' | etc.
}

export function LinkGroupHeader({
  groupValue,
  count,
  isExpanded,
  onToggle,
  groupType,
}: LinkGroupHeaderProps) {
  // Format display value based on group type
  const displayValue = (() => {
    // For destination URLs, clean up the display
    if (groupType === "url" && !groupValue.startsWith("(No")) {
      const prettyUrl = getPrettyUrl(groupValue);
      return prettyUrl || groupValue;
    }
    return groupValue;
  })();

  // Check if it's a URL group (used for typography only; avoid decorative icons)
  const isUrlGroup = groupType === "url" && !groupValue.startsWith("(No");

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "group flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition-[box-shadow,border-color] sm:px-5",
        isExpanded
          ? "ring-1 ring-neutral-200/60"
          : "hover:ring-1 hover:ring-neutral-200/60",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-neutral-400 transition-transform",
            isExpanded && "rotate-90",
          )}
        />
        <div className="min-w-0">
          <div
            className={cn(
              "truncate font-medium text-neutral-900",
              isUrlGroup ? "font-mono text-sm sm:text-base" : "text-sm",
            )}
          >
            {displayValue}
          </div>
          {isUrlGroup && (
            <div className="mt-0.5 text-xs text-neutral-500">
              Destination URL
            </div>
          )}
        </div>
      </div>

      <span className="shrink-0 rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-neutral-700">
        {count}
      </span>
    </button>
  );
}
