import { fetcher } from "@dub/utils";
import useSWR from "swr";
import useWorkspace from "./use-workspace";

export default function useCustomersCount() {
  const { id: workspaceId } = useWorkspace();

  const { data, error, isLoading } = useSWR<number>(
    !!workspaceId ? `/api/customers/count?workspaceId=${workspaceId}`: undefined,
    fetcher,
    {
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      keepPreviousData: true,
    },
  );

  return {
    data,
    error,
    isLoading,
  };
}
