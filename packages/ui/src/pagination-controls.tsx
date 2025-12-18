import { cn, nFormatter } from "@dub/utils";
import { PaginationState } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PropsWithChildren } from "react";

const buttonClassName = cn(
  "flex h-8 sm:h-9 items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-2 sm:px-3.5 text-sm font-medium text-neutral-700",
  "outline-none transition-all duration-200",
  "hover:bg-neutral-50 hover:border-neutral-300 hover:shadow-sm",
  "focus-visible:border-neutral-300 focus-visible:ring-2 focus-visible:ring-neutral-300",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-neutral-200 disabled:hover:shadow-none",
);

export function PaginationControls({
  pagination,
  setPagination,
  totalCount,
  unit = (p) => `item${p ? "s" : ""}`,
  className,
  children,
  showTotalCount = true,
}: PropsWithChildren<{
  pagination: PaginationState;
  setPagination: (pagination: PaginationState) => void;
  totalCount: number;
  unit?: string | ((plural: boolean) => string);
  className?: string;
  showTotalCount?: boolean;
}>) {
  // Ensure pagination values are valid to prevent NaN display
  const validPageIndex = pagination.pageIndex && pagination.pageIndex >= 1 ? pagination.pageIndex : 1;
  const validPageSize = pagination.pageSize && pagination.pageSize > 0 ? pagination.pageSize : 25;

  return (
    <div
      className={cn(
        "flex items-center gap-2 sm:gap-3 text-sm leading-6 text-neutral-600",
        className,
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="text-xs sm:text-sm whitespace-nowrap">
          <span className="hidden sm:inline-block text-neutral-600">Viewing</span>{" "}
          {totalCount > 0 && (
            <>
              <span className="font-semibold text-neutral-900">
                {(validPageIndex - 1) * validPageSize + 1}-
                {Math.min(
                  (validPageIndex - 1) * validPageSize +
                    validPageSize,
                  totalCount,
                )}
              </span>
              {showTotalCount && (
                <>
                  <span className="hidden sm:inline text-neutral-600"> of </span>
                  <span className="hidden sm:inline font-semibold text-neutral-900">
                    {nFormatter(totalCount, { full: true })}
                  </span>
                </>
              )}
            </>
          )}
          {" "}
          <span className="text-neutral-600">
            {typeof unit === "function" ? unit(totalCount !== 1) : unit}
          </span>
        </div>
        {children}
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          className={buttonClassName}
          onClick={() =>
            setPagination({
              ...pagination,
              pageIndex: validPageIndex - 1,
            })
          }
          disabled={validPageIndex === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <button
          type="button"
          className={buttonClassName}
          onClick={() =>
            setPagination({
              ...pagination,
              pageIndex: validPageIndex + 1,
            })
          }
          disabled={
            (validPageIndex - 1) * validPageSize +
              validPageSize >=
            totalCount
          }
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
