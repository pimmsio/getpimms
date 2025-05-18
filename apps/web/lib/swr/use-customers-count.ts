import { fetcher } from "@dub/utils";
import useSWR from "swr";
import useWorkspace from "./use-workspace";

export default function useCustomersCount() {
  const { id: workspaceId } = useWorkspace();

  const { data, error } = useSWR<number>(
    !!workspaceId ? `/api/customers/count?workspaceId=${workspaceId}`: undefined,
    fetcher,
  );

  return {
    data,
    error,
  };
}
