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

    // Group URLs by normalized path (strip query parameters and hash)
    const urlMap = new Map<string, { fullUrl: string; count: number }>();
    
    data.forEach((item) => {
      const fullUrl = item.url || "";
      if (!fullUrl) return;
      
      // Normalize URL for grouping: strip query params, hash, trailing slash
      let normalizedKey = fullUrl
        .split('?')[0]    // Remove query params
        .split('#')[0]    // Remove hash
        .replace(/\/$/, '');  // Remove trailing slash
      
      const existing = urlMap.get(normalizedKey);
      if (existing) {
        urlMap.set(normalizedKey, {
          fullUrl: existing.fullUrl, // Keep first full URL encountered
          count: existing.count + item._count,
        });
      } else {
        urlMap.set(normalizedKey, {
          fullUrl: fullUrl.split('?')[0].split('#')[0].replace(/\/$/, ''), // Clean full URL
          count: item._count,
        });
      }
    });

    return Array.from(urlMap.values())
      .map(({ fullUrl, count }) => ({
        value: fullUrl, // Use full URL for filter value
        label: fullUrl.replace(/^https?:\/\//, ''), // Display without protocol
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

