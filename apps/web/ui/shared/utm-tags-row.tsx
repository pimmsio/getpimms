"use client";

import { Tooltip, useRouterStuff } from "@dub/ui";
import { cn, getParamsFromURL } from "@dub/utils";
import { useMemo } from "react";

export type UtmKey =
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "utm_term"
  | "utm_content";

const UTM_COLUMNS: { key: UtmKey; label: string; wrapperClassName?: string }[] = [
  { key: "utm_source", label: "SOURCE" },
  { key: "utm_medium", label: "MEDIUM" },
  { key: "utm_campaign", label: "CAMPAIGN" },
  { key: "utm_term", label: "TERM", wrapperClassName: "hidden 2xl:block" },
  { key: "utm_content", label: "CONTENT", wrapperClassName: "hidden 2xl:block" },
];

export function UtmTagsRow({
  url,
  utm,
  tags,
  visibleUtmKeys,
  showTagsColumn,
  className,
}: {
  url?: string | null;
  utm?: Partial<Record<UtmKey, string | null | undefined>>;
  tags?: { id: string; name: string; color: string }[] | null;
  visibleUtmKeys?: UtmKey[];
  showTagsColumn?: boolean;
  className?: string;
}) {
  const { queryParams, searchParamsObj } = useRouterStuff();

  // Prefer explicit UTM values; fallback to URL parsing.
  let utmValues: Record<UtmKey, string | null> = {
    utm_source: utm?.utm_source ?? null,
    utm_medium: utm?.utm_medium ?? null,
    utm_campaign: utm?.utm_campaign ?? null,
    utm_term: utm?.utm_term ?? null,
    utm_content: utm?.utm_content ?? null,
  };

  if (!Object.values(utmValues).some(Boolean) && url) {
    const urlParams = getParamsFromURL(url);
    utmValues = {
      utm_source: urlParams.utm_source || null,
      utm_medium: urlParams.utm_medium || null,
      utm_campaign: urlParams.utm_campaign || null,
      utm_term: urlParams.utm_term || null,
      utm_content: urlParams.utm_content || null,
    };
  }

  const hasTags = !!(tags && tags.length);
  const shouldShowTagsColumn = showTagsColumn ?? hasTags;

  const utmKeysToRender = visibleUtmKeys
    ? UTM_COLUMNS.filter((c) => visibleUtmKeys.includes(c.key))
    : UTM_COLUMNS;

  if (utmKeysToRender.length === 0 && !shouldShowTagsColumn) return null;

  const selectedTagIds = useMemo(
    () => searchParamsObj["tagIds"]?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj],
  );

  const selectedUtmValues = useMemo(() => {
    const selected: Record<UtmKey, string[]> = {
      utm_source: searchParamsObj["utm_source"]?.split(",")?.filter(Boolean) ?? [],
      utm_medium: searchParamsObj["utm_medium"]?.split(",")?.filter(Boolean) ?? [],
      utm_campaign: searchParamsObj["utm_campaign"]?.split(",")?.filter(Boolean) ?? [],
      utm_term: searchParamsObj["utm_term"]?.split(",")?.filter(Boolean) ?? [],
      utm_content: searchParamsObj["utm_content"]?.split(",")?.filter(Boolean) ?? [],
    };
    return selected;
  }, [searchParamsObj]);

  const handleTagClick = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedTagIds.includes(tagId)) return;
    queryParams({
      set: {
        tagIds: selectedTagIds.concat(tagId).join(","),
      },
      del: "page",
    });
  };

  const handleUtmClick = (key: UtmKey, value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedUtmValues[key].includes(value)) return;
    queryParams({
      set: {
        [key]: selectedUtmValues[key].concat(value).join(","),
      },
      del: "page",
    });
  };

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex min-w-max">
        {utmKeysToRender.map(({ key, label, wrapperClassName }, idx) => {
          const value = utmValues[key];
          return (
            <div
              key={key}
              className={cn(
                "min-w-0 shrink-0 pr-2",
                "w-[60px] sm:w-[70px] lg:w-[76px] xl:w-[82px] 2xl:w-[96px]",
                idx !== 0 && "border-l border-neutral-200/70 pl-2",
                wrapperClassName,
              )}
            >
              <div className="text-[8px] font-medium uppercase tracking-wide text-neutral-400">
                {label}
              </div>
              {value ? (
                <Tooltip content={value} side="top" delayDuration={150}>
                  <button
                    type="button"
                    onClick={(e) => handleUtmClick(key, value, e)}
                    className={cn(
                      "mt-0.5 block w-full truncate text-[11px] font-medium text-neutral-700",
                      "font-mono tabular-nums",
                      "transition-colors hover:text-neutral-950 hover:underline hover:underline-offset-2",
                    )}
                  >
                    {value}
                  </button>
                </Tooltip>
              ) : (
                <span className="mt-0.5 block truncate text-[11px] text-neutral-300">
                  —
                </span>
              )}
            </div>
          );
        })}

        {shouldShowTagsColumn && (
          <div className="min-w-0 shrink-0 border-l border-neutral-200/70 pl-2 pr-0 w-[76px] sm:w-[88px] lg:w-[96px] xl:w-[104px]">
            <div className="text-[8px] font-medium uppercase tracking-wide text-neutral-400">
              TAGS
            </div>
            {hasTags ? (
              <Tooltip
                side="top"
                delayDuration={150}
                content={
                  <div className="max-w-xs p-2">
                    <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                      Tags
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-neutral-700">
                      {tags!.map((t) => (
                        <div key={t.id} className="truncate" title={t.name}>
                          {t.name}
                        </div>
                      ))}
                    </div>
                  </div>
                }
              >
                <button
                  type="button"
                  onClick={(e) => handleTagClick(tags![0].id, e)}
                  className={cn(
                    "mt-0.5 block w-full truncate text-[11px] font-medium text-neutral-600",
                    "transition-colors hover:text-neutral-950 hover:underline hover:underline-offset-2",
                  )}
                >
                  <span className="truncate">
                    {tags![0].name}
                    {tags!.length > 1 ? ` | +${tags!.length - 1}` : ""}
                  </span>
                </button>
              </Tooltip>
            ) : (
              <span className="mt-0.5 block truncate text-[11px] text-neutral-300">
                —
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

