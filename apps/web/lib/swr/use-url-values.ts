import { normalizeUrlToBaseUrl } from "@/lib/api/links/utils/filter-helpers";
import { useRouterStuff } from "@dub/ui";
import { fetcher } from "@dub/utils";
import { useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import useWorkspace from "./use-workspace";

export default function useUrlValues({
  folderId,
  enabled = true,
}: {
  folderId?: string; // COMMENTED OUT: Folder filtering disabled - made optional
  enabled: boolean;
}) {
  const { id: workspaceId } = useWorkspace();
  const { getQueryString } = useRouterStuff();
  const { cache } = useSWRConfig();

  const queryString = getQueryString(
    {
      workspaceId,
      groupBy: "url",
      ...(folderId && { folderId }), // COMMENTED OUT: Folder filtering disabled - only include if provided
    },
    { include: [] },
  );

  const endpoint = workspaceId && enabled ? `/api/links/count${queryString}` : null;

  const cachedEntry = endpoint ? cache.get(endpoint) : undefined;
  const cacheTimestamp = (cachedEntry as any)?._pimms_cached_at || 0;
  const cacheAge = cacheTimestamp ? Date.now() - cacheTimestamp : Infinity;
  const isCacheFresh = cacheAge < 60000;

  const { data, error } = useSWR<
    {
      url: string;
      _count: number;
    }[]
  >(
    endpoint,
    fetcher,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: !isCacheFresh,
      keepPreviousData: true,
    },
  );

  const options = useMemo(() => {
    if (!data) return null;

    // Group URLs by normalized base URL (strip query parameters, hash, trailing slash),
    // which matches how filters are applied on baseUrl in the API.
    const urlMap = new Map<string, { baseUrl: string; count: number }>();

    data.forEach((item) => {
      const rawUrl = item.url || "";
      if (!rawUrl) return;

      const baseUrl = normalizeUrlToBaseUrl(rawUrl);

      const existing = urlMap.get(baseUrl);
      if (existing) {
        urlMap.set(baseUrl, {
          baseUrl: existing.baseUrl,
          count: existing.count + item._count,
        });
      } else {
        urlMap.set(baseUrl, {
          baseUrl,
          count: item._count,
        });
      }
    });

    return Array.from(urlMap.values())
      .map(({ baseUrl, count }) => ({
        value: baseUrl, // Use normalized base URL for filter value
        label: baseUrl.replace(/^https?:\/\//, ""), // Display without protocol
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
  }, [data]);

  return {
    options,
    loading: !error && !data,
    error,
  };
}

