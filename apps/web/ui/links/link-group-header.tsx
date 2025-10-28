import { MaxWidthWrapper } from "@dub/ui";
import { cn } from "@dub/utils";
import { ChevronRight } from "lucide-react";

interface LinkGroupHeaderProps {
  groupValue: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function LinkGroupHeader({
  groupValue,
  count,
  isExpanded,
  onToggle,
}: LinkGroupHeaderProps) {
  return (
    <MaxWidthWrapper className="max-w-full px-2 sm:px-0 lg:px-0">
      <button
        onClick={onToggle}
        className={cn(
          "group relative flex w-full items-center gap-2 rounded-xl sm:rounded-none border sm:border-none px-3 py-3 text-left transition-all duration-200 sm:gap-3 sm:px-5 sm:py-4",
          isExpanded
            ? "border-neutral-300 bg-white shadow-sm"
            : "border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 hover:bg-white hover:shadow-sm",
        )}
      >
        {/* Left accent border */}
        <div
          className={cn(
            "absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all duration-200",
            isExpanded
              ? "bg-gradient-to-b from-blue-500 to-blue-600"
              : "bg-neutral-300 group-hover:bg-blue-400",
          )}
        />
        
        {/* Chevron icon */}
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-neutral-500 transition-all duration-200 group-hover:text-neutral-700",
            isExpanded && "rotate-90 text-blue-600",
          )}
        />
        
        {/* Content */}
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 sm:gap-4">
          <span
            className={cn(
              "truncate text-sm font-semibold transition-colors duration-200 sm:text-base",
              isExpanded
                ? "text-neutral-900"
                : "text-neutral-700 group-hover:text-neutral-900",
            )}
          >
            {groupValue}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium transition-all duration-200 sm:px-2.5 sm:py-1",
              isExpanded
                ? "bg-blue-100 text-blue-700"
                : "bg-neutral-200 text-neutral-600 group-hover:bg-neutral-300",
            )}
          >
            {count}
          </span>
        </div>
      </button>
    </MaxWidthWrapper>
  );
}

