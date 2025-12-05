import { MaxWidthWrapper } from "@dub/ui";
import { cn, getPrettyUrl } from "@dub/utils";
import { ChevronRight, Link2 } from "lucide-react";

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
    if (groupType === 'url' && !groupValue.startsWith('(No')) {
      const prettyUrl = getPrettyUrl(groupValue);
      return prettyUrl || groupValue;
    }
    return groupValue;
  })();

  // Check if it's a URL group for icon
  const isUrlGroup = groupType === 'url' && !groupValue.startsWith('(No');

  return (
    <MaxWidthWrapper className="max-w-full px-2 sm:px-0 lg:px-0">
      <button
        onClick={onToggle}
        className={cn(
          "group relative flex w-full items-center gap-2.5 rounded-lg border px-4 py-3.5 text-left transition-all duration-200 sm:gap-3",
          isExpanded
            ? "border-blue-200 bg-gradient-to-r from-blue-50 to-transparent shadow-sm"
            : "border-neutral-200 bg-white hover:border-blue-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent hover:shadow-sm",
        )}
      >
        {/* Left accent indicator */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200",
            isExpanded
              ? "bg-blue-500"
              : "bg-transparent group-hover:bg-blue-300",
          )}
        />
        
        {/* Chevron icon */}
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 transition-all duration-200",
            isExpanded
              ? "rotate-90 text-blue-600"
              : "text-neutral-400 group-hover:text-blue-500",
          )}
        />
        
        {/* Icon for URL groups */}
        {isUrlGroup && (
          <div className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-200",
            isExpanded
              ? "bg-blue-100"
              : "bg-neutral-100 group-hover:bg-blue-50"
          )}>
            <Link2 className={cn(
              "h-3.5 w-3.5 transition-colors duration-200",
              isExpanded
                ? "text-blue-600"
                : "text-neutral-500 group-hover:text-blue-500"
            )} />
          </div>
        )}
        
        {/* Content */}
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span
              className={cn(
                "block truncate font-medium transition-colors duration-200",
                isExpanded
                  ? "text-neutral-900"
                  : "text-neutral-700 group-hover:text-neutral-900",
                isUrlGroup ? "text-sm sm:text-base font-mono" : "text-sm sm:text-base"
              )}
            >
              {displayValue}
            </span>
            {isUrlGroup && (
              <span className="text-xs text-neutral-500 mt-0.5">
                Destination URL
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums transition-all duration-200",
                isExpanded
                  ? "bg-blue-100 text-blue-700"
                  : "bg-neutral-100 text-neutral-600 group-hover:bg-blue-50 group-hover:text-blue-600",
              )}
            >
              {count}
            </span>
          </div>
        </div>
      </button>
    </MaxWidthWrapper>
  );
}

