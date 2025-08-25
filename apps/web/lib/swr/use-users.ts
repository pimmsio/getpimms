import { WorkspaceUserProps } from "@/lib/types";
import { fetcher } from "@dub/utils";
import useSWR from "swr";
import useWorkspace from "./use-workspace";

export default function useUsers({ invites }: { invites?: boolean } = {}) {
  const { id } = useWorkspace();

  const { data: users, error } = useSWR<WorkspaceUserProps[]>(
    id &&
      (invites
        ? `/api/workspaces/${id}/invites`
        : `/api/workspaces/${id}/users`),
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
    users,
    loading: !error && !users,
  };
}
