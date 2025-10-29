import { fetcher } from "@dub/utils";
import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { z } from "zod";
import { getTagsCountQuerySchema } from "../zod/schemas/tags";
import useWorkspace from "./use-workspace";

const partialQuerySchema = getTagsCountQuerySchema.partial();

export default function useTagsCount({
  query,
}: { query?: z.infer<typeof partialQuerySchema> } = {}) {
  const { id } = useWorkspace();
  const { cache } = useSWRConfig();

  // Detect if we're on admin
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.host.startsWith("admin.")) {
      setIsAdmin(true);
    }
  }, []);

  const endpoint = isAdmin
    ? `/api/admin/tags/count?${new URLSearchParams({ ...query } as Record<string, any>).toString()}`
    : id
      ? `/api/tags/count?${new URLSearchParams({ workspaceId: id, ...query } as Record<string, any>).toString()}`
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
