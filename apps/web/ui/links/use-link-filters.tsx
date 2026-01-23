import useFolders from "@/lib/swr/use-folders";
import useLinksCount from "@/lib/swr/use-links-count";
import useTags from "@/lib/swr/use-tags";
import useTagsCount from "@/lib/swr/use-tags-count";
import useUrlValues from "@/lib/swr/use-url-values";
import useUsers from "@/lib/swr/use-users";
import useUtmSources from "@/lib/swr/use-utm-sources";
import useUtmMediums from "@/lib/swr/use-utm-mediums";
import useUtmCampaigns from "@/lib/swr/use-utm-campaigns";
import useUtmTerms from "@/lib/swr/use-utm-terms";
import useUtmContents from "@/lib/swr/use-utm-contents";
import useUtmValues from "@/lib/swr/use-utm-values";
import useWorkspace from "@/lib/swr/use-workspace";
import { TagProps } from "@/lib/types";
import { TAGS_MAX_PAGE_SIZE } from "@/lib/zod/schemas/tags";
import { Link4, LinkLogo, Tag, useRouterStuff, UTM_PARAMETERS } from "@dub/ui";
import { getApexDomain } from "@dub/utils";
import { useContext, useMemo, useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { LinksDisplayContext } from "./links-display-provider";
import TagBadge from "./tag-badge";
import { isUtmFilter } from "../analytics/utils/filter-utils";
import { separateActiveFilters } from "../analytics/utils/active-filters";

export function useLinkFilters() {
  const { defaultFolderId } = useWorkspace();
  // Separate state for regular filters
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);

  // Separate state for UTM filters
  const [selectedUtmFilter, setSelectedUtmFilter] = useState<string | null>(null);
  const [utmSearch, setUtmSearch] = useState("");
  const [debouncedUtmSearch] = useDebounce(utmSearch, 500);

  const { searchParams } = useRouterStuff();

  // Decide on the folderId to use (for scoping filters like Destination URL)
  let folderId = searchParams.get("folderId");
  if (folderId) {
    folderId = folderId === "unsorted" ? "" : folderId;
  } else {
    folderId = defaultFolderId ?? "";
  }

  const { queryParams, searchParamsObj } = useRouterStuff();

  const { tags, tagsAsync } = useTagFilterOptions({
    search: selectedFilter === "tagIds" ? debouncedSearch : "",
    // folderId, // COMMENTED OUT: Folder filtering disabled
    enabled: selectedFilter === "tagIds" || Boolean(searchParamsObj.tagIds),
  });

  const domains = useDomainFilterOptions({
    // folderId, // COMMENTED OUT: Folder filtering disabled
    enabled: selectedFilter === "domain" || Boolean(searchParamsObj.domain),
  });

  const users = useUserFilterOptions({
    // folderId, // COMMENTED OUT: Folder filtering disabled
    enabled: selectedFilter === "userId" || Boolean(searchParamsObj.userId),
  });

  // Fetch UTM parameter definitions (from the library)
  const { utmSources } = useUtmSources({
    query: { sortBy: "name", sortOrder: "asc" },
  });

  const { utmMediums } = useUtmMediums({
    query: { sortBy: "name", sortOrder: "asc" },
  });

  const { utmCampaigns } = useUtmCampaigns({
    query: { sortBy: "name", sortOrder: "asc" },
  });

  const { utmTerms } = useUtmTerms({
    query: { sortBy: "name", sortOrder: "asc" },
  });

  const { utmContents } = useUtmContents({
    query: { sortBy: "name", sortOrder: "asc" },
  });

  // Fetch distinct UTM values actually used on links so filters can include
  // non-saved values as well.
  const { options: usedUtmSources } = useUtmValues({
    utmField: "utm_source",
    enabled: true,
  });
  const { options: usedUtmMediums } = useUtmValues({
    utmField: "utm_medium",
    enabled: true,
  });
  const { options: usedUtmCampaigns } = useUtmValues({
    utmField: "utm_campaign",
    enabled: true,
  });
  const { options: usedUtmTerms } = useUtmValues({
    utmField: "utm_term",
    enabled: true,
  });
  const { options: usedUtmContents } = useUtmValues({
    utmField: "utm_content",
    enabled: true,
  });

  const { options: urls } = useUrlValues({
    folderId,
    enabled: true,
  });

  // COMMENTED OUT: Folder filtering disabled
  // const folders = useFolderFilterOptions({
  //   enabled: selectedFilter === "folderId" || Boolean(searchParamsObj.folderId),
  // });

  // Regular filters (excluding UTM)
  const regularFilters = useMemo(() => {
    return [
      {
        key: "tagIds",
        icon: Tag,
        label: "Tag",
        multiple: true,
        shouldFilter: !tagsAsync,
        getOptionIcon: (value, props) => {
          const tagColor =
            props.option?.data?.color ??
            tags?.find(({ id }) => id === value)?.color;
          return tagColor ? (
            <TagBadge color={tagColor} withIcon className="sm:p-1" />
          ) : null;
        },
        options:
          tags?.map(({ id, name, color, count, hideDuringSearch }) => ({
            value: id,
            icon: <TagBadge color={color} withIcon className="sm:p-1" />,
            label: name,
            data: { color },
            right: count,
            hideDuringSearch,
          })) ?? null,
      },
      {
        key: "url",
        icon: Link4,
        label: "Destination URL",
        multiple: true,
        shouldFilter: true,
        getOptionIcon: (value, props) => (
          <LinkLogo
            apexDomain={getApexDomain(value)}
            className="size-4 sm:size-4"
          />
        ),
        getOptionLabel: (value) => {
          return value.replace(/^https?:\/\//, '').replace(/\/$/, '');
        },
        options: urls?.map(({ value, label, count }) => ({
          value,
          label: label.replace(/^https?:\/\//, '').replace(/\/$/, ''),
          right: count,
        })) ?? null,
      },
    ];
  }, [tags, urls, tagsAsync]);

  // UTM filters only – built from the union of:
  // - UTM parameter library (saved values)
  // - distinct values actually used on links (including non-saved ones)
  const utmFilters = useMemo(() => {
    const buildUnionOptions = (
      libraryNames: string[] | null | undefined,
      usedValues: { value: string }[] | null | undefined,
    ) => {
      const lib = libraryNames ?? [];
      const used = (usedValues ?? []).map((o) => o.value);
      const merged = Array.from(
        new Set(
          [...lib, ...used].filter((v) => typeof v === "string" && v.length > 0),
        ),
      );
      return merged.length
        ? merged
          .sort((a, b) => a.localeCompare(b))
          .map((v) => ({ value: v, label: v }))
        : null;
    };

    const sourceOptions = buildUnionOptions(
      utmSources?.map((s) => s.name),
      usedUtmSources,
    );
    const mediumOptions = buildUnionOptions(
      utmMediums?.map((m) => m.name),
      usedUtmMediums,
    );
    const campaignOptions = buildUnionOptions(
      utmCampaigns?.map((c) => c.name),
      usedUtmCampaigns,
    );
    const termOptions = buildUnionOptions(
      utmTerms?.map((t) => t.name),
      usedUtmTerms,
    );
    const contentOptions = buildUnionOptions(
      utmContents?.map((c) => c.name),
      usedUtmContents,
    );

    return UTM_PARAMETERS.filter(({ key }) => key !== "ref").map(
      ({ key, label, icon: Icon }) => ({
        key,
        icon: Icon,
        label: `UTM ${label}`,
        multiple: true,
        shouldFilter: true,
        options:
          key === "utm_source"
            ? sourceOptions
            : key === "utm_medium"
              ? mediumOptions
              : key === "utm_campaign"
                ? campaignOptions
                : key === "utm_term"
                  ? termOptions
                  : key === "utm_content"
                    ? contentOptions
                    : null,
      }),
    );
  }, [
    utmSources,
    utmMediums,
    utmCampaigns,
    utmTerms,
    utmContents,
    usedUtmSources,
    usedUtmMediums,
    usedUtmCampaigns,
    usedUtmTerms,
    usedUtmContents,
  ]);

  // Combined filters for Filter.List
  const filters = useMemo(
    () => [...regularFilters, ...utmFilters],
    [regularFilters, utmFilters],
  );

  const selectedTagIds = useMemo(
    () => searchParamsObj["tagIds"]?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj],
  );

  const selectedUtmSources = useMemo(
    () => searchParamsObj["utm_source"]?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj],
  );

  const selectedUtmMediums = useMemo(
    () => searchParamsObj["utm_medium"]?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj],
  );

  const selectedUtmCampaigns = useMemo(
    () => searchParamsObj["utm_campaign"]?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj],
  );

  const selectedUtmTerms = useMemo(
    () => searchParamsObj["utm_term"]?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj],
  );

  const selectedUtmContents = useMemo(
    () => searchParamsObj["utm_content"]?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj],
  );

  const selectedUrls = useMemo(
    () => searchParamsObj["url"]?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj],
  );

  // Build all active filters
  const activeFilters = useMemo(() => {
    const { tagIds, userId, url, utm_source, utm_medium, utm_campaign, utm_term, utm_content } = searchParamsObj;
    return [
      ...(tagIds ? [{ key: "tagIds", value: selectedTagIds }] : []),
      ...(userId ? [{ key: "userId", value: userId }] : []),
      ...(url ? [{ key: "url", value: selectedUrls }] : []),
      ...(utm_source ? [{ key: "utm_source", value: selectedUtmSources }] : []),
      ...(utm_medium ? [{ key: "utm_medium", value: selectedUtmMediums }] : []),
      ...(utm_campaign ? [{ key: "utm_campaign", value: selectedUtmCampaigns }] : []),
      ...(utm_term ? [{ key: "utm_term", value: selectedUtmTerms }] : []),
      ...(utm_content ? [{ key: "utm_content", value: selectedUtmContents }] : []),
    ];
  }, [searchParamsObj, selectedTagIds, selectedUrls, selectedUtmSources, selectedUtmMediums, selectedUtmCampaigns, selectedUtmTerms, selectedUtmContents]);

  // Separate active filters for each dropdown
  const { regularFilters: activeRegularFilters, utmFilters: activeUtmFilters } =
    useMemo(
      () => separateActiveFilters(activeFilters),
      [activeFilters],
    );


  const onRemoveAll = () => {
    queryParams({
      del: [/* "folderId", */ "tagIds", "userId", "url", "search", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "start", "end", "interval"], // COMMENTED OUT: folderId - Folder filtering disabled
    });
  };

  // Separate handlers for regular and UTM filters
  const onRegularFilterSelect = (key: string, value: any) => {
    if (key === "tagIds") {
      if (selectedTagIds.includes(value)) return;
      queryParams({
        set: {
          tagIds: selectedTagIds.concat(value).join(","),
        },
        del: "page",
      });
    } else if (key === "url") {
      if (selectedUrls.includes(value)) return;
      queryParams({
        set: {
          url: selectedUrls.concat(value).join(","),
        },
        del: "page",
      });
    } else {
      queryParams({
        set: {
          [key]: value,
        },
        del: "page",
      });
    }
  };

  const onRegularFilterRemove = (key: string, value: any) => {
    if (key === "tagIds" && !(selectedTagIds.length === 1 && selectedTagIds[0] === value)) {
      queryParams({
        set: {
          tagIds: selectedTagIds.filter((id) => id !== value).join(","),
        },
        del: "page",
      });
    } else if (key === "url" && !(selectedUrls.length === 1 && selectedUrls[0] === value)) {
      queryParams({
        set: {
          url: selectedUrls.filter((v) => v !== value).join(","),
        },
        del: "page",
      });
    } else {
      queryParams({
        del: [key, "page"],
      });
    }
  };

  const onUtmFilterSelect = (key: string, value: any) => {
    if (key === "utm_source") {
      if (selectedUtmSources.includes(value)) return;
      queryParams({
        set: {
          utm_source: selectedUtmSources.concat(value).join(","),
        },
        del: "page",
      });
    } else if (key === "utm_medium") {
      if (selectedUtmMediums.includes(value)) return;
      queryParams({
        set: {
          utm_medium: selectedUtmMediums.concat(value).join(","),
        },
        del: "page",
      });
    } else if (key === "utm_campaign") {
      if (selectedUtmCampaigns.includes(value)) return;
      queryParams({
        set: {
          utm_campaign: selectedUtmCampaigns.concat(value).join(","),
        },
        del: "page",
      });
    } else if (key === "utm_term") {
      if (selectedUtmTerms.includes(value)) return;
      queryParams({
        set: {
          utm_term: selectedUtmTerms.concat(value).join(","),
        },
        del: "page",
      });
    } else if (key === "utm_content") {
      if (selectedUtmContents.includes(value)) return;
      queryParams({
        set: {
          utm_content: selectedUtmContents.concat(value).join(","),
        },
        del: "page",
      });
    } else {
      queryParams({
        set: {
          [key]: value,
        },
        del: "page",
      });
    }
  };

  const onUtmFilterRemove = (key: string, value: any) => {
    if (key === "utm_source" && !(selectedUtmSources.length === 1 && selectedUtmSources[0] === value)) {
      queryParams({
        set: {
          utm_source: selectedUtmSources.filter((v) => v !== value).join(","),
        },
        del: "page",
      });
    } else if (key === "utm_medium" && !(selectedUtmMediums.length === 1 && selectedUtmMediums[0] === value)) {
      queryParams({
        set: {
          utm_medium: selectedUtmMediums.filter((v) => v !== value).join(","),
        },
        del: "page",
      });
    } else if (key === "utm_campaign" && !(selectedUtmCampaigns.length === 1 && selectedUtmCampaigns[0] === value)) {
      queryParams({
        set: {
          utm_campaign: selectedUtmCampaigns.filter((v) => v !== value).join(","),
        },
        del: "page",
      });
    } else if (key === "utm_term" && !(selectedUtmTerms.length === 1 && selectedUtmTerms[0] === value)) {
      queryParams({
        set: {
          utm_term: selectedUtmTerms.filter((v) => v !== value).join(","),
        },
        del: "page",
      });
    } else if (key === "utm_content" && !(selectedUtmContents.length === 1 && selectedUtmContents[0] === value)) {
      queryParams({
        set: {
          utm_content: selectedUtmContents.filter((v) => v !== value).join(","),
        },
        del: "page",
      });
    } else {
      queryParams({
        del: [key, "page"],
      });
    }
  };

  // Combined handler for Filter.List
  const onRemove = (key: string, value: any) => {
    if (isUtmFilter(key)) {
      onUtmFilterRemove(key, value);
    } else {
      onRegularFilterRemove(key, value);
    }
  };

  return {
    // Filters
    filters,
    regularFilters,
    utmFilters,
    // Active filters
    activeFilters,
    activeRegularFilters,
    activeUtmFilters,
    // Handlers
    onSelect: onRegularFilterSelect, // Keep for backward compatibility
    onRegularFilterSelect,
    onUtmFilterSelect,
    onRemove,
    onRegularFilterRemove,
    onUtmFilterRemove,
    onRemoveAll,
    // State
    setSearch,
    setUtmSearch,
    setSelectedFilter,
    setSelectedUtmFilter,
  };
}

