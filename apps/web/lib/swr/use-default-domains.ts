import { fetcher } from "@dub/utils";
import { useMemo } from "react";
import useSWR from "swr";
import useWorkspace from "./use-workspace";

export default function useDefaultDomains(opts: { search?: string } = {}) {
  const { id: workspaceId, flags } = useWorkspace();

  const { data, error, mutate } = useSWR<
    Array<{
      slug: string;
      isDefaultDomain: true;
    }>
  >(
    workspaceId &&
      `/api/domains/default?${new URLSearchParams({
        workspaceId,
        ...(opts.search && { search: opts.search }),
      }).toString()}`,
    fetcher,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  const defaultDomains = useMemo(() => {
    return data;
  }, [data, flags]);

  return {
    defaultDomains,
    loading: !data && !error,
    mutate,
    error,
  };
}
