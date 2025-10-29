import { useRouterStuff } from "@dub/ui";
import { fetcher } from "@dub/utils";
import useSWR, { useSWRConfig } from "swr";
import useWorkspace from "./use-workspace";

export default function useDomainsCount({
  ignoreParams,
  opts,
}: {
  ignoreParams?: boolean;
  opts?: Record<string, string>;
} = {}) {
  const { id: workspaceId } = useWorkspace();
  const { getQueryString } = useRouterStuff();
  const { cache } = useSWRConfig();

  const endpoint = workspaceId
    ? `/api/domains/count${
        ignoreParams
          ? "?" + new URLSearchParams({ workspaceId, ...opts }).toString()
          : getQueryString({
              workspaceId,
              ...opts,
            })
      }`
    : null;

  const cachedEntry = endpoint ? cache.get(endpoint) : undefined;
  const cacheTimestamp = (cachedEntry as any)?._pimms_cached_at || 0;
  const cacheAge = cacheTimestamp ? Date.now() - cacheTimestamp : Infinity;
  const isCacheFresh = cacheAge < 5 * 60 * 1000; // 5 minutes for domains

  const { data, error } = useSWR<number>(
    endpoint,
    fetcher,
    {
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
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
