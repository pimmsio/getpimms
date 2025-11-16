import useWorkspace from "./use-workspace";
import { useRouterStuff } from "@dub/ui";
import { fetcher } from "@dub/utils";
import useSWR from "swr";
import z from "../zod";
import { getUtmCampaignsQuerySchemaExtended, UTM_PARAMETERS_MAX_PAGE_SIZE } from "../zod/schemas/utm-parameters";

const partialQuerySchema = getUtmCampaignsQuerySchemaExtended.partial();

export default function useUtmCampaigns({
  query,
  enabled = true,
}: {
  query?: z.infer<typeof partialQuerySchema>;
  enabled?: boolean;
} = {}) {
  const { id: workspaceId } = useWorkspace();
  const { getQueryString } = useRouterStuff();

  const { data: utmCampaigns, error, mutate } = useSWR<
    Array<{
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
    }>
  >(
    workspaceId && enabled
      ? `/api/utm-campaigns${getQueryString({ workspaceId, ...query })}`
      : null,
    fetcher,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  return {
    utmCampaigns,
    loading: !error && !utmCampaigns,
    error,
    mutate,
  };
}

export function useUtmCampaignsCount({
  query,
}: {
  query?: Pick<
    z.infer<typeof getUtmCampaignsQuerySchemaExtended>,
    "search" | "sortBy" | "sortOrder"
  >;
} = {}) {
  const { id: workspaceId } = useWorkspace();
  const { getQueryString } = useRouterStuff();

  const { data, error } = useSWR<number>(
    workspaceId
      ? `/api/utm-campaigns/count${getQueryString({ workspaceId, ...query })}`
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

