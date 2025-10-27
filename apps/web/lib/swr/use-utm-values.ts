import { useRouterStuff } from "@dub/ui";
import { fetcher } from "@dub/utils";
import { useMemo } from "react";
import useSWR from "swr";
import useWorkspace from "./use-workspace";

type UtmField = "utm_source" | "utm_medium" | "utm_campaign" | "utm_term" | "utm_content";

export default function useUtmValues({
  utmField,
  folderId,
  enabled = true,
}: {
  utmField: UtmField;
  folderId: string;
  enabled: boolean;
}) {
  const { id: workspaceId } = useWorkspace();
  const { getQueryString } = useRouterStuff();

  const queryString = getQueryString(
    {
      workspaceId,
      groupBy: utmField,
      folderId,
    },
    { include: [] },
  );

  const { data, error } = useSWR<
    Array<{
      [key in UtmField]: string | null;
    } & {
      _count: number;
    }>
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
        value: item[utmField] || "",
        label: item[utmField] || "(empty)",
        count: item._count,
      }))
      .filter((item) => item.value !== "") // Filter out empty values
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [data, utmField]);

  return {
    options,
    loading: !error && !data,
    error,
  };
}

