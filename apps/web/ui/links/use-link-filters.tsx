import useFolders from "@/lib/swr/use-folders";
import useLinksCount from "@/lib/swr/use-links-count";
import useTags from "@/lib/swr/use-tags";
import useTagsCount from "@/lib/swr/use-tags-count";
import useUrlValues from "@/lib/swr/use-url-values";
import useUsers from "@/lib/swr/use-users";
import useUtmValues from "@/lib/swr/use-utm-values";
import useWorkspace from "@/lib/swr/use-workspace";
import { TagProps } from "@/lib/types";
import { TAGS_MAX_PAGE_SIZE } from "@/lib/zod/schemas/tags";
import { Avatar, BlurImage, Globe, Link4, Tag, User, useRouterStuff } from "@dub/ui";
import { getPrettyUrl, GOOGLE_FAVICON_URL } from "@dub/utils";
import { useContext, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { LinksDisplayContext } from "./links-display-provider";
import TagBadge from "./tag-badge";
import { FolderIcon } from "lucide-react";

export function useLinkFilters() {
  const { defaultFolderId } = useWorkspace();
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);
  const { searchParams } = useRouterStuff();

  // Decide on the folderId to use
  let folderId = searchParams.get("folderId");
  if (folderId) {
    folderId = folderId === "unsorted" ? "" : folderId;
  } else {
    folderId = defaultFolderId ?? "";
  }

  const { queryParams, searchParamsObj } = useRouterStuff();

  const { tags, tagsAsync } = useTagFilterOptions({
    search: selectedFilter === "tagIds" ? debouncedSearch : "",
    folderId,
    enabled: selectedFilter === "tagIds" || Boolean(searchParamsObj.tagIds),
  });

  const domains = useDomainFilterOptions({
    folderId,
    enabled: selectedFilter === "domain" || Boolean(searchParamsObj.domain),
  });

  const users = useUserFilterOptions({
    folderId,
    enabled: selectedFilter === "userId" || Boolean(searchParamsObj.userId),
  });

  const { options: utmSources } = useUtmValues({
    utmField: "utm_source",
    folderId,
    enabled: selectedFilter === "utm_source" || Boolean(searchParamsObj.utm_source),
  });

  const { options: utmMediums } = useUtmValues({
    utmField: "utm_medium",
    folderId,
    enabled: selectedFilter === "utm_medium" || Boolean(searchParamsObj.utm_medium),
  });

  const { options: utmCampaigns } = useUtmValues({
    utmField: "utm_campaign",
    folderId,
    enabled: selectedFilter === "utm_campaign" || Boolean(searchParamsObj.utm_campaign),
  });

  const { options: utmTerms } = useUtmValues({
    utmField: "utm_term",
    folderId,
    enabled: selectedFilter === "utm_term" || Boolean(searchParamsObj.utm_term),
  });

  const { options: utmContents } = useUtmValues({
    utmField: "utm_content",
    folderId,
    enabled: selectedFilter === "utm_content" || Boolean(searchParamsObj.utm_content),
  });

  const { options: urls } = useUrlValues({
    folderId,
    enabled: selectedFilter === "url" || Boolean(searchParamsObj.url),
  });

  const folders = useFolderFilterOptions({
    enabled: selectedFilter === "folderId" || Boolean(searchParamsObj.folderId),
  });

  const filters = useMemo(() => {
    return [
      {
        key: "folderId",
        icon: FolderIcon,
        label: "Folder",
        options: folders ?? null,
      },
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
        key: "domain",
        icon: Globe,
        label: "Domain",
        getOptionIcon: (value) => (
          <BlurImage
            src={`${GOOGLE_FAVICON_URL}${value}`}
            alt={value}
            className="h-4 w-4 rounded-full"
            width={16}
            height={16}
          />
        ),
        options: domains.map(({ slug, count }) => ({
          value: slug,
          label: slug,
          right: count,
        })),
      },
      {
        key: "userId",
        icon: User,
        label: "Creator",
        options:
          // @ts-expect-error
          users?.map(({ id, name, email, image, count }) => ({
            value: id,
            label: name || email,
            icon: (
              <Avatar
                user={{
                  id,
                  name,
                  image,
                }}
                className="h-4 w-4"
              />
            ),
            right: count,
          })) ?? null,
      },
      {
        key: "url",
        icon: Link4,
        label: "Destination URL",
        multiple: true,
        options: urls?.map(({ value, label, count }) => ({
          value,
          label: getPrettyUrl(label),
          right: count,
        })) ?? null,
      },
      {
        key: "utm_source",
        icon: Tag,
        label: "UTM Source",
        multiple: true,
        options: utmSources ?? null,
      },
      {
        key: "utm_medium",
        icon: Tag,
        label: "UTM Medium",
        multiple: true,
        options: utmMediums ?? null,
      },
      {
        key: "utm_campaign",
        icon: Tag,
        label: "UTM Campaign",
        multiple: true,
        options: utmCampaigns ?? null,
      },
      {
        key: "utm_term",
        icon: Tag,
        label: "UTM Term",
        multiple: true,
        options: utmTerms ?? null,
      },
      {
        key: "utm_content",
        icon: Tag,
        label: "UTM Content",
        multiple: true,
        options: utmContents ?? null,
      },
    ];
  }, [folders, tags, urls, utmSources, utmMediums, utmCampaigns, utmTerms, utmContents, tagsAsync]);

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

  const activeFilters = useMemo(() => {
    const { domain, tagIds, userId, url, utm_source, utm_medium, utm_campaign, utm_term, utm_content } = searchParamsObj;
    return [
      ...(domain ? [{ key: "domain", value: domain }] : []),
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

  const onSelect = (key: string, value: any) => {
    if (key === "tagIds") {
      queryParams({
        set: {
          tagIds: selectedTagIds.concat(value).join(","),
        },
        del: "page",
      });
    } else if (key === "url") {
      queryParams({
        set: {
          url: selectedUrls.concat(value).join(","),
        },
        del: "page",
      });
    } else if (key === "utm_source") {
      queryParams({
        set: {
          utm_source: selectedUtmSources.concat(value).join(","),
        },
        del: "page",
      });
    } else if (key === "utm_medium") {
      queryParams({
        set: {
          utm_medium: selectedUtmMediums.concat(value).join(","),
        },
        del: "page",
      });
    } else if (key === "utm_campaign") {
      queryParams({
        set: {
          utm_campaign: selectedUtmCampaigns.concat(value).join(","),
        },
        del: "page",
      });
    } else if (key === "utm_term") {
      queryParams({
        set: {
          utm_term: selectedUtmTerms.concat(value).join(","),
        },
        del: "page",
      });
    } else if (key === "utm_content") {
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

  const onRemove = (key: string, value: any) => {
    if (
      key === "tagIds" &&
      !(selectedTagIds.length === 1 && selectedTagIds[0] === value)
    ) {
      queryParams({
        set: {
          tagIds: selectedTagIds.filter((id) => id !== value).join(","),
        },
        del: "page",
      });
    } else if (
      key === "url" &&
      !(selectedUrls.length === 1 && selectedUrls[0] === value)
    ) {
      queryParams({
        set: {
          url: selectedUrls.filter((v) => v !== value).join(","),
        },
        del: "page",
      });
    } else if (
      key === "utm_source" &&
      !(selectedUtmSources.length === 1 && selectedUtmSources[0] === value)
    ) {
      queryParams({
        set: {
          utm_source: selectedUtmSources.filter((v) => v !== value).join(","),
        },
        del: "page",
      });
    } else if (
      key === "utm_medium" &&
      !(selectedUtmMediums.length === 1 && selectedUtmMediums[0] === value)
    ) {
      queryParams({
        set: {
          utm_medium: selectedUtmMediums.filter((v) => v !== value).join(","),
        },
        del: "page",
      });
    } else if (
      key === "utm_campaign" &&
      !(selectedUtmCampaigns.length === 1 && selectedUtmCampaigns[0] === value)
    ) {
      queryParams({
        set: {
          utm_campaign: selectedUtmCampaigns.filter((v) => v !== value).join(","),
        },
        del: "page",
      });
    } else if (
      key === "utm_term" &&
      !(selectedUtmTerms.length === 1 && selectedUtmTerms[0] === value)
    ) {
      queryParams({
        set: {
          utm_term: selectedUtmTerms.filter((v) => v !== value).join(","),
        },
        del: "page",
      });
    } else if (
      key === "utm_content" &&
      !(selectedUtmContents.length === 1 && selectedUtmContents[0] === value)
    ) {
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

  const onRemoveAll = () => {
    queryParams({
      del: ["folderId", "tagIds", "domain", "userId", "url", "search", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "start", "end", "interval"],
    });
  };

  return {
    filters,
    activeFilters,
    onSelect,
    onRemove,
    onRemoveAll,
    setSearch,
    setSelectedFilter,
  };
}

function useTagFilterOptions({
  search,
  folderId,
  enabled,
}: {
  search: string;
  folderId: string;
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
  >({ query: { groupBy: "tagId", showArchived, folderId }, enabled });

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

function useDomainFilterOptions({ folderId, enabled }: { folderId: string, enabled: boolean }) {
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
      folderId,
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

function useUserFilterOptions({ folderId, enabled }: { folderId: string, enabled: boolean }) {
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
      folderId,
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