function useTagFilterOptions({
  search,
  // folderId, // COMMENTED OUT: Folder filtering disabled
  enabled,
}: {
  search: string;
  // folderId: string; // COMMENTED OUT: Folder filtering disabled
  enabled: boolean;
}) {
  const { searchParamsObj } = useRouterStuff();

  const tagIds = useMemo(
    () => searchParamsObj.tagIds?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj.tagIds],
  );

  const { data: tagsCount } = useTagsCount();
  const tagsAsync = Boolean(tagsCount && tagsCount > TAGS_MAX_PAGE_SIZE);
  const { tags, loading: loadingTags } = useTags({
    query: { search: tagsAsync ? search : "" },
  });

  const { tags: selectedTags } = useTags({
    query: { ids: tagIds },
    enabled: tagsAsync,
  });
  const { showArchived } = useContext(LinksDisplayContext);

  const { data: tagLinksCount } = useLinksCount<
    {
      tagId: string;
      _count: number;
    }[]
  >({ query: { groupBy: "tagId", showArchived /* , folderId */ }, enabled }); // COMMENTED OUT: folderId - Folder filtering disabled

  const tagsResult = useMemo(() => {
    return loadingTags ||
      // Consider tags loading if we can't find the currently filtered tag
      (tagIds?.length &&
        tagIds.some(
          (id) =>
            ![...(selectedTags ?? []), ...(tags ?? [])].some(
              (t) => t.id === id,
            ),
        ))
      ? null
      : (
        [
          ...(tags ?? []),
          // Add selected tag to list if not already in tags
          ...(selectedTags
            ?.filter((st) => !tags?.some((t) => t.id === st.id))
            ?.map((st) => ({ ...st, hideDuringSearch: true })) ?? []),
        ] as (TagProps & { hideDuringSearch?: boolean })[]
      )
        ?.map((tag) => ({
          ...tag,
          count:
            tagLinksCount?.find(({ tagId }) => tagId === tag.id)?._count || 0,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)) ?? null; // Sort alphabetically by name
  }, [loadingTags, tags, selectedTags, tagLinksCount, tagIds]);

  return { tags: tagsResult, tagsAsync };
}

