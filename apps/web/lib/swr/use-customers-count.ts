import { fetcher } from "@dub/utils";
import useSWR, { useSWRConfig } from "swr";
import useWorkspace from "./use-workspace";

export default function useCustomersCount() {
  const { id: workspaceId } = useWorkspace();
  const { cache } = useSWRConfig();

  const endpoint = workspaceId ? `/api/customers/count?workspaceId=${workspaceId}` : null;

  const cachedEntry = endpoint ? cache.get(endpoint) : undefined;
  const cacheTimestamp = (cachedEntry as any)?._pimms_cached_at || 0;
  const cacheAge = cacheTimestamp ? Date.now() - cacheTimestamp : Infinity;
  const isCacheFresh = cacheAge < 5 * 60 * 1000; // 5 minutes for customers

  const { data, error, isLoading } = useSWR<number>(
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
    error,
    isLoading,
  };
}
