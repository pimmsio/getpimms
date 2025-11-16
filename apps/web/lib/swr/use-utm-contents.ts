import useWorkspace from "./use-workspace";
import { useRouterStuff } from "@dub/ui";
import { fetcher } from "@dub/utils";
import useSWR from "swr";
import z from "../zod";
import { getUtmContentsQuerySchemaExtended, UTM_PARAMETERS_MAX_PAGE_SIZE } from "../zod/schemas/utm-parameters";

const partialQuerySchema = getUtmContentsQuerySchemaExtended.partial();

export default function useUtmContents({
  query,
  enabled = true,
}: {
  query?: z.infer<typeof partialQuerySchema>;
  enabled?: boolean;
} = {}) {
  const { id: workspaceId } = useWorkspace();
  const { getQueryString } = useRouterStuff();

  const { data: utmContents, error, mutate } = useSWR<
    Array<{
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
    }>
  >(
    workspaceId && enabled
      ? `/api/utm-contents${getQueryString({ workspaceId, ...query })}`
      : null,
    fetcher,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  return {
    utmContents,
    loading: !error && !utmContents,
    error,
    mutate,
  };
}

export function useUtmContentsCount({
  query,
}: {
  query?: Pick<
    z.infer<typeof getUtmContentsQuerySchemaExtended>,
    "search" | "sortBy" | "sortOrder"
  >;
} = {}) {
  const { id: workspaceId } = useWorkspace();
  const { getQueryString } = useRouterStuff();

  const { data, error } = useSWR<number>(
    workspaceId
      ? `/api/utm-contents/count${getQueryString({ workspaceId, ...query })}`
      : null,
    fetcher,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  return {
    data,
    loading: !error && data === undefined,
    error,
  };
}