function useDomainFilterOptions({ /* folderId, */ enabled }: { /* folderId: string, */ enabled: boolean }) { // COMMENTED OUT: Folder filtering disabled
  const { showArchived } = useContext(LinksDisplayContext);

  const { data: domainsCount } = useLinksCount<
    {
      domain: string;
      _count: number;
    }[]
  >({
    query: {
      groupBy: "domain",
      showArchived,
      // folderId, // COMMENTED OUT: Folder filtering disabled
    },
    enabled
  });

  return useMemo(() => {
    if (!domainsCount || domainsCount.length === 0) return [];

    return domainsCount
      .map(({ domain, _count }) => ({
        slug: domain,
        count: _count,
      }))
      .sort((a, b) => a.slug.localeCompare(b.slug)); // Sort alphabetically
  }, [domainsCount]);
}

function useUserFilterOptions({ /* folderId, */ enabled }: { /* folderId: string, */ enabled: boolean }) { // COMMENTED OUT: Folder filtering disabled
  const { users } = useUsers();
  const { showArchived } = useContext(LinksDisplayContext);

  const { data: usersCount } = useLinksCount<
    {
      userId: string;
      _count: number;
    }[]
  >({
    query: {
      groupBy: "userId",
      showArchived,
      // folderId, // COMMENTED OUT: Folder filtering disabled
    },
    enabled
  });

  return useMemo(
    () =>
      users
        ? users
          .map((user) => ({
            ...user,
            count:
              usersCount?.find(({ userId }) => userId === user.id)?._count ||
              0,
          }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || '')) // Sort alphabetically by name
        : usersCount
          ? usersCount.map(({ userId, _count }) => ({
            id: userId,
            name: userId,
            count: _count,
          }))
          : null,
    [users, usersCount],
  );
}

function useFolderFilterOptions({ enabled }: { enabled: boolean }) {
  const { folders } = useFolders({ includeParams: true, includeLinkCount: true });

  return useMemo(() => {
    if (!folders || !enabled) return null;

    return folders
      .map((folder) => ({
        value: folder.id,
        label: folder.name,
        right: folder.linkCount || 0,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically by name
  }, [folders, enabled]);
}
