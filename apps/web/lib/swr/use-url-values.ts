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

    return data
      .map((item) => ({
        value: item.url || "",
        label: item.url || "(empty)",
        count: item._count,
      }))
      .filter((item) => item.value !== "") // Filter out empty values
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [data]);

  return {
    options,
    loading: !error && !data,
    error,
  };
}

