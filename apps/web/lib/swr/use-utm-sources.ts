import useWorkspace from "./use-workspace";
import { useRouterStuff } from "@dub/ui";
import { fetcher } from "@dub/utils";
import useSWR from "swr";
import z from "../zod";
import { getUtmSourcesQuerySchemaExtended, UTM_PARAMETERS_MAX_PAGE_SIZE } from "../zod/schemas/utm-parameters";

const partialQuerySchema = getUtmSourcesQuerySchemaExtended.partial();

export default function useUtmSources({
  query,
  enabled = true,
}: {
  query?: z.infer<typeof partialQuerySchema>;
  enabled?: boolean;
} = {}) {
  const { id: workspaceId } = useWorkspace();
  const { getQueryString } = useRouterStuff();

  const { data: utmSources, error } = useSWR<
    Array<{
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
    }>
  >(
    workspaceId && enabled
      ? `/api/utm-sources${getQueryString({ workspaceId, ...query })}`
      : null,
    fetcher,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  return {
    utmSources,
    loading: !error && !utmSources,
    error,
  };
}

export function useUtmSourcesCount({
  query,
}: {
  query?: Pick<
    z.infer<typeof getUtmSourcesQuerySchemaExtended>,
    "search" | "sortBy" | "sortOrder"
  >;
} = {}) {
  const { id: workspaceId } = useWorkspace();
  const { getQueryString } = useRouterStuff();

  const { data, error } = useSWR<number>(
    workspaceId
      ? `/api/utm-sources/count${getQueryString({ workspaceId, ...query })}`
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

