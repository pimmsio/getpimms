"use client";

import { LinksGroupBySlug } from "@/lib/links/links-display";
import { useIsMegaFolder } from "@/lib/swr/use-is-mega-folder";
import useLinks from "@/lib/swr/use-links";
import useLinksCount from "@/lib/swr/use-links-count";
import useWorkspace from "@/lib/swr/use-workspace";
import { ExpandedLinkProps, UserProps } from "@/lib/types";
import {
  buttonVariants,
  CardList,
  MaxWidthWrapper,
  useRouterStuff,
} from "@dub/ui";
import { CursorRays, Hyperlink } from "@dub/ui/icons";
import { cn, getParamsFromURL } from "@dub/utils";
import { useSearchParams } from "next/navigation";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";
import { AnimatedEmptyState } from "../shared/animated-empty-state";
import { LinkCard } from "./link-card";
import LinkCardPlaceholder from "./link-card-placeholder";
import { LinkGroupHeader } from "./link-group-header";
import { LinkSelectionProvider } from "./link-selection-provider";
import { LinksDisplayContext } from "./links-display-provider";
import { LinksToolbar } from "./links-toolbar";
import Link from "next/link";

export type ResponseLink = ExpandedLinkProps & {
  user: UserProps;
};

type UtmKey = "utm_source" | "utm_medium" | "utm_campaign" | "utm_term" | "utm_content";
const UTM_KEYS: UtmKey[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
];

export default function LinksContainer({
  CreateLinkButton,
}: {
  CreateLinkButton: () => JSX.Element;
}) {
  const { defaultFolderId } = useWorkspace();
  const { searchParams, queryParams } = useRouterStuff();
  const { sortBy, showArchived, groupBy, setGroupBy } =
    useContext(LinksDisplayContext);

  // Decide on the folderId to use
  let folderId = searchParams.get("folderId");
  if (folderId) {
    folderId = folderId === "unsorted" ? "" : folderId;
  } else {
    folderId = defaultFolderId ?? "";
  }

  const { links, isValidating } = useLinks({
    sortBy,
    showArchived,
    folderId,
    ...(groupBy && { groupBy }),
  });

  const { data: count } = useLinksCount<number>({
    query: {
      showArchived,
      folderId,
    },
  });

  return (
    <MaxWidthWrapper className="grid max-w-full min-w-0 gap-y-2 px-0 lg:px-0">
      <LinksList
        CreateLinkButton={CreateLinkButton}
        links={links}
        count={count}
        loading={isValidating}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        queryParams={queryParams}
      />
    </MaxWidthWrapper>
  );
}

export const LinksListContext = createContext<{
  openMenuLinkId: string | null;
  setOpenMenuLinkId: Dispatch<SetStateAction<string | null>>;
}>({
  openMenuLinkId: null,
  setOpenMenuLinkId: () => {},
});

