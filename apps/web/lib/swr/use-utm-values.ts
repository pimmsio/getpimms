import { useRouterStuff } from "@dub/ui";
import { fetcher } from "@dub/utils";
import { useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import useWorkspace from "./use-workspace";

type UtmField = "utm_source" | "utm_medium" | "utm_campaign" | "utm_term" | "utm_content";

export default function useUtmValues({
  utmField,
  folderId,
  enabled = true,
}: {
  utmField: UtmField;
  folderId?: string; // COMMENTED OUT: Folder filtering disabled - made optional
  enabled: boolean;
}) {
  const { id: workspaceId } = useWorkspace();
  const { getQueryString } = useRouterStuff();
  const { cache } = useSWRConfig();

  const queryString = getQueryString(
    {
      workspaceId,
      groupBy: utmField,
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
    Array<{
      [key in UtmField]: string | null;
    } & {
      _count: number;
    }>
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

    return data
      .map((item) => ({
        value: item[utmField] || "",
        label: item[utmField] || "(empty)",
        count: item._count,
      }))
      .filter((item) => item.value !== "") // Filter out empty values
      .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
  }, [data, utmField]);

  return {
    options,
    loading: !error && !data,
    error,
  };
}

