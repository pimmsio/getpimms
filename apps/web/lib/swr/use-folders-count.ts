import { useRouterStuff } from "@dub/ui";
import { fetcher } from "@dub/utils";
import useSWR, { useSWRConfig } from "swr";
import useWorkspace from "./use-workspace";

export default function useFoldersCount({
  includeParams = false,
  query,
}: {
  includeParams?: boolean;
  query?: Record<string, any>;
} = {}) {
  const { id: workspaceId, plan, flags } = useWorkspace();
  const { cache } = useSWRConfig();

  const { getQueryString } = useRouterStuff();

  const qs = getQueryString(
    { workspaceId, ...query },
    { include: includeParams ? ["search"] : [] },
  );

  const endpoint =
    workspaceId && flags?.linkFolders && plan !== "free"
      ? `/api/folders/count${qs}`
      : null;

  const cachedEntry = endpoint ? cache.get(endpoint) : undefined;
  const cacheTimestamp = (cachedEntry as any)?._pimms_cached_at || 0;
  const cacheAge = cacheTimestamp ? Date.now() - cacheTimestamp : Infinity;
  const isCacheFresh = cacheAge < 60000;

  const { data, error } = useSWR<number>(
    endpoint,
    fetcher,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      revalidateIfStale: !isCacheFresh,
      keepPreviousData: true,
    },
  );

  return {
    data,
    loading: !error && data === undefined,
    error,
  };
}
