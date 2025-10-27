import { useRouterStuff } from "@dub/ui";
import { fetcher } from "@dub/utils";
import { useMemo } from "react";
import useSWR from "swr";
import useWorkspace from "./use-workspace";

export default function useUrlValues({
  folderId,
  enabled = true,
}: {
  folderId: string;
  enabled: boolean;
}) {
  const { id: workspaceId } = useWorkspace();
  const { getQueryString } = useRouterStuff();

  const queryString = getQueryString(
    {
      workspaceId,
      groupBy: "url",
      folderId,
    },
    { include: [] },
  );

  const { data, error } = useSWR<
    {
      url: string;
      _count: number;
    }[]
  >(
    workspaceId && enabled ? `/api/links/count${queryString}` : null,
    fetcher,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
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

