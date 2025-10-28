import { cn, truncate } from "@dub/utils";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ReactNode, isValidElement, useMemo } from "react";
import { AnimatedSizeContainer } from "../animated-size-container";
import { useKeyboardShortcut } from "../hooks";
import { Filter, FilterOption } from "./types";

type FilterListProps = {
  filters: Filter[];
  activeFilters?: {
    key: Filter["key"];
    value: FilterOption["value"];
  }[];
  onRemove: (key: string, value: FilterOption["value"]) => void;
  onRemoveAll: () => void;
  className?: string;
};

export function FilterList({
  filters,
  activeFilters,
  onRemove,
  onRemoveAll,
  className,
}: FilterListProps) {
  const { slug } = useParams();
  useKeyboardShortcut("Escape", onRemoveAll, { priority: 1 });
  
  // Group active filters by key so we render a single pill per filter type
  const groupedActiveFilters = useMemo(() => {
    if (!activeFilters) return [] as { key: Filter["key"]; value: FilterOption["value"]; }[];

    const map = new Map<string, FilterOption["value"]>();

    for (const { key, value } of activeFilters) {
      if (key === "loader") continue;
      const filter = filters.find((f) => f.key === key);
      if (!filter) continue;

      if (filter.multiple) {
        const existing = map.get(key);
        const existingArr = Array.isArray(existing)
          ? existing
          : existing !== undefined
          ? [existing]
          : [];
        const incomingArr = Array.isArray(value) ? value : [value];
        const merged = [...existingArr, ...incomingArr].filter(Boolean) as any[];
        // Dedupe assuming primitive values (strings/numbers)
        const deduped = Array.from(new Set(merged as any[])) as any[];
        map.set(key, deduped as unknown as FilterOption["value"]);
      } else {
        map.set(key, value);
      }
    }

    return Array.from(map.entries()).map(([key, value]) => ({
      key: key as Filter["key"],
      value,
    }));
  }, [activeFilters, filters]);
  return (
    <AnimatedSizeContainer
      height
      className="w-full"
      transition={{ type: "tween", duration: 0.3 }}
    >
      <div
        className={cn(
          "flex w-full flex-wrap items-start gap-4 sm:flex-nowrap",
          className,
        )}
      >
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <AnimatePresence>
            {/* Render any loader placeholders first */}
            {activeFilters?.filter(({ key }) => key === "loader").map(({ value: filterValue }) => (
              <motion.div
                key={`loader-${filterValue}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-9 w-48 animate-pulse rounded border border-neutral-200 bg-white"
              />
            ))}
            {groupedActiveFilters.map(({ key, value: filterValue }) => {
              const filter = filters.find((f) => f.key === key);
              if (!filter) {
                console.error(
                  "Filter.List received an activeFilter without a corresponding filter",
                );
                return null;
              }

              const linkPageHref =
                slug && key === "link"
                  ? `/${slug}/links/${filterValue}`
                  : undefined;

              const values =
                filter.multiple && Array.isArray(filterValue)
                  ? filterValue
                  : [filterValue];

              const value = values[0];
              const extraCount = Math.max(0, values.length - 1);

              const option = filter.options?.find((o) =>
                typeof o.value === "string" && typeof value === "string"
                  ? o.value.toLowerCase() === value.toLowerCase()
                  : o.value === value,
              );

              const OptionIcon =
                option?.icon ??
                filter.getOptionIcon?.(value, {
                  key: filter.key,
                  option,
                }) ??
                filter.icon;

              const optionLabel =
                option?.label ??
                filter.getOptionLabel?.(value, { key: filter.key, option }) ??
                value;

              return (
                <motion.div
                  key={`${key}-${value}`}
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center rounded-lg border border-neutral-200 bg-gradient-to-b from-white to-neutral-50/50 text-sm text-black shadow-sm hover:shadow transition-shadow"
                >
                  {/* Filter */}
                  <div className="flex items-center gap-2.5 px-3 py-2 max-w-[140px] truncate text-xs sm:text-sm font-medium text-neutral-700">
                    {/* <span className="shrink-0 text-neutral-600">
                      {isReactNode(filter.icon) ? (
                        filter.icon
                      ) : (
                        <filter.icon className="h-4 w-4" />
                      )}
                    </span> */}
                    {filter.label}
                  </div>

                  {/* is */}
                  <div className="px-1 py-2 text-neutral-400 font-medium">=</div>

                  {/* Option (single line, truncate) */}
                  <div className="flex min-w-0 items-center gap-2 px-2 py-2">
                    {filter.options ? (
                      <>
                        <span className="shrink-0 text-neutral-600">
                          {isReactNode(OptionIcon) ? (
                            OptionIcon
                          ) : (
                            <OptionIcon className="h-4 w-4" />
                          )}
                        </span>
                        <div className="flex min-w-0 items-center gap-1.5">
                          {linkPageHref ? (
                            <Link
                              href={linkPageHref}
                              target="_blank"
                              className="cursor-alias decoration-dotted underline-offset-2 hover:underline max-w-[140px] truncate text-xs sm:text-sm font-medium text-neutral-900"
                              title={String(optionLabel)}
                            >
                              {truncate(optionLabel, 30)}
                            </Link>
                          ) : (
                            <span className="max-w-[140px] truncate font-medium text-neutral-900" title={String(optionLabel)}>
                              {truncate(optionLabel, 30)}
                            </span>
                          )}
                          {extraCount > 0 && (
                            <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                              +{extraCount}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="h-5 w-12 animate-pulse rounded bg-neutral-200" />
                    )}
                  </div>

                  {/* Remove (clears all values for this filter) */}
                  <button
                    type="button"
                    className="h-full rounded-r-lg px-2.5 py-2 text-neutral-400 transition-all hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20"
                    onClick={() => {
                      values.forEach((v) => onRemove(key, v as any));
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {activeFilters?.length !== 0 && (
          <button
            type="button"
            className="group mt-px flex items-center gap-2 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-600 ring-inset transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 shadow-sm"
            onClick={onRemoveAll}
          >
            Clear all
          </button>
        )}
      </div>
    </AnimatedSizeContainer>
  );
}

const isReactNode = (element: any): element is ReactNode =>
  isValidElement(element);