function LinksList({
  CreateLinkButton,
  links,
  count,
  loading,
  groupBy,
  setGroupBy,
  queryParams,
}: {
  CreateLinkButton: () => JSX.Element;
  links?: ResponseLink[];
  count?: number;
  loading?: boolean;
  groupBy: LinksGroupBySlug;
  setGroupBy: (value: LinksGroupBySlug) => void;
  queryParams: any;
}) {
  const searchParams = useSearchParams();
  const { isMegaFolder } = useIsMegaFolder();

  const [openMenuLinkId, setOpenMenuLinkId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const isFiltered = [
    "folderId",
    "tagIds",
    "domain",
    //"userId",
    "url",
    "search",
    "showArchived",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ].some((param) => searchParams.has(param));

  // Process grouped links
  const groupedData = useMemo(() => {
    if (!links || !groupBy) return null;

    // Check if the data actually has group markers that match current groupBy
    const hasGroupMarkers = links.some((item: any) => item._group !== undefined);
    if (!hasGroupMarkers) return null; // Don't show groups during transition

    const groups: {
      groupValue: string;
      links: ResponseLink[];
    }[] = [];
    let currentGroup: typeof groups[0] | null = null;

    links.forEach((item: any) => {
      if (item._group !== undefined) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          groupValue: item._group,
          links: [],
        };
      } else if (currentGroup) {
        currentGroup.links.push(item);
      }
    });

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups.length > 0 ? groups : null;
  }, [links, groupBy]);

  // Initialize expanded groups when groupedData changes
  // Only expand the first group by default
  useMemo(() => {
    if (groupedData && groupedData.length > 0) {
      setExpandedGroups(new Set([groupedData[0].groupValue]));
    }
  }, [groupedData]);

  const toggleGroup = (groupValue: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupValue)) {
        next.delete(groupValue);
      } else {
        next.add(groupValue);
      }
      return next;
    });
  };

  // Flatten links for link selection (only visible links)
  const flatLinks = useMemo(() => {
    if (!groupedData) return links;
    return groupedData.flatMap((group) =>
      expandedGroups.has(group.groupValue) ? group.links : [],
    );
  }, [groupedData, expandedGroups, links]);

  const utmVisibility = useMemo(() => {
    const visible: Record<UtmKey, boolean> = {
      utm_source: false,
      utm_medium: false,
      utm_campaign: false,
      utm_term: false,
      utm_content: false,
    };

    const list = (flatLinks || []) as any[];
    for (const l of list) {
      // Only compute from actual links; grouped headers aren't part of flatLinks
      const urlParams = l?.url ? getParamsFromURL(l.url) : null;
      for (const key of UTM_KEYS) {
        const val = l?.[key] ?? (urlParams ? urlParams[key] : null);
        if (val) visible[key] = true;
      }
    }

    const visibleUtmKeys = UTM_KEYS.filter((k) => visible[k]);
    const showTagsColumn = (flatLinks || []).some((l: any) => (l?.tags?.length || 0) > 0);

    return { visibleUtmKeys, showTagsColumn };
  }, [flatLinks]);

  // Calculate total links count when grouping
  const totalLinksCount = useMemo(() => {
    if (!groupedData) return count;
    return groupedData.reduce((acc, group) => acc + group.links.length, 0);
  }, [groupedData, count]);

  const allExpanded = groupedData
    ? groupedData.every((g) => expandedGroups.has(g.groupValue))
    : false;
  const allCollapsed = groupedData
    ? groupedData.every((g) => !expandedGroups.has(g.groupValue))
    : false;

  const expandAll = () => {
    if (groupedData) {
      setExpandedGroups(new Set(groupedData.map((g) => g.groupValue)));
    }
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  // Don't show grouped data if we're loading and groupBy setting doesn't match the data structure
  const shouldShowGrouped = groupedData && !(loading && !groupBy);

  return (
    <LinksListContext.Provider value={{ openMenuLinkId, setOpenMenuLinkId }}>
      <LinkSelectionProvider links={flatLinks}>
        {!links || links.length ? (
          // Cards
          <>
            {shouldShowGrouped ? (
              // Grouped view
              <>
                {/* Group controls */}
                {groupedData.length >= 1 && (
                  <div key="group-controls" className={cn(
                    "mx-auto w-full max-w-screen-xl flex items-center justify-between gap-3 bg-neutral-50 border border-neutral-200 rounded-lg py-2.5 px-3 lg:px-10 transition-opacity duration-200",
                    loading && "opacity-40"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-neutral-600">
                        <span className="font-semibold text-neutral-900">
                          {groupedData.length}
                        </span>{" "}
                        {groupedData.length === 1 ? "group" : "groups"}
                        <span className="mx-2 text-neutral-300">·</span>
                        <span className="font-semibold text-neutral-900">
                          {flatLinks?.length || 0}
                        </span>{" "}
                        {flatLinks?.length === 1 ? "link" : "links"}
                      </div>
                      {groupedData.length > 1 && (
                        <div className="flex items-center gap-2.5 text-xs">
                          <button
                            onClick={expandAll}
                            disabled={allExpanded}
                            className={cn(
                              "font-medium transition-all",
                              allExpanded
                                ? "cursor-not-allowed text-neutral-400"
                                : "text-neutral-600 hover:text-blue-600",
                            )}
                          >
                            Expand all
                          </button>
                          <span className="text-neutral-300">·</span>
                          <button
                            onClick={collapseAll}
                            disabled={allCollapsed}
                            className={cn(
                              "font-medium transition-all",
                              allCollapsed
                                ? "cursor-not-allowed text-neutral-400"
                                : "text-neutral-600 hover:text-blue-600",
                            )}
                          >
                            Collapse all
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setGroupBy(null);
                        queryParams({
                          del: ["groupBy"],
                        });
                      }}
                      className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                    >
                      <span>Clear grouping</span>
                      <span className="text-[11px]">✕</span>
                    </button>
                  </div>
                )}
                {groupedData.map((group) => (
                  <div key={group.groupValue} className={cn(
                    "min-w-0 space-y-2 transition-opacity duration-200",
                    loading && "opacity-40"
                  )}>
                    <LinkGroupHeader
                      groupValue={group.groupValue}
                      count={group.links.length}
                      isExpanded={expandedGroups.has(group.groupValue)}
                      onToggle={() => toggleGroup(group.groupValue)}
                      groupType={groupBy || undefined}
                    />
                    {expandedGroups.has(group.groupValue) && (
                      <CardList loading={loading}>
                        {group.links.map((link) => (
                          <LinkCard key={link.id} link={link} utmVisibility={utmVisibility} />
                        ))}
                      </CardList>
                    )}
                  </div>
                ))}
              </>
            ) : (
              // Regular view
              <CardList 
                loading={false}
                className={cn("transition-opacity duration-200", loading && links?.length && "opacity-40")}
              >
                {links?.length
                  ? // Link cards
                    links.map((link) => (
                      <LinkCard key={link.id} link={link} utmVisibility={utmVisibility} />
                    ))
                  : // Initial loading placeholder cards (no skeleton animation)
                    Array.from({ length: 8 }).map((_, idx) => (
                      <CardList.Card
                        key={idx}
                        outerClassName="pointer-events-none animate-pulse"
                        innerClassName="flex items-center gap-4"
                      >
                        <LinkCardPlaceholder />
                      </CardList.Card>
                    ))}
              </CardList>
            )}
          </>
        ) : (
          <AnimatedEmptyState
            title={isFiltered ? "No links found" : "No links yet"}
            description={
              isFiltered
                ? "Bummer! There are no links that match your filters. Adjust your filters to yield more results."
                : "Start creating your first link."
            }
            cardContent={
              <>
                <Hyperlink className="size-4 text-neutral-700" />
                <div className="h-2.5 w-24 min-w-0 rounded bg-neutral-200" />
                <div className="xs:flex hidden grow items-center justify-end gap-1.5 text-neutral-500">
                  <CursorRays className="size-3.5" />
                </div>
              </>
            }
            addButton={
              <Link
                href="https://pim.ms/dAXN6jl"
                target="_blank"
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "font-bold transition-all duration-300 hover:scale-105",
                  "mt-4 flex h-9 items-center justify-center rounded border px-4 text-sm",
                )}
              >
                Book a demo call
              </Link>
            }
          />
        )}

        {/* Pagination */}
        {links && (
          <LinksToolbar
            loading={!!loading}
            links={flatLinks || []}
            linksCount={isMegaFolder ? Infinity : totalLinksCount ?? links?.length ?? 0}
          />
        )}
      </LinkSelectionProvider>
    </LinksListContext.Provider>
  );
}
