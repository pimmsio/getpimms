import {
  defaultLinksDisplayProperties,
  LinksDisplayProperty,
  linksDisplayPropertyIds,
  linksGroupByOptions,
  LinksGroupBySlug,
  linksSortOptions,
  LinksSortSlug,
  LinksViewMode,
  linksViewModes,
} from "@/lib/links/links-display";
import { useWorkspacePreferences } from "@/lib/swr/use-workspace-preferences";
import { linksDisplaySchema } from "@/lib/zod/schemas/workspace-preferences";
import { useSearchParams } from "next/navigation";
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useMemo,
  useState,
} from "react";
import { z } from "zod";

type LinksDisplayKey = keyof z.infer<typeof linksDisplaySchema>;
type LinksDisplayValue<K extends LinksDisplayKey> = z.infer<
  typeof linksDisplaySchema
>[K];

function useLinksDisplayOption<K extends LinksDisplayKey>(
  key: K,
  persisted: z.infer<typeof linksDisplaySchema>,
  overrideValue?: LinksDisplayValue<K>,
): [
  LinksDisplayValue<K>,
  Dispatch<SetStateAction<LinksDisplayValue<K>>>,
  () => void,
] {
  const [value, setValue] = useState(overrideValue ?? persisted[key]);

  return [value, setValue, () => setValue(persisted[key])];
}

export const LinksDisplayContext = createContext<{
  viewMode: LinksViewMode;
  setViewMode: Dispatch<SetStateAction<LinksViewMode>>;
  displayProperties: LinksDisplayProperty[];
  setDisplayProperties: Dispatch<SetStateAction<LinksDisplayProperty[]>>;
  sortBy: LinksSortSlug;
  setSort: Dispatch<SetStateAction<LinksSortSlug>>;
  groupBy: LinksGroupBySlug;
  setGroupBy: Dispatch<SetStateAction<LinksGroupBySlug>>;
  showArchived: boolean;
  setShowArchived: Dispatch<SetStateAction<boolean>>;
  isDirty: boolean;
  persist: () => void;
  reset: () => void;
}>({
  viewMode: "cards",
  setViewMode: () => {},
  displayProperties: defaultLinksDisplayProperties,
  setDisplayProperties: () => {},
  sortBy: linksSortOptions[0].slug,
  setSort: () => {},
  groupBy: linksGroupByOptions[0].slug,
  setGroupBy: () => {},
  showArchived: false,
  setShowArchived: () => {},
  /** Whether the current values differ from the persisted values */
  isDirty: false,
  /** Updates the persisted values to the current values */
  persist: () => {},
  /** Resets the current values to the persisted values */
  reset: () => {},
});

const parseSort = (sort: string) =>
  linksSortOptions.find(({ slug }) => slug === sort)?.slug ??
  linksSortOptions[0].slug;

const parseGroupBy = (groupBy: string) =>
  linksGroupByOptions.find(({ slug }) => slug === groupBy)?.slug ??
  linksGroupByOptions[0].slug;

export function LinksDisplayProvider({ children }: PropsWithChildren) {
  const searchParams = useSearchParams();
  const sortRaw = searchParams?.get("sortBy");
  const groupByRaw = searchParams?.get("groupBy");
  const showArchivedRaw = searchParams?.get("showArchived");

  const [persisted, setPersisted] = useWorkspacePreferences("linksDisplay", {
    viewMode: linksViewModes[0],
    sortBy: linksSortOptions[0].slug,
    groupBy: linksGroupByOptions[0].slug,
    showArchived: false,
    displayProperties: defaultLinksDisplayProperties,
  });

  const [viewMode, setViewMode, resetViewMode] = useLinksDisplayOption(
    "viewMode",
    persisted!,
  );

  const [sortBy, setSort, resetSort] = useLinksDisplayOption(
    "sortBy",
    persisted!,
    sortRaw ? parseSort(sortRaw) : undefined,
  );

  const [groupBy, setGroupBy, resetGroupBy] = useLinksDisplayOption(
    "groupBy",
    persisted!,
    groupByRaw ? parseGroupBy(groupByRaw) : undefined,
  );

  const [showArchived, setShowArchived, resetShowArchived] =
    useLinksDisplayOption(
      "showArchived",
      persisted!,
      showArchivedRaw ? showArchivedRaw === "true" : undefined,
    );

  const [rawDisplayProperties, setRawDisplayProperties, resetDisplayProperties] =
    useLinksDisplayOption("displayProperties", persisted!);

  // Filter out old properties that are no longer supported and ensure we have all required ones
  const validPropertyIds = new Set(linksDisplayPropertyIds);
  const filteredProperties = rawDisplayProperties.filter((p) =>
    validPropertyIds.has(p),
  );
  
  // If we filtered out properties or have too few, use defaults (need at least 7: icon + 6 sortable)
  const displayProperties =
    filteredProperties.length >= 7 ? filteredProperties : defaultLinksDisplayProperties;

  // Wrapper to ensure we only set valid properties
  const setDisplayProperties = (
    value: LinksDisplayProperty[] | ((prev: LinksDisplayProperty[]) => LinksDisplayProperty[]),
  ) => {
    const newValue = typeof value === "function" ? value(displayProperties) : value;
    const validValue = newValue.filter((p) => validPropertyIds.has(p));
    setRawDisplayProperties(validValue);
  };

  const isDirty = useMemo(() => {
    if (viewMode !== persisted?.viewMode) return true;
    if (sortBy !== persisted?.sortBy) return true;
    if (groupBy !== persisted?.groupBy) return true;
    if (showArchived !== persisted?.showArchived) return true;
    if (
      displayProperties.join(",") !== persisted?.displayProperties.join(",")
    )
      return true;

    return false;
  }, [
    JSON.stringify(persisted),
    viewMode,
    sortBy,
    groupBy,
    showArchived,
    displayProperties,
  ]);

  return (
    <LinksDisplayContext.Provider
      value={{
        viewMode: viewMode as LinksViewMode,
        setViewMode,
        displayProperties,
        setDisplayProperties,
        sortBy: sortBy as LinksSortSlug,
        setSort,
        groupBy: groupBy as LinksGroupBySlug,
        setGroupBy,
        showArchived,
        setShowArchived,
        isDirty,
        persist: () =>
          setPersisted({
            viewMode,
            sortBy,
            groupBy,
            showArchived,
            displayProperties,
          }),
        reset: () => {
          resetViewMode();
          resetDisplayProperties();
          resetSort();
          resetGroupBy();
          resetShowArchived();
        },
      }}
    >
      {children}
    </LinksDisplayContext.Provider>
  );
}
