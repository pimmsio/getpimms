import { MaxWidthWrapper } from "@dub/ui";
import { cn } from "@dub/utils";
import { ChevronDown } from "lucide-react";

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
    <MaxWidthWrapper className="px-0 lg:px-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-left transition-colors hover:bg-neutral-100"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 text-neutral-600 transition-transform",
            !isExpanded && "-rotate-90",
          )}
        />
        <div className="flex flex-1 items-center justify-between">
          <span className="font-medium text-neutral-900">{groupValue}</span>
          <span className="text-sm text-neutral-500">
            {count} {count === 1 ? "link" : "links"}
          </span>
        </div>
      </button>
    </MaxWidthWrapper>
  );
}

