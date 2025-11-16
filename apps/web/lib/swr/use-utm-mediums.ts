import useWorkspace from "./use-workspace";
import { useRouterStuff } from "@dub/ui";
import { fetcher } from "@dub/utils";
import useSWR from "swr";
import z from "../zod";
import { getUtmMediumsQuerySchemaExtended, UTM_PARAMETERS_MAX_PAGE_SIZE } from "../zod/schemas/utm-parameters";

const partialQuerySchema = getUtmMediumsQuerySchemaExtended.partial();

export default function useUtmMediums({
  query,
  enabled = true,
}: {
  query?: z.infer<typeof partialQuerySchema>;
  enabled?: boolean;
} = {}) {
  const { id: workspaceId } = useWorkspace();
  const { getQueryString } = useRouterStuff();

  const { data: utmMediums, error, mutate } = useSWR<
    Array<{
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
    }>
  >(
    workspaceId && enabled
      ? `/api/utm-mediums${getQueryString({ workspaceId, ...query })}`
      : null,
    fetcher,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  return {
    utmMediums,
    loading: !error && !utmMediums,
    error,
    mutate,
  };
}

export function useUtmMediumsCount({
  query,
}: {
  query?: Pick<
    z.infer<typeof getUtmMediumsQuerySchemaExtended>,
    "search" | "sortBy" | "sortOrder"
  >;
} = {}) {
  const { id: workspaceId } = useWorkspace();
  const { getQueryString } = useRouterStuff();

  const { data, error } = useSWR<number>(
    workspaceId
      ? `/api/utm-mediums/count${getQueryString({ workspaceId, ...query })}`
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

